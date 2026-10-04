const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Admin SDK
admin.initializeApp();

/**
 * Global Options for v2 Functions
 * Set standard region and concurrency for all functions in this file
 */
setGlobalOptions({
  region: "asia-south1", 
});

/**
 * Helper to capitalize words for SEO presentation
 */
function toTitleCase(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

/**
 * Safely decodes a URI component without throwing errors on malformed input
 */
function safeDecode(val) {
  if (!val || typeof val !== 'string') return '';
  try {
    return decodeURIComponent(val);
  } catch {
    return val;
  }
}

/**
 * Escapes characters for safe inclusion in HTML attributes and content
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Converts photo storage paths or URLs into canonical CDN delivery URLs
 */
function getImageUrlByQuality(url, quality = 'web') {
  if (!url || typeof url !== 'string') return '';
  const targetQuality = quality.toLowerCase();

  // If already full CDN URL
  if (url.startsWith('https://cdn.fotoflow.co/')) {
    if (url.includes('/covers/')) return url;
    for (const prefix of ['web', 'thumb', 'original']) {
      if (url.startsWith(`https://cdn.fotoflow.co/${prefix}/`)) {
        return url.replace(`https://cdn.fotoflow.co/${prefix}/`, `https://cdn.fotoflow.co/${targetQuality}/`);
      }
    }
    return url;
  }

  // Handle Firebase Storage URLs (Production & Emulator) and convert to CDN
  const storageMatch = url.match(/\/v0\/b\/([^/]+)\/o\/([^?#]+)/);
  if (storageMatch) {
    let rawPath = decodeURIComponent(storageMatch[2]);
    if (rawPath.startsWith('covers/')) {
      return `https://cdn.fotoflow.co/${rawPath}`;
    }
    for (const prefix of ['web', 'thumb', 'original']) {
      if (rawPath.startsWith(prefix + '/')) {
        rawPath = rawPath.replace(prefix + '/', `${targetQuality}/`);
        break;
      }
    }
    return `https://cdn.fotoflow.co/${rawPath}`;
  }

  // Handle encoded storage URL pattern
  const encodedMatch = url.match(/\/o\/(covers|web|thumb|original)%2F/i);
  if (encodedMatch) {
    if (encodedMatch[1].toLowerCase() === 'covers') return url;
    return url.replace(/\/o\/(web|thumb|original)%2F/i, `/o/${targetQuality}%2F`);
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  const cleanPath = url.replace(/^\/+/, '');
  return `https://cdn.fotoflow.co/${cleanPath}`;
}

/**
 * Extracts and decodes route parameters from gallery request
 */
function parseGalleryRequest(req) {
  let pathParts = req.path.split('/').filter(Boolean);
  if (pathParts[0] === 'serveGallery') {
    pathParts.shift();
  }

  const studioName = safeDecode(pathParts[0]);
  const routeType = pathParts[1] || '';
  const projectId = safeDecode(pathParts[2]);
  const collectionId = pathParts[3] ? safeDecode(pathParts[3]) : null;

  const queryIndex = req.url.indexOf('?');
  const queryString = queryIndex !== -1 ? req.url.slice(queryIndex) : '';

  return { studioName, routeType, projectId, collectionId, queryString };
}

/**
 * Checks if request came to the app domain vs marketing domain
 */
function isAppDomain(req) {
  const forwardedHost = req.headers['x-forwarded-host'];
  const hostHeader = req.headers.host;
  const rawHost = forwardedHost || hostHeader || '';
  const host = rawHost.split(':')[0].toLowerCase();

  // Explicit marketing domain check (fotoflow.co / fotoflow-marketing)
  if (host === 'fotoflow.co' || host === 'www.fotoflow.co' || host.includes('fotoflow-marketing')) {
    return false;
  }

  // Local development or app domain
  if (host === 'app.fotoflow.co' || host.includes('fotoflow-studio') || host === 'localhost' || host === '127.0.0.1') {
    return true;
  }

  return !host.includes('fotoflow.co');
}

/**
 * Generates canonical gallery destination URL on app.fotoflow.co
 */
function buildDestinationUrl({ studioName, projectId, collectionId, queryString = '' }) {
  const cleanStudio = studioName || '';
  const cleanProject = projectId || '';
  const collectionSuffix = collectionId ? `/${collectionId}` : '';
  const targetPath = `/${cleanStudio}/smart-gallery/${cleanProject}${collectionSuffix}`;
  return `https://app.fotoflow.co${encodeURI(targetPath)}${queryString}`;
}

/**
 * Retrieves gallery metadata from Firestore.
 * Also resolves studio operational status (domain → studio → studio.status)
 * so suspended/inactive studios can be denied at the serving layer.
 */
async function fetchGalleryMetadata(studioName, projectId, collectionId) {
  const defaults = {
    title: 'Smart Gallery | Fotoflow',
    description: 'View your professional photo gallery on FotoFlow.',
    image: '',
    studioStatus: 'active',
    blocked: false,
    blockReason: null,
  };

  if (!studioName || !projectId) {
    return defaults;
  }

  try {
    const db = admin.firestore();

    // Studio-status enforcement: Studio allowed + Project allowed + Collection
    // allowed → gallery visible. Suspended/inactive studios are blocked even
    // when the collection itself is active. This is the server-side boundary
    // that cannot be bypassed by calling client endpoints directly.
    if (studioName) {
      try {
        const studioDoc = await db.collection('studios').doc(studioName).get();
        if (studioDoc.exists) {
          const studioStatus = String(studioDoc.data()?.status || 'active').toLowerCase();
          defaults.studioStatus = studioStatus;
          if (studioStatus === 'suspended' || studioStatus === 'inactive') {
            defaults.blocked = true;
            defaults.blockReason = studioStatus === 'suspended' ? 'studio-suspended' : 'studio-inactive';
            defaults.title = 'Gallery Unavailable | Fotoflow';
            defaults.description = 'This gallery is currently unavailable.';
            return defaults;
          }
        }
      } catch (studioErr) {
        console.error('[serveGallery] Studio status check error:', studioErr);
      }
    }

    const projectDoc = await db
      .collection('studios')
      .doc(studioName)
      .collection('projects')
      .doc(projectId)
      .get();

    if (!projectDoc.exists) {
      console.warn(`[serveGallery] Project not found: studios/${studioName}/projects/${projectId}`);
      return defaults;
    }

    const project = projectDoc.data();
    const studioTitle = toTitleCase(studioName);
    const projectName = toTitleCase(project.name || 'Gallery');
    const projectType = project.type ? toTitleCase(project.type) : 'Photo';

    let title = `${projectName}'s ${projectType} Gallery | ${studioTitle}`;
    let description = `${projectType} photo gallery by ${studioTitle} on FotoFlow.`;
    let rawCover = project.projectCover || '';

    if (collectionId) {
      const colDoc = await db
        .collection('studios')
        .doc(studioName)
        .collection('projects')
        .doc(projectId)
        .collection('collections')
        .doc(collectionId)
        .get();

      if (colDoc.exists) {
        const colData = colDoc.data();
        if (colData.name) {
          title = `${toTitleCase(colData.name)} - ${projectName} | ${studioTitle}`;
          description = `${toTitleCase(colData.name)} from ${projectName}'s ${projectType} gallery by ${studioTitle}.`;
        }
        if (colData.projectCover || colData.coverPhoto) {
          rawCover = colData.projectCover || colData.coverPhoto;
        }
      }
    }

    const image = rawCover ? getImageUrlByQuality(rawCover, 'web') : '';
    return { title, description, image };
  } catch (err) {
    console.error('[serveGallery] Firestore error:', err);
    return defaults;
  }
}

/**
 * Renders a generic blocked-gallery page (no admin details exposed).
 */
function renderBlockedPage({ title }) {
  const safeTitle = escapeHtml(title || 'Gallery Unavailable');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <meta name="robots" content="noindex, nofollow" />
  <link rel="icon" href="/favicon.png" />
  <style>
    body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0b0f19; color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center; }
    .wrapper { max-width: 480px; padding: 32px 24px; }
    h1 { font-size: 20px; font-weight: 600; margin: 0 0 8px 0; }
    p { font-size: 14px; color: #9ca3af; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <h1>${safeTitle}</h1>
    <p>This gallery is currently unavailable. Please contact the studio for assistance.</p>
  </div>
</body>
</html>`;
}

/**
 * Renders dedicated SEO page with instant JavaScript redirect for fotoflow.co
 */
function renderRedirectPage({ title, description, image, destinationUrl }) {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeUrl = escapeHtml(destinationUrl);
  const safeImage = escapeHtml(image);
  const destinationJs = JSON.stringify(destinationUrl).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />
  <link rel="canonical" href="${safeUrl}" />

  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Fotoflow" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:url" content="${safeUrl}" />
  ${safeImage ? `<meta property="og:image" content="${safeImage}" />` : ''}
  ${safeImage ? `<meta property="og:image:secure_url" content="${safeImage}" />` : ''}
  ${safeImage ? `<meta property="og:image:alt" content="${safeTitle}" />` : ''}

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@fotoflow" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:url" content="${safeUrl}" />
  ${safeImage ? `<meta name="twitter:image" content="${safeImage}" />` : ''}

  <link rel="icon" href="/favicon.png" />

  <!-- Instant Browser Redirect to App -->
  <script>
    window.location.replace(${destinationJs});
  </script>
  <noscript>
    <meta http-equiv="refresh" content="0; url=${safeUrl}" />
  </noscript>
  <style>
    body {
      margin: 0;
      padding: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #0b0f19;
      color: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      text-align: center;
    }
    .wrapper {
      max-width: 480px;
      padding: 32px 24px;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(255, 255, 255, 0.15);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 20px auto;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h1 {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 8px 0;
    }
    p {
      font-size: 14px;
      color: #9ca3af;
      margin: 0 0 20px 0;
    }
    a {
      display: inline-block;
      padding: 10px 20px;
      background-color: #2563eb;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="spinner"></div>
    <h1>${safeTitle}</h1>
    <p>Opening photo gallery...</p>
    <a href="${safeUrl}">Open Gallery</a>
  </div>
</body>
</html>`;
}

/**
 * Injects SEO metadata into built React application for app.fotoflow.co
 */
function renderAppPage(htmlTemplate, { title, description, image, destinationUrl }) {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeImage = escapeHtml(image);
  const safeUrl = escapeHtml(destinationUrl);

  return htmlTemplate
    .replace(/<title>.*?<\/title>/g, `<title>${safeTitle}</title>`)
    .replace(/<meta property="og:title" content=".*?"\s*\/>/g, `<meta property="og:title" content="${safeTitle}"/>`)
    .replace(/<meta property="og:title" content=".*?"\s*>/g, `<meta property="og:title" content="${safeTitle}">`)
    .replace(/__DESCRIPTION__/g, safeDesc)
    .replace(/__IMAGE__/g, safeImage)
    .replace('</head>', `<meta property="og:url" content="${safeUrl}"/><link rel="canonical" href="${safeUrl}"/></head>`);
}

/**
 * serveGallery - v2 Cloud Function
 * Serves rich SEO previews and manages browser redirection between fotoflow.co and app.fotoflow.co
 */
exports.serveGallery = onRequest({
  concurrency: 80,
  memory: "256MiB",
  cors: true,
}, async (req, res) => {
  const { studioName, routeType, projectId, collectionId, queryString } = parseGalleryRequest(req);
  console.log(`[serveGallery] Handling: studio=${studioName}, project=${projectId}, route=${routeType}`);

  const isApp = isAppDomain(req);
  const destinationUrl = buildDestinationUrl({ studioName, projectId, collectionId, queryString });

  // Handle legacy /share redirect
  if (routeType === 'share' && isApp) {
    const targetPath = `/${studioName}/smart-gallery/${projectId}${collectionId ? `/${collectionId}` : ''}${queryString}`;
    return res.redirect(301, targetPath);
  }

  // Fetch gallery metadata from Firestore
  const metadata = await fetchGalleryMetadata(studioName, projectId, collectionId);

  // Server-side studio-status enforcement: deny blocked studios before
  // serving SEO/redirect content or the React app shell.
  if (metadata.blocked) {
    console.log(`[serveGallery] Blocked: studio=${studioName} reason=${metadata.blockReason}`);
    res.set('Cache-Control', 'no-store');
    return res.status(403).send(renderBlockedPage({
      title: metadata.blockReason === 'studio-suspended'
        ? 'This gallery is temporarily unavailable.'
        : 'This gallery is currently unavailable.',
    }));
  }

  // When accessed via fotoflow.co, serve SEO metadata and instantly redirect browsers to app.fotoflow.co
  if (!isApp) {
    console.log(`[serveGallery] Serving SEO + redirect for fotoflow.co -> ${destinationUrl}`);
    const redirectHtml = renderRedirectPage({ ...metadata, destinationUrl });
    res.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
    return res.status(200).send(redirectHtml);
  }

  // Otherwise, serve built React application on app domain with injected SEO metadata
  const indexPath = path.resolve(__dirname, './index.html');
  try {
    const htmlTemplate = fs.readFileSync(indexPath, 'utf8');
    const finalHtml = renderAppPage(htmlTemplate, { ...metadata, destinationUrl });
    res.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
    return res.status(200).send(finalHtml);
  } catch (err) {
    console.error('[serveGallery] Error reading index.html:', err);
    return res.status(500).send('Application Error');
  }
});

/**
 * serveOptimizedImage - Proxy images from Cloud Storage via CDN
 * Reduces egress costs by leveraging Firebase Hosting CDN caching
 */
exports.serveOptimizedImage = onRequest({
  concurrency: 80,
  memory: "256MiB",
  cors: true,
}, async (req, res) => {
  // Expected path format: /cdn-gallery/:bucket/:path...
  const parts = req.path.split('/').filter(p => !!p);
  
  // parts[0] is 'cdn-gallery' if it's the full path, but hosting rewrites often 
  // pass the path AFTER the source match if it's a function.
  let bucketName, filePath;
  
  if (parts[0] === 'cdn-gallery') {
    bucketName = parts[1];
    filePath = parts.slice(2).join('/');
  } else {
    bucketName = parts[0];
    filePath = parts.slice(1).join('/');
  }

  if (!bucketName || !filePath) {
    console.error('[CDN] Invalid path:', req.path);
    return res.status(400).send('Invalid path');
  }

  try {
    const bucket = admin.storage().bucket(bucketName);
    const file = bucket.file(filePath);

    // Get metadata for Content-Type and existence check
    const [metadata] = await file.getMetadata();
    
    // Set caching headers for the CDN
    res.set('Cache-Control', 'public, max-age=31536000, s-maxage=2592000, immutable');
res.set('Content-Type', metadata.contentType || 'image/jpeg');

    // Stream the file directly from GCS to the response
    file.createReadStream().pipe(res);
    
  } catch (err) {
    if (err.code === 404 || err.code === 403) {
      console.warn('[CDN] File not found or forbidden:', filePath);
      return res.status(404).send('Not Found');
    }
    console.error('[CDN] Error serving image:', err);
    res.status(500).send('Internal Error');
  }
});
