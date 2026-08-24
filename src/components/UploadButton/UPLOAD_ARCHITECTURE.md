# Upload Feature Architecture

This document explains the architecture, flow, state machine, and components of the photo upload feature in FotoFlow.

## 1. Overview

FotoFlow's upload pipeline is built on a **single-source-of-truth, derivative-aware upload state machine**.
Each photo consists of multiple client-side processing stages (EXIF, Dimensions, Compression) and distinct derivative artifacts (`web` and `thumb`).

### Core Principle
> **Workers update facts. Selectors derive state. UI renders state.**

```
Upload Session
      │
      ├── Files
      │     │
      │     ├── Processing (EXIF / Dimensions / Compression)
      │     │
      │     └── Derivatives
      │           ├── WEB
      │           └── THUMB
      │
      └── Derived Session Metrics (Byte-weighted progress, completed, failed)
```

## 2. File Structure

| File | Purpose |
| :--- | :--- |
| `src/components/UploadButton/UploadButton.jsx` | UI Component: Triggers upload and handles file selection. |
| `src/utils/uploadOperations.js` | Orchestrator & Workers: Manages worker pool, compression, derivative workers, retries, and verification. |
| `src/app/slices/uploadConstants.js` | State Machine Contract: Defines states, transitions, required derivatives, and processing stages. |
| `src/app/slices/uploadSlice.js` | Redux Slice: Stores canonical upload facts, derivative bytes, and statuses. |
| `src/app/slices/uploadSelectors.js` | Selectors: Computes byte-weighted progress, file progress, and metrics deterministically. |
| `src/components/UploadProgress/UploadProgress.jsx` | Presentation Component: Subscribes to selectors and renders visual progress. |

## 3. Upload State Machine

### Parent File States
- `pending`: Registered in session, awaiting processing.
- `processing`: Active EXIF extraction, dimension calculation, or compression.
- `uploading`: Derivatives are uploading to Firebase Storage.
- `verifying`: All derivatives uploaded; download URLs are being verified.
- `completed`: All required derivatives (`web` and `thumb`) and metadata verified.
- `failed`: Terminal failure during processing or derivative upload after maximum retries.
- `cancelled`: Upload cancelled by user or system.

### Derivative States
- `pending` -> `processing` -> `uploading` -> `verifying` -> `completed` (or `failed`)

### Valid Transitions
```
PENDING ──> PROCESSING ──> UPLOADING ──> VERIFYING ──> COMPLETED
   │             │             │             │
   └───> FAILED <┴─────────────┴─────────────┘
           │
      (Retry) ──> UPLOADING / PENDING
```

## 4. Key Technical Specifications

### Collision-Proof File Identity
Files are assigned a collision-proof identifier upon selection:
```
sessionId + "_file_" + index + "_" + crypto.randomUUID()
```
Two identical files selected in the same batch maintain independent identity and state.

### Image Compression Settings
- **Web (Optimized)**: `maxWidthOrHeight: 4096`, `maxSizeMB: 4`, quality preserved.
- **Thumbnail**: `maxWidthOrHeight: 1024`, `maxSizeMB: 0.1`, format: `image/webp`, quality: 0.7.

### Byte-Weighted Global Progress
Global session progress is calculated from actual derivative bytes:
$$\text{Progress} = \frac{\sum \text{Derivative Transferred Bytes}}{\sum \text{Derivative Total Bytes}} \times 100$$
- 1 MB file (100%) + 100 MB file (0%) yields $\approx 0.99\%$, not $50\%$.
- Preparation/processing is scaled between 0% and 10%.
- Derivative uploads are scaled between 10% and 95%.
- Verification is scaled between 95% and 99%.
- Progress reaches 100% only when the session is completely finished.

### Independent Derivative Retries
Retrying a failed derivative (`thumb`) preserves the completed state and URL of healthy derivatives (`web`) without restart penalties.

### Deterministic File Completion
```
web.status === 'completed'
AND
thumb.status === 'completed'
AND
metadata (dimensions, dateTimeOriginal) available
        ↓
file.completed
```

## 5. Redux State Schema

```javascript
{
  upload: {
    session: {
      id: "session_1700000000_abc123",
      status: "open" | "completed" | "failed" | "close",
      startedAt: 1700000000000,
      completedAt: null,
      error: null
    },
    files: {
      "session_file_0_uuid": {
        id: "session_file_0_uuid",
        name: "DSC_001.jpg",
        originalSize: 8450123,
        state: "uploading",
        processing: { step: "done", progress: 100 },
        derivatives: {
          web: {
            status: "uploading",
            bytesTransferred: 1450000,
            totalBytes: 3200000,
            url: null,
            error: null
          },
          thumb: {
            status: "completed",
            bytesTransferred: 85000,
            totalBytes: 85000,
            url: "https://...",
            error: null
          }
        },
        metadata: {
          dateTimeOriginal: "2026-08-24T14:00:00.000Z",
          dimensions: { width: 6000, height: 4000 }
        },
        urls: {
          web: null,
          thumb: "https://..."
        },
        error: null
      }
    }
  }
}
```
