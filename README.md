# Photographer Finance App - Firebase Setup

This application uses Firebase for authentication, database (Firestore), and storage to help photographers manage their finances, projects, and client packages. Cloud Functions are used for backend logic.

## Features (Work in Progress)

*   User Authentication (Sign Up, Login, Logout)
*   **Project Management:** Create, view, edit, and delete projects.
*   **Package Management:** Create, view, edit, and delete service packages.
*   **Quote Management (Basic):** For a selected project, create, view, edit, and delete quotes.
*   **Invoice Management (Basic):** For a selected project, create, view, edit, and delete invoices, including generation from accepted quotes.
*   **Payment Tracking (Basic):** Record payments against invoices. Invoice `paidAmount` and `status` are updated automatically (client-side using `FieldValue.increment()`).
*   **Expense Tracking (Basic):** Record business expenses, optionally link them to projects, and upload receipt images/PDFs.
*   **Cloud Functions:**
    *   `createNewUserDocument`: Automatically creates a user profile in Firestore on sign-up.
    *   `updateProjectTimestampOnStatusChange`: Automatically updates a project's `updatedAt` timestamp when its status changes.
*   (Upcoming: Client Management, Dashboard with financial summaries)

## Key User Flows

### User Flow A: New Lead to Booked Project & Initial Deposit Invoice

This flow outlines the steps from receiving a new lead to booking the project and invoicing for an initial deposit.

1.  **Create Lead/Client & Project:**
    *   Navigate to the "Projects" section.
    *   Click "Add New Project".
    *   Enter project details:
        *   `Project Name`: e.g., "Smith Wedding Inquiry"
        *   `Client Name`: e.g., "John Smith"
        *   `Client Email`: e.g., "john.smith@example.com"
        *   `Status`: Set to "Lead" (or "Quoted" if providing an immediate quote).
    *   Click "Save Project". (Client details are currently stored directly on the project document).

2.  **Create Quote for the Project:**
    *   In the projects list, find the "Smith Wedding Inquiry" project.
    *   Click the "Manage Quotes" button for this project.
    *   Click "Add New Quote".
    *   Fill in quote details:
        *   Add line items (e.g., "Wedding Package Gold", quantity 1, price e.g., 2000).
        *   Set `Quote Date`.
        *   Set `Status` to "Draft" (if reviewing internally) or "Sent" (if sending to client).
    *   Click "Save Quote".

3.  **Mark Quote as Accepted:**
    *   After client communication, navigate back to "Manage Quotes" for the project.
    *   Find the relevant quote in the list and click its "Edit" button.
    *   Change the `Status` to "Accepted".
    *   Click "Save Quote".

4.  **Update Project Status to "Booked":**
    *   Navigate back to the main "Projects" section (using the "&larr; Back to Projects" button from the quotes view, then the "Projects" tab).
    *   Find the "Smith Wedding Inquiry" project and click its "Edit" button.
    *   Change the `Status` to "Booked".
    *   Click "Save Project".
    *   *Note:* This step is currently manual. Future enhancement could involve a Cloud Function to automatically update project status upon quote acceptance.

5.  **Generate Deposit Invoice from Accepted Quote:**
    *   Navigate back to "Manage Quotes" for the "Booked" project.
    *   The "Accepted" quote should now display a "Generate Invoice" button. Click it.
    *   This will open the invoice form, pre-filled with items from the quote.
    *   **Important for Deposit Invoices:**
        *   The user needs to manually adjust the line items to reflect a deposit. For example, delete the full package item and add a new item like "Deposit for Wedding Package Gold" with the agreed deposit amount (e.g., 500).
        *   A hint is logged to the console: `"Hint: If this is a deposit invoice, adjust line items and total as necessary before saving."`
    *   Set the `Invoice Date` and `Due Date`.
    *   Set the `Status` to "Sent" (or "Draft" if further review is needed before sending).
    *   Click "Save Invoice".

6.  **Record Payment for the Deposit Invoice:**
    *   The new invoice will appear in the "Invoices for [Project Name]" list.
    *   Click the "Record Payment" button for this invoice.
    *   The payment form will appear.
    *   Enter `Payment Date`, `Payment Amount` (e.g., 500), and select `Payment Method`.
    *   Click "Save Payment".

7.  **Verify Invoice Update:**
    *   The invoice list will refresh automatically.
    *   The deposit invoice should now show the updated "Paid Amount" (e.g., 500.00).
    *   Its `Status` should automatically change to "Paid" (if the deposit amount equals the invoice total) or "Partially Paid".
    *   The "Remaining Amount" should also be updated.

This flow demonstrates the basic path from initial contact to securing a booking and receiving an initial payment.

## 1. Create a Firebase Project
(Instructions remain the same)

## 2. Get Your Firebase Configuration
(Instructions remain the same)

## 3. Add Configuration to `app.js` (or your Firebase initialization file)
(Instructions remain the same)

## 4. Enable Email/Password Authentication
(Instructions remain the same)

## 5. Set Up Firestore (Database)
(Instructions remain the same)

## 6. Set Up Firebase Storage
(Instructions remain the same)

## 7. Security Rules Deployment
(Instructions remain the same)

### 7.1. Firestore Security Rules
(Instructions remain the same)

### 7.2. Firebase Storage Security Rules (for Receipts)
(Instructions remain the same)

## 8. Cloud Functions Setup & Deployment
(Instructions remain the same)

## Future Enhancements & Considerations
(Instructions remain the same)

Once these steps are completed, your application should be ready for testing the described features. Remember to serve client-side files via a local server or Firebase Hosting.
