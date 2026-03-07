const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

admin.initializeApp();

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

exports.serveGallery = functions.https.onRequest(async (req, res) => {
  // Extract studio and project from URL path
  // Expected path format: /:studioName/(smart-gallery|share)/:projectId
  const pathParts = req.path.split('/').filter(p => !!p);
  const studioName = pathParts[0];
  const routeType = pathParts[1];
  const projectId = pathParts[2];
  const collectionId = pathParts[3];

  console.log(`Serving gallery for studio: ${studioName}, project: ${projectId}, type: ${routeType}`);

  // Redirect old /share links to /smart-gallery
  if (routeType === 'share') {
    const targetPath = `/${studioName}/smart-gallery/${projectId}${collectionId ? `/${collectionId}` : ''}`;
    console.log(`Redirecting legacy share link to: ${targetPath}`);
    return res.redirect(301, targetPath);
  }

  // Path to the built index.html
  // Note: During deploy, we must ensure index.html is accessible here
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
        
        // Match React component's title logic
        if (collectionId) {
          // If we have a collectionId, we could try to find the collection name
          // For now, using a generic title with project name as fetching subcollection here adds latency
          
          title = `${toTitleCase(project.name)}'s ${project.type} gallery`;
        } else {
          title = `${toTitleCase(project.name)}'s ${project.type} gallery`;
        }
        
        description = `${toTitleCase(project.type || 'photo')} collection by ${toTitleCase(studioName)}.`;
        image = project.projectCover ? getImageUrlByQuality(project.projectCover, 'thumb') : '';
      }
    } catch (err) {
      console.error('Error fetching project from Firestore:', err);
      // Fail gracefully and use defaults
    }
  }

  // Inject metadata into placeholders
  const finalHtml = html
    .replace(/__TITLE__/g, title)
    .replace(/__DESCRIPTION__/g, description)
    .replace(/__IMAGE__/g, image);

  // Set Cache control to ensure previews aren't stale but also don't hit function too hard
  res.set('Cache-Control', 'public, max-age=600, s-maxage=1200');
  res.status(200).send(finalHtml);
});
