# Firestore Data Design

This document outlines the data structures for the Firestore database.

## Top-Level Collections:

*   **users**: Stores application-specific information for each photographer, linked to their Firebase Auth UID.
    *   Document ID: `Firebase Auth UID`
    *   Fields:
        *   `email`: (String) User's email (from Auth)
        *   `displayName`: (String) User's display name (optional)
        *   `createdAt`: (Timestamp) Firestore server timestamp
        *   `defaultCurrency`: (String) e.g., "USD" (optional)
        *   `companyName`: (String) Optional, for invoicing
        *   `address`: (String) Optional, for invoicing
        *   `logoUrl`: (String) Optional, URL to company logo in Firebase Storage

*   **clients**: Each document is a client belonging to a photographer.
    *   Document ID: Auto-generated
    *   Fields:
        *   `photographerUid`: (String) Firebase Auth UID of the owner.
        *   `name`: (String) Client's full name or company name.
        *   `email`: (String) Client's primary email.
        *   `phone`: (String) Client's phone number (optional).
        *   `address`: (String) Client's address (optional).
        *   `notes`: (String) General notes about the client (optional).
        *   `createdAt`: (Timestamp) Firestore server timestamp
        *   `updatedAt`: (Timestamp) Firestore server timestamp (on update)

*   **projects**: Each document is a project.
    *   Document ID: Auto-generated
    *   Fields:
        *   `photographerUid`: (String) Firebase Auth UID of the owner.
        *   `clientId`: (String) ID of the client from the `clients` collection.
        *   `clientName`: (String) Denormalized for easy display (from `clients` collection).
        *   `projectName`: (String) Name of the project (e.g., "Smith Wedding", "Product Shoot Q3").
        *   `eventDate`: (Timestamp) Date of the event.
        *   `status`: (String) e.g., "Lead", "Quoted", "Booked", "In Progress", "Completed", "Archived"
        *   `notes`: (String) General notes about the project (optional).
        *   `totalAgreedPrice`: (Number) Initially from accepted quote, can be adjusted.
        *   `totalPaidAmount`: (Number) Sum of payments from related invoices. Calculated field, potentially by a Cloud Function.
        *   `createdAt`: (Timestamp) Firestore server timestamp
        *   `updatedAt`: (Timestamp) Firestore server timestamp (on update)
    *   Sub-collections:
        *   `quotes`: See below.
        *   `invoices`: See below.
        // Project-specific expenses are now part of the top-level 'expenses' collection, linked by projectId.

*   **packages**: Predefined packages a photographer offers.
    *   Document ID: Auto-generated
    *   Fields:
        *   `photographerUid`: (String) Firebase Auth UID of the owner.
        *   `packageName`: (String)
        *   `description`: (String)
        *   `services`: (Array of Maps) e.g., `[{name: "Engagement Shoot", price: 500, details: "2-hour session..." }, ...]`
        *   `basePrice`: (Number)
        *   `isActive`: (Boolean) Whether the package is currently offered.
        *   `createdAt`: (Timestamp) Firestore server timestamp
        *   `updatedAt`: (Timestamp) Firestore server timestamp (on update)

*   **expenses**: Stores all business expenses, both general and project-specific.
    *   Document ID: Auto-generated
    *   Fields:
        *   `photographerUid`: (String) Firebase Auth UID of the owner.
        *   `expenseDate`: (Timestamp) Date the expense was incurred.
        *   `description`: (String) Description of the expense.
        *   `amount`: (Number) Cost of the expense.
        *   `category`: (String) e.g., "Software", "Equipment", "Marketing", "Travel", "Second Shooter", "Album Printing".
        *   `projectId`: (String) Optional. If linked to a specific project, this is the project's document ID from the `projects` collection.
        *   `receiptUrl`: (String) Optional. URL to the uploaded receipt image/PDF in Firebase Storage.
        *   `storagePath`: (String) Optional. Full path to the receipt file in Firebase Storage (e.g., `receipts/{userId}/{expenseId}/{fileName}`). Useful for managing the file if needed.
        *   `notes`: (String) Optional. Any additional notes about the expense.
        *   `createdAt`: (Timestamp) Firestore server timestamp.
        *   `updatedAt`: (Timestamp) Firestore server timestamp (on update).

## Sub-Collections:

*   **quotes** (sub-collection of a `project`):
    *   Document ID: Auto-generated
    *   Fields:
        *   `quoteNumber`: (String) Generated or manual (e.g., "QUOTE-001").
        *   `quoteDate`: (Timestamp)
        *   `expiryDate`: (Timestamp) Optional.
        *   `status`: (String) e.g., "Draft", "Sent", "Accepted", "Declined", "Archived"
        *   `totalAmount`: (Number) Calculated sum of items.
        *   `items`: (Array of Maps) `[{description: "Service Description", quantity: 1, unitPrice: 100.00}, ...]`
        *   `terms`: (String) Optional, terms and conditions for the quote.
        *   `notes`: (String) Optional.
        *   `createdAt`: (Timestamp) Firestore server timestamp
        *   `updatedAt`: (Timestamp) Firestore server timestamp (on update)

*   **invoices** (sub-collection of a `project`):
    *   Document ID: Auto-generated
    *   Fields:
        *   `invoiceNumber`: (String) Generated or manual (e.g., "INV-001").
        *   `generatedFromQuoteId`: (String) Optional, ID of the accepted quote this invoice is based on.
        *   `invoiceDate`: (Timestamp)
        *   `dueDate`: (Timestamp)
        *   `status`: (String) e.g., "Draft", "Sent", "Paid", "Partially Paid", "Overdue", "Void"
        *   `totalAmount`: (Number) Calculated sum of items.
        *   `paidAmount`: (Number) Default 0. Sum of payments recorded against this invoice.
        *   `items`: (Array of Maps) `[{description: "Service Description", quantity: 1, unitPrice: 100.00}, ...]`
        *   `terms`: (String) Optional, payment terms, bank details etc.
        *   `notes`: (String) Optional.
        *   `createdAt`: (Timestamp) Firestore server timestamp
        *   `updatedAt`: (Timestamp) Firestore server timestamp (on update)
    *   Sub-collections:
        *   `payments`: See below.

*   **payments** (sub-collection of an `invoice`):
    *   Document ID: Auto-generated
    *   Fields:
        *   `paymentDate`: (Timestamp)
        *   `amount`: (Number)
        *   `method`: (String) e.g., "Stripe", "Bank Transfer", "Cash", "PayPal"
        *   `reference`: (String) Optional, transaction ID or note.
        *   `notes`: (String) Optional.
        *   `createdAt`: (Timestamp) Firestore server timestamp

## Timestamps:
For `createdAt` and `updatedAt` fields, utilize Firestore's `FieldValue.serverTimestamp()` for automatic population on the server-side.

## Client Management Decision:
Using a separate `clients` collection (as detailed above) is preferred for long-term flexibility and better client relationship management. Projects will link to clients via `clientId`.
