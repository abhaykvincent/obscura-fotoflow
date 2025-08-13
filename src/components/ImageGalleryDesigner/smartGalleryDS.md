# Smart Gallery Data Structure for FotoFlow

This document outlines the data structure for a "Smart Gallery" feature, allowing for modular sections with re-arrangeable content. This structure is designed to be stored within a Firestore document, likely as part of a `project` or `gallery` collection.

## 1. Overall Gallery Document Structure

A single gallery document in Firestore would represent a complete smart gallery.

```json
{
  "id": "gallery_id_123",
  "name": "My Awesome Photo Gallery",
  "description": "A collection of my best photos from various events.",
  "projectCover": "https://example.com/cover_photo.jpg",
  "focusPoint": {
    "x": 0.5,
    "y": 0.5
  },
  "coverSize": "medium", // "small", "medium", "large"
  "textPosition": "center", // "center", "top-left", "top-right", "bottom-left", "bottom-right"
  "overlayColor": "rgba(0, 0, 0, 0.5)",
  "sections": [
    // Array of section objects, defining the content and layout
    // Order of sections in this array determines their display order
  ],
  "createdAt": "2025-08-13T10:00:00Z", // ISO 8601 string
  "updatedAt": "2025-08-13T10:30:00Z"  // ISO 8601 string
}
```

## 2. Section Base Structure

Each object within the `sections` array will adhere to this base structure, with additional properties specific to its `type`.

```json
{
  "id": "section_id_abc", // Unique ID for the section (e.g., timestamp or UUID)
  "type": "image-grid",   // Type of the section (e.g., "image-grid", "text-block", "carousel")
  "order": 1              // Optional: Numeric order for explicit sorting, if array order is not sufficient
}
```

## 3. Specific Section Types

### 3.1. `image-grid` Section

A section for displaying a grid of images.

```json
{
  "id": "section_id_img_grid_001",
  "type": "image-grid",
  "order": 1,
  "images": [
    {
      "id": "image_id_001",
      "url": "https://example.com/image1.jpg",
      "thumbnailUrl": "https://example.com/image1_thumb.jpg", // Optional
      "caption": "Sunset over the mountains", // Optional
      "altText": "A beautiful sunset with orange and purple hues", // Optional
      "metadata": {
        "aperture": "f/2.8",
        "shutterSpeed": "1/250s",
        "iso": 100,
        "cameraModel": "Sony Alpha a7 III"
      }, // Optional: EXIF or other image metadata
      "layout": "standard" // Optional: "standard", "full-width", "half-width", "square", etc.
    },
    {
      "id": "image_id_002",
      "url": "https://example.com/image2.jpg",
      "thumbnailUrl": "https://example.com/image2_thumb.jpg",
      "caption": "Forest path",
      "altText": "A winding path through a dense forest",
      "layout": "standard"
    }
  ],
  "gridSettings": {
    "columns": 3, // Number of columns in the grid
    "spacing": "16px", // Spacing between images
    "aspectRatio": "1:1" // Optional: "1:1", "4:3", "16:9", "auto"
  }
}
```

### 3.2. `carousel` Section

A section for displaying images in a carousel/slideshow format.

```json
{
  "id": "section_id_carousel_001",
  "type": "carousel",
  "order": 2,
  "images": [
    {
      "id": "image_id_003",
      "url": "https://example.com/image3.jpg",
      "caption": "City skyline at night"
    },
    {
      "id": "image_id_004",
      "url": "https://example.com/image4.jpg",
      "caption": "Abstract art"
    }
  ],
  "settings": {
    "autoplay": true,
    "interval": 5000, // milliseconds
    "loop": true,
    "showNavigation": true,
    "showPagination": true
  }
}
```

### 3.3. `text-block` Section

A section for rich text content.

```json
{
  "id": "section_id_text_001",
  "type": "text-block",
  "order": 3,
  "content": "<h1>Welcome to My Gallery!</h1><p>This is a place where I share my passion for photography.</p>", // HTML content
  "alignment": "center", // "left", "center", "right"
  "fontSize": "medium", // "small", "medium", "large"
  "textColor": "#333333", // Optional
  "backgroundColor": "#f9f9f9" // Optional
}
```

### 3.4. `sub-gallery` Section

A section to embed other existing galleries or collections.

```json
{
  "id": "section_id_sub_gallery_001",
  "type": "sub-gallery",
  "order": 4,
  "galleryIds": [
    "gallery_id_456", // ID of another gallery document
    "gallery_id_789"
  ],
  "displayType": "thumbnails", // "thumbnails", "list", "carousel"
  "title": "Related Galleries", // Optional title for this section
  "description": "Explore more of my work." // Optional description
}
```

### 3.5. `embed` Section

A section to embed external content (e.g., YouTube videos, Spotify playlists, custom HTML).

```json
{
  "id": "section_id_embed_001",
  "type": "embed",
  "order": 5,
  "embedCode": "<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>", // Raw HTML/embed code
  "sourceUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", // Optional: Original URL of the embedded content
  "caption": "My favorite song" // Optional
}
```

## 4. Considerations for Firestore

*   **Document Size:** For galleries with a very large number of images (e.g., thousands), consider storing image details in a subcollection (e.g., `galleries/{galleryId}/images/{imageId}`) rather than directly in the `images` array within the section. This prevents hitting Firestore document size limits. For typical galleries, embedding directly in the array should be fine.
*   **Serialization:** Ensure all data stored in Firestore is serializable. Dates should be stored as ISO 8601 strings or Firestore Timestamps.
*   **Indexing:** Plan Firestore indexes based on common query patterns (e.g., querying galleries by `createdAt` or `updatedAt`).
*   **Security Rules:** Implement robust Firestore security rules to control read/write access to gallery data.