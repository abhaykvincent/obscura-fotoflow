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
 * Helper to get the web-optimized image URL
 */
function getImageUrlByQuality(url, quality = 'web') {
  if (!url) return '';
  const targetQuality = quality.toLowerCase();
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

  console.log(`[v2] Serving gallery: Studio=${studioName}, Project=${projectId}, Type=${routeType}`);

  // Redirect old /share links to /smart-gallery
  if (routeType === 'share') {
    const targetPath = `/${studioName}/smart-gallery/${projectId}${collectionId ? `/${collectionId}` : ''}`;
    console.log(`Redirecting legacy share link to: ${targetPath}`);
    return res.redirect(301, targetPath);
  }

  // Path to the built index.html (Ensured by firebase.json predeploy)
  const indexPath = path.resolve(__dirname, './index.html');
  let html = '';
  
  try {
    html = fs.readFileSync(indexPath, 'utf8');
  } catch (err) {
    console.error('Error reading index.html:', err);
    return res.status(500).send('Application Error');
  }

  // Default Fallbacks
  let title = 'Smart Gallery | Fotoflow';
  let description = 'View your professional photo gallery.';
  let image = '';

  if (studioName && projectId) {
    try {
      // Fetch project data from Firestore
      const projectDoc = await admin.firestore()
        .collection('studios')
        .doc(studioName)
        .collection('projects')
        .doc(projectId)
        .get();

      if (projectDoc.exists) {
        const project = projectDoc.data();
        
        title = `${toTitleCase(project.name)}'s ${project.type}`;
        description = `${toTitleCase(project.type || 'Photo')} gallery by ${toTitleCase(studioName)}.`;
        image = project.projectCover ? getImageUrlByQuality(project.projectCover, 'thumb') : '';
      }
    } catch (err) {
      console.error('Error fetching project from Firestore:', err);
      // Fail gracefully and use defaults
    }
  }

  // Inject metadata into placeholders
  const finalHtml = html
    .replace(/>Fotoflow</g, `>${title}<`)
    .replace(/content="Fotoflow"/g, `content="${title}"`)
    .replace(/__DESCRIPTION__/g, description)
    .replace(/__IMAGE__/g, image);

  // Set Cache control to ensure previews aren't stale
  res.set('Cache-Control', 'public, max-age=600, s-maxage=1200');
  res.status(200).send(finalHtml);
});
