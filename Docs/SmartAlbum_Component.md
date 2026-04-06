# 📸 Smart Album Component Documentation

## 🌟 Overview
The **Smart Album** is the primary display component for photo galleries in the FotoFlow application. Think of it as a digital photo album that intelligently organizes and displays your project's collections (like Wedding Photos, Engagement Shoots, etc.) in a beautiful, interactive layout.

---

## 🚀 Key Features

### 1. **Dynamic Cover Display**
- Automatically shows the project's cover image at the top of the gallery.
- Adjusts the image focus to ensure the most important part of the photo is always visible.
- Displays the **Project Name** and the **Collection Type** (e.g., "Main Gallery") clearly for viewers.

### 2. **Intelligent Section Rendering**
- The album isn't just a list of photos; it's broken down into **Sections**.
- Each section can have its own layout (like an image grid), which is handled by a specialized `SectionRenderer`.
- It automatically handles **Thumbnails**, ensuring the page loads quickly by showing smaller versions of images first.

### 3. **Interactive Image Preview**
- Clicking on any photo opens a high-quality **Preview Mode**.
- Users can swipe or click through all photos in the gallery without leaving the page.
- Tracks which image is being viewed to provide a seamless experience.

### 4. **Smart Status Checks**
- **Active Check:** Before showing the gallery, it verifies if the collection is "Active" or "Visible." If a photographer has hidden a collection, it won't be shown to the client.
- **Expiration Protection:** If a project has expired (based on the studio's retention policy), it automatically redirects users to a "Project Expired" page to protect the studio's storage.

### 5. **Analytics & Tracking**
- Every time a gallery is viewed, the system anonymously tracks the event. This helps photographers understand how often their work is being seen.

---

## 🛠️ How it Works (The "Under the Hood" Logic)

1.  **Preparation:** When you open a gallery link, the component gathers the `Project ID` and `Collection ID` from the web address.
2.  **Fetching Data:** It asks the database for all the photos and layout settings specifically for that collection.
3.  **Status Validation:** Simultaneously, it checks if the gallery is currently meant to be public.
4.  **Image Processing:** It prepares a "master list" of all images so that the previewer knows how to navigate between them.
5.  **Rendering:**
    - **Loading State:** While waiting for data, it shows a beautiful loading screen with the project's cover and a spinner.
    - **Active State:** Once ready, it displays the full gallery with the cover, title, and all photo sections.
    - **Inactive/Expired State:** If there's an issue (like expiration), it shows a friendly message explaining why the gallery isn't available.

---

## 🎨 Visual States

| State | What the user sees |
| :--- | :--- |
| **Loading** | A "Loading Gallery..." message with the project's cover photo in the background. |
| **Active** | The full interactive gallery with a back button, header, and photos. |
| **Inactive** | A simple message: "This gallery is not active." |
| **Expired** | A specialized "Project Expired" page explaining that the files are no longer available. |
| **Preview** | A full-screen overlay where you can zoom in and scroll through photos. |

---

## 👤 User Interaction
- **Back Button:** Easily navigate back to the previous page or project dashboard.
- **Clicking Photos:** Opens the full-screen preview.
- **Scrolling:** The layout adjusts smoothly as the user explores the sections.

---

## 📝 Technical Summary (For Developers)
- **State Management:** Uses Redux (via `smartGallerySlice`) for data and status.
- **Routing:** Integrated with `react-router-dom` for navigation.
- **Analytics:** Uses a custom `trackEvent` utility for 'gallery_viewed'.
- **Optimization:** Uses `useMemo` for heavy calculations like processing image URLs and checking expiration dates to ensure high performance.
