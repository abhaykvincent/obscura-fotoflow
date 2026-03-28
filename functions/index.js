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
 * Helper to capitalize strings for display
 */
function toTitleCase(str) {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

/**
 * Helper to get the web-optimized image URL via CDN
 */
function getImageUrlByQuality(url, quality = 'web') {
  if (!url) return '';
  const targetQuality = quality.toLowerCase();

  // Handle Firebase Storage URLs and convert to CDN
  const storageMatch = url.match(/firebasestorage\.googleapis\.com\/v0\/b\/([^/]+)\/o\/([^?]+)/);
  if (storageMatch) {
    const bucket = storageMatch[1];
    let path = decodeURIComponent(storageMatch[2]);
    
    const prefixes = ['web', 'thumb', 'original', 'covers'];
    for (const prefix of prefixes) {
      if (path.startsWith(prefix + '/')) {
        path = path.replace(prefix + '/', targetQuality + '/');
        break;
      }
    }
    
    return `/cdn-gallery/${bucket}/${path}`;
  }

  const encodedMatch = url.match(/\/o\/(web|thumb|original)%2F/i);
  if (encodedMatch) {
    return url.replace(/\/o\/(web|thumb|original)%2F/i, `/o/${targetQuality}%2F`);
  }
  return url;
}

/**
 * serveGallery - v2 Implementation
 * Optimized for high concurrency and SEO metadata injection
 */
exports.serveGallery = onRequest({
  concurrency: 80,         // Optimized for high volume
  memory: "256MiB",        // Allocated memory
  cors: true,              // Built-in CORS handling for Cloud Run
}, async (req, res) => {
  // Extract studio and project from URL path
  // Expected path format: /:studioName/(smart-gallery|share)/:projectId
  const pathParts = req.path.split('/').filter(p => !!p);
  const studioName = pathParts[0];
  const routeType = pathParts[1];
  const projectId = pathParts[2];
  const collectionId = pathParts[3];

  console.log(`[v2] Extracted: studioName=${studioName}, projectId=${projectId}, routeType=${routeType}, collectionId=${collectionId}`);

  // Redirect old /share links to /smart-gallery
  if (routeType === 'share') {
    const targetPath = `/${studioName}/smart-gallery/${projectId}${collectionId ? `/${collectionId}` : ''}`;
    console.log(`[v2] Redirecting: ${targetPath}`);
    return res.redirect(301, targetPath);
  }

  // Path to the built index.html (Ensured by firebase.json predeploy)
  const indexPath = path.resolve(__dirname, './index.html');
  let html = '';
  
  try {
    html = fs.readFileSync(indexPath, 'utf8');
  } catch (err) {
    console.error('[v2] Error reading index.html:', err);
    return res.status(500).send('Application Error');
  }

  // Default Fallbacks
  let title = 'Smart Gallery | Fotoflow';
  let description = 'View your professional photo gallery.';
  let image = '';

  if (studioName && projectId) {
    try {
      // Fetch project data from Firestore
      console.log(`[v2] Fetching project: studios/${studioName}/projects/${projectId}`);
      const projectDoc = await admin.firestore()
        .collection('studios')
        .doc(studioName)
        .collection('projects')
        .doc(projectId)
        .get();

      if (projectDoc.exists) {
        const project = projectDoc.data();
        console.log(`[v2] Project found: ${project.name}`);
        
        title = `${toTitleCase(project.name)}'s ${project.type || 'Gallery'}`;
        description = `${toTitleCase(project.type || 'Photo')} gallery by ${toTitleCase(studioName)}.`;
        image = project.projectCover ? getImageUrlByQuality(project.projectCover, 'thumb') : '';
      } else {
        console.warn(`[v2] Project NOT found: studios/${studioName}/projects/${projectId}`);
      }
    } catch (err) {
      console.error('[v2] Firestore error:', err);
    }
  }

  // Inject metadata into placeholders
  const finalHtml = html
    .replace(/<title>.*?<\/title>/g, `<title>${title}</title>`)
    .replace(/content="Fotoflow"/g, `content="${title}"`)
    .replace(/__DESCRIPTION__/g, description)
    .replace(/__IMAGE__/g, image);

  console.log(`[v2] Serving HTML for: ${title}`);

  // Set Cache control to ensure previews aren't stale
  res.set('Cache-Control', 'public, max-age=600, s-maxage=1200');
  res.status(200).send(finalHtml);
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
    res.set('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
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
