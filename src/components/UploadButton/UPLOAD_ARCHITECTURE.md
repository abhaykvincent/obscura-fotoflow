# Upload Feature Architecture

This document explains the architecture, flow, and components of the photo upload feature in FotoFlow. It is designed to help developers understand, maintain, and contribute to this core functionality.

## 1. Overview

The upload feature is responsible for importing photos from a user's local machine, validating them, generating metadata, compressing them for performance, uploading them to Firebase Storage (both high-res and thumbnails), and finally recording the metadata in Firestore.

## 2. File Structure

| File | Purpose |
| :--- | :--- |
| `src/components/UploadButton/UploadButton.jsx` | UI Component: Triggers the flow and handles file selection. |
| `src/utils/uploadOperations.js` | Core Logic: Orchestrates slicing, compression, and Firebase interaction. |
| `src/app/slices/uploadSlice.js` | Redux State: Manages the global state of the upload session and progress. |
| `src/utils/fileUtils.js` | Utilities: File size calculation, validation, and EXIF extraction. |
| `src/firebase/functions/firestore.js` | Database: Persists file metadata and completion events to Firestore. |

## 3. High-Level Flow

1.  **Selection**: User selects files via `<UploadButton />`.
2.  **Validation**: Check file types (.jpg, .png) and available storage quota.
3.  **Preparation**: 
    - Extract EXIF data (specifically `DateTimeOriginal`).
    - Get image dimensions.
    - Generate unique IDs for tracking.
4.  **Redux Initialization**: `startUploadSession` is dispatched to show the upload UI and track progress.
5.  **Slicing**: Files are processed in batches (slices) to prevent browser memory issues and respect network concurrency.
6.  **Compression**: Each image is compressed into two versions:
    - **Main**: Max width/height 1920px (for display/delivery).
    - **Thumbnail**: Max width/height 480px (for gallery previews).
7.  **Storage Upload**: Files are uploaded to Firebase Storage with an exponential backoff retry mechanism.
8.  **Firestore Sync**: Once all files are in Storage, metadata (URLs, dimensions, dates) is saved to the project collection in Firestore.
9.  **Completion**: Notify user, trigger project refresh, and show completion modal.

## 4. Key Technical Details

### Cloud Storage Folder Architecture
Files are organized in Firebase Storage using a prefix-based structure to enable easy lifecycle targeting (e.g., different retention policies or transition rules for thumbnails vs. web images):
- **Web (Optimized)**: `web/{domain}/{projectId}/{collectionId}/{fileName}`
- **Thumbnails**: `thumb/{domain}/{projectId}/{collectionId}/{fileName}`
- **Project Covers**: `covers/{domain}/{projectId}/{fileName}`
- **Studio Branding**: `branding/{domain}/logo/{fileName}`

### Image Compression
We use `browser-image-compression` to optimize files before they leave the client.
- **Web (Main)**: Max width/height 2048px, 82% quality, original format preserved.
- **Thumbnail**: Max width/height 500px, 65% quality, WebP format.
- **Quota Management**: We check `importFileSize` against `storageLimit.quota - storageLimit.used` before starting.

### UploadProgress Component
The `UploadProgress` component (located in `src/components/UploadProgress/`) provides real-time feedback to the user:
- **Redux Integration**: Subscribes to `selectUploadList` and `selectUploadStatus` from `uploadSlice`.
- **States**: `minimize`, `maximize`, `completed`, and `close`.
- **Automatic Behavior**: Minimizes automatically after 60 seconds if the upload is still in progress.
- **Tracking**: Calculates overall percentage and identifies individual file statuses (pending, uploading, uploaded, failed).

### Slicing & Concurrency

### Redux State Schema (`uploadSlice`)
```javascript
{
  uploadList: {
    "file-name.jpg": {
      id: "file-name.jpg",
      status: 'pending' | 'uploading' | 'uploaded' | 'failed',
      progress: 0 to 100,
      url: "...",
      // ... metadata
    }
  },
  uploadStatus: 'close' | 'open' | 'completed' | 'failed'
}
```

## 5. Maintenance & Contribution

### Adding a new validation
Modify `validateFileTypes` in `src/utils/fileUtils.js` and update the error alert in `UploadButton.jsx`.

### Modifying Compression
Compression settings (max dimensions, quality) are located in `compressImages` within `src/utils/uploadOperations.js`.

### Extending Metadata
If you need to extract more EXIF tags, update the `handleUpload` entry point where `extractExifData` is called and ensure the resulting data is passed through to `addUploadedFilesToFirestore`.

---
*Last Updated: February 2026*
