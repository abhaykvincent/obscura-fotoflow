# Project Data Structure Updated

This document outlines the changes to the `uploadedFiles` structure within a project's collection, reflecting the addition of EXIF `DateTimeOriginal` data.

## `Project.collections[].uploadedFiles` Structure

```diff
--- a/ProjectDataStructure.md
+++ b/ProjectDataStructureUpdated.md
@@ -1,5 +1,6 @@
 {
     name: string,
     url: string,
     lastModified: number,
     thumbAvailable: boolean,
+    dateTimeOriginal: Date | null, // Added: EXIF original date/time, stored as a JavaScript Date object (Firestore Timestamp)
 }
```

### Explanation of Changes:

- **`dateTimeOriginal`**:
    - **Type**: `Date | null`
    - **Description**: This new field stores the original date and time when the photo was taken, extracted from the image's EXIF data. It is stored as a JavaScript `Date` object, which Firestore automatically converts to a native Timestamp. If EXIF data is not available or `DateTimeOriginal` is not present, the value will be `null`.
    - **Addition**: Indicated by `+` in the diff, this field has been added to each `uploadedFile` object within a collection.
