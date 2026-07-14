# UploadProgress & handleUpload Integration Issues

## Problems Identified

### 1. **Missing Import in UploadProgress Component**
**File**: `src/components/UploadProgress/UploadProgress.jsx`
**Issue**: The component uses `useState` and `useEffect` but doesn't import `useState` from React.
- Line 1 imports `useEffect` and `useMemo` but **missing `useState`**
- This causes runtime error when modal state management is used

**Impact**: `useState` call on line 10 will throw "useState is not imported" error.

---

### 2. **Non-Serializable Data in Redux Store**
**File**: `src/app/slices/uploadSlice.js`
**Issue**: The `startUploadSession` reducer stores `rawFile` (File object) directly in Redux state.
- Line 30: `rawFile: file` - File objects are NOT serializable
- Line 31: Spreads the entire file object which may contain non-serializable properties

**Problem**: 
- Violates Redux serialization requirement (per guidelines)
- Redux DevTools will warn about non-serializable values
- Can cause issues with state persistence/debugging

**Fix**: Remove the rawFile storage from Redux; it should only be in local memory during upload.

---

### 3. **Date Object Serialization Problem**
**File**: `src/utils/uploadOperations.js` (lines 241-243)
**Issue**: Converting `Date` to ISO string correctly, BUT Redux guideline states dates must be serialized BEFORE dispatch.

**Current Code**:
```javascript
dispatch(startUploadSession(initialFileObjects.map(({ rawFile, dateTimeOriginal, ...rest }) => ({
    ...rest,
    dateTimeOriginal: dateTimeOriginal.toISOString()
}))));
```

**Status**: ✅ This is actually done correctly, but let's ensure consistency.

---

### 4. **Incomplete Progress Calculation**
**File**: `src/components/UploadProgress/UploadProgress.jsx` (lines 20-22)
**Issue**: Progress percentage only counts "uploaded" status, not "uploading".
- Files currently uploading show as 0% progress toward completion
- User sees misleading progress bar

**Problem**: 
```javascript
const totalProgressCount = useMemo(() => 
    files.filter((item) => item.status === 'uploaded').length, // ❌ Only counts 'uploaded'
[files]);
```

**Better Approach**: Should show real-time progress of files.

---

### 5. **Missing Redux Dispatch in UploadProgress**
**File**: `src/components/UploadProgress/UploadProgress.jsx` (lines 45-47)
**Issue**: Modal control handlers (minimize, maximize, close) only update local state.
- These state changes don't persist in Redux
- On component remount, UI state resets

**Missing Actions**: Redux should track:
- `setModalMinimized`
- `setModalMaximized`  
- `setModalClosed`

---

### 6. **Incomplete File Metadata Propagation**
**File**: `src/utils/uploadOperations.js` (line 267 - cut off)
**Issue**: `fileObj[...]` is truncated and incomplete
- Missing `dimensions` parameter in thumb upload
- File metadata may not propagate correctly

**Current Line 267**:
```javascript
uploadFile(storage, 'web', domain, id, collectionId, new File([compressedWeb], fileObj.name, { type: compressedWeb.type }), dispatch, fileObj.id, fileObj.dateTimeOriginal, fileObj[...]
```

The line is incomplete - should be `fileObj.dimensions`.

---

### 7. **No Error Handling for Failed Files in UI**
**File**: `src/components/UploadProgress/UploadProgress.jsx`
**Issue**: Component displays all file statuses (pending, uploading, uploaded, failed) but:
- No visual distinction between success and failure states
- No retry mechanism visible to user
- User can't distinguish which files failed

---

### 8. **Race Condition: Modal Auto-Minimize During Active Upload**
**File**: `src/components/UploadProgress/UploadProgress.jsx` (lines 32-37)
**Issue**: If upload is running, the 60-second timer minimizes the modal while files are still uploading.

**Problem**: User might miss completion notification if modal is minimized.

**Better Logic**: Only auto-minimize if upload is completed or no new files are being added.

---

### 9. **Missing Dispatch in Modal Controls**
**File**: `src/components/UploadProgress/UploadProgress.jsx`
**Issue**: Lines 45-47 show local state updates but NO dispatch to Redux:
```javascript
const onMinimize = () => setModalState('minimize'); // ❌ Local only
const onMaximize = () => setModalState('maximize'); // ❌ Local only
const onClose = () => setModalState('close');       // ❌ Local only
```

This means:
- Redux doesn't know about UI state changes
- Other components can't subscribe to modal state
- State is lost on component unmount

---

### 10. **Incomplete Return Value Type Documentation**
**File**: `src/utils/uploadOperations.js`
**Issue**: `handleUpload` returns object with inconsistent structure:
```javascript
return { uploadedFiles: finalUploadedFiles, pin, error: null }; // ✅ Success
return { uploadedFiles: finalUploadedFiles, pin, error: 'Partial failure' }; // ❌ Error in success path
return { uploadedFiles: [], error: 'All files failed', pin: null }; // ❌ pin might be undefined
```

---

## Summary Table

| Issue | Severity | File | Type |
|-------|----------|------|------|
| Missing useState import | 🔴 Critical | UploadProgress.jsx | Bug |
| Non-serializable data in Redux | 🟠 High | uploadSlice.js | Code Smell |
| Incomplete line 267 | 🔴 Critical | uploadOperations.js | Bug |
| Progress calculation only counts "uploaded" | 🟠 High | UploadProgress.jsx | Logic Error |
| Modal controls don't dispatch to Redux | 🟠 High | UploadProgress.jsx | Architecture |
| No error indication for failed files | 🟡 Medium | UploadProgress.jsx | UX Issue |
| Auto-minimize during upload | 🟡 Medium | UploadProgress.jsx | Logic Error |
| Return value inconsistency | 🟡 Medium | uploadOperations.js | Type Safety |

---

## Recommended Fix Order

1. **First**: Fix missing `useState` import (blocking bug)
2. **Second**: Complete line 267 in uploadOperations.js
3. **Third**: Remove `rawFile` from Redux state
4. **Fourth**: Improve progress calculation
5. **Fifth**: Add Redux dispatch for modal state
6. **Sixth**: Improve error handling UI
7. **Seventh**: Fix auto-minimize logic
8. **Eighth**: Document return types properly
