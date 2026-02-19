# Storage Management Policy - FotoFlow

## 1. Overview
The Storage Management Policy is designed to optimize system performance and storage costs while ensuring a seamless experience for photographers and their clients. It introduces a tiered storage system that distinguishes between projects requiring immediate high-speed access and those stored for long-term reference.

---

## 2. Storage Tiers

### **Active Storage (Hot)**
*   **Purpose**: Current, ongoing projects and recent deliveries.
*   **Access**: Instant high-speed access to original (RAW/High-Res) files and previews.
*   **Quota**: Counts toward the user's "Hot Storage" quota.
*   **Default State**: All new projects begin in Active Storage.

### **Archive Storage (Cold)**
*   **Purpose**: Long-term repository for completed shoots.
*   **Access**: Original files are restricted from direct download. Previews remain available.
*   **Quota**: **Does not count** toward the user's "Hot Storage" quota. Archiving a project immediately frees up space.
*   **Requirement**: Minimum 1-year storage commitment for archived data.

---

## 3. The Archiving Workflow

### **Automated Migration**
Projects automatically migrate from Active to Archive Storage based on the "Archiving Period":
1.  **Threshold**: Defined by the `projectValidityMonths` property (defaults to **3 months** if not specified).
2.  **Trigger**: The system checks the `createdAt` date during the `fetchProjects` cycle.
3.  **Space Recovery**: Upon migration, the project's `totalFileSize` is decremented from the Studio's active usage quota in Firestore.

### **Smart Previews (Always On)**
*   **Persistent Visibility**: Low-resolution thumbnails (Smart Previews) are stored in a dedicated `thumb/` directory.
*   **Accessibility**: Previews remain in Active Storage permanently. Even when a project is archived, the gallery can be browsed, shared, and viewed without restoration.

---

## 4. Restoration & Recovery

If original files are required from an archived project (e.g., for client redownload):
1.  **Restore First**: Users must trigger a "Restore to Active" action from the Project Dashboard.
2.  **30-Day Lock**: Once restored, the project is locked in Active Storage for a **minimum of 30 days**. It will not be eligible for auto-archiving during this window, ensuring the client has ample time to complete downloads.
3.  **Quota Impact**: Restoring a project re-increments the Studio's active storage usage. If the studio is at its limit, restoration may require upgrading the plan.

---

## 5. Technical Implementation Details

### **Database Schema (Firestore)**
*   `storage.status`: `active` | `archive`
*   `storage.lastRestoredAt`: Timestamp of the most recent restoration.
*   `storage.storageHistory`: An array tracking migration dates and status changes.
*   `totalFileSize`: Used to manage quota increments/decrements.

### **Security Rules (Firebase Storage)**
*   **Path `/thumb/**`**: Publicly readable (Smart Previews).
*   **Path `/web/**`**: Access is restricted via Firestore lookups. Read access is denied if `storage.status == 'archive'`.

### **User Experience**
*   **Archive Banner**: A specialized UI component in `Project.jsx` informs users when a project is archived and provides a one-click restoration path.
*   **Grayscale Cards**: Archived projects are visually distinguished in the dashboard with a grayscale filter and dashed borders.
*   **Download Intercept**: The system intercepts download requests on archived projects and prompts the user to restore the project first.

---

## 6. Benefits
*   **Cost Efficiency**: Photographers only pay for active "Hot" storage.
*   **Infinite Portfolio**: Keep years of work accessible via Smart Previews without hitting storage limits.
*   **Automation**: No manual management required for old projects.
