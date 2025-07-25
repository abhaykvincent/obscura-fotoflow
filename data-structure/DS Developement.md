# Firestore Data Structures (Development)

This document outlines the observed Firestore data structures based on the current codebase.

## Collections and their Document Fields

### 1. `studios` collection

*   **Description**: Top-level collection representing different studios or organizations.
*   **Document ID**: `studioId` (e.g., `domain` from `defaultStudio.domain`).
*   **Fields**:
    *   `name`: String (Inferred, e.g., `defaultStudio.name`)
    *   Other studio-specific configuration (not explicitly defined in provided code).
*   **Sub-collections**:
    *   `projects`
    *   `conversations`

### 2. `studios/{studioId}/projects` collection

*   **Description**: Stores individual photo projects belonging to a specific studio.
*   **Document ID**: `projectId`
*   **Fields**:
    *   `name`: String
    *   `description`: String
    *   `createdAt`: String (ISO date string)
    *   `userId`: String (ID of the user who created the project)
    *   `status`: String (e.g., 'active', 'archived')
    *   `projectCover`: String (URL of the project cover image)
    *   `focusPoint`: String (e.g., "50% 50%", for image cropping/focus)
*   **Sub-collections**:
    *   `collections`
    *   `events`
    *   `payments`
    *   `expenses`
    *   `budgets`
    *   `subProjects`

### 3. `studios/{studioId}/projects/{projectId}/collections` collection

*   **Description**: Contains image collections within a specific project.
*   **Document ID**: `collectionId`
*   **Fields**:
    *   `name`: String
    *   Other collection-specific metadata (e.g., creation date, description, image counts - not explicitly defined).
*   **Sub-collections**: (Likely, but not explicitly defined in code)
    *   `images` (or similar, to store individual image metadata)

### 4. `studios/{studioId}/projects/{projectId}/events` collection

*   **Description**: Stores event details associated with a project.
*   **Document ID**: `eventId`
*   **Fields**:
    *   `id`: String (likely the document ID, but used as a field in `addEvent` return)
    *   Other event-specific fields (e.g., `name`, `date`, `location`, `description` - not explicitly defined).
*   **Sub-collections**:
    *   `crews`

### 5. `studios/{studioId}/projects/{projectId}/events/{eventId}/crews` collection

*   **Description**: Stores information about crew members for a specific event.
*   **Document ID**: Auto-generated or `crewId`
*   **Fields**:
    *   `crewData`: Object (contains details about the crew member, specific fields not defined in code)

### 6. `studios/{studioId}/projects/{projectId}/payments` collection

*   **Description**: Records payment transactions related to a project.
*   **Document ID**: Auto-generated or `paymentId`
*   **Fields**:
    *   `paymentData`: Object (contains payment details like `amount`, `date`, `description`, `status` - specific fields not defined in code)

### 7. `studios/{studioId}/projects/{projectId}/expenses` collection

*   **Description**: Records expenses incurred for a project.
*   **Document ID**: Auto-generated or `expenseId`
*   **Fields**:
    *   `expenseData`: Object (contains expense details like `amount`, `date`, `category`, `description` - specific fields not defined in code)

### 8. `studios/{studioId}/projects/{projectId}/budgets` collection

*   **Description**: Stores budget-related information for a project.
*   **Document ID**: Auto-generated or `budgetId`
*   **Fields**:
    *   `budgetData`: Object (contains budget details like `totalBudget`, `allocatedFunds`, `remainingFunds` - specific fields not defined in code)

### 9. `studios/{studioId}/projects/{projectId}/subProjects` collection

*   **Description**: Stores sub-projects nested within a main project.
*   **Document ID**: `subProjectId`
*   **Fields**:
    *   `subProjectData`: Object (contains details about the sub-project, specific fields not defined in code)

### 10. `studios/{studioId}/conversations` collection

*   **Description**: Manages chat conversations within a studio (e.g., for FlowPilot support).
*   **Document ID**: `conversationId`
*   **Fields**:
    *   `studioId`: String
    *   `participants`: Object
        *   `userIds`: Array of Strings (IDs of users participating)
        *   `agentIds`: Array of Strings (IDs of agents participating)
        *   `unreadCounts`: Object (map of `userId` to `count` of unread messages)
    *   `meta`: Object
        *   `status`: String (e.g., 'open', 'closed')
        *   `type`: String (e.g., 'support')
        *   `priority`: String (e.g., 'normal')
        *   `tags`: Array of Strings
        *   `lastMessage`: String (content of the last message)
        *   `lastUpdated`: String (ISO date string of last update)
        *   `createdAt`: String (ISO date string of conversation creation)
        *   `closedAt`: String (ISO date string when conversation was closed)
*   **Sub-collections**:
    *   `messages`

### 11. `studios/{studioId}/conversations/{conversationId}/messages` collection

*   **Description**: Stores individual messages within a conversation.
*   **Document ID**: Auto-generated or `messageId`
*   **Fields**:
    *   `conversationId`: String
    *   `studioId`: String
    *   `content`: Object
        *   `text`: String (message content)
        *   `aiMetadata`: Object
            *   `isAIGenerated`: Boolean
            *   `detectedIntent`: String
            *   `inputPrompt`: Object (optional, for AI prompts, contains `fields` array of objects with `field` and `inputType`)
            *   `lists`: Array of Objects (optional, for AI suggestions, contains `item`, `action`, `params`)
    *   `sender`: Object
        *   `id`: String (sender's user ID or 'flowpilot-bot')
        *   `type`: String (e.g., 'customer', 'bot')
        *   `name`: String (sender's display name)
        *   `avatar`: String (URL to sender's avatar)
    *   `status`: Object
        *   `delivered`: Boolean
        *   `read`: Boolean
        *   `edited`: Boolean
    *   `timestamps`: Object
        *   `createdAt`: String (ISO date string)
        *   `updatedAt`: String (ISO date string)

### 12. `users` collection

*   **Description**: Stores user profile information.
*   **Document ID**: `userId` (Firebase Authentication UID)
*   **Fields**: (Inferred from common Firebase user patterns)
    *   `email`: String
    *   `displayName`: String
    *   `photoURL`: String
    *   `studioId`: String (if a user is associated with a specific studio)
    *   `createdAt`: Timestamp
    *   `lastLogin`: Timestamp

### 13. `referrals` collection

*   **Description**: Tracks user referrals.
*   **Document ID**: Auto-generated or `referralId`
*   **Fields**: (Inferred)
    *   `referrerId`: String (ID of the user who made the referral)
    *   `referredId`: String (ID of the user who was referred)
    *   `status`: String (e.g., 'pending', 'completed')
    *   `timestamp`: Timestamp

### 14. `notifications` collection

*   **Description**: Stores user notifications.
*   **Document ID**: Auto-generated or `notificationId`
*   **Fields**: (Inferred)
    *   `userId`: String (ID of the recipient user)
    *   `message`: String (notification content)
    *   `read`: Boolean
    *   `timestamp`: Timestamp
    *   `type`: String (e.g., 'info', 'warning', 'success')
    *   `link`: String (optional URL for the notification)

### 15. `subscriptions` collection

*   **Description**: Manages user subscription details.
*   **Document ID**: Auto-generated or `subscriptionId`
*   **Fields**: (Inferred)
    *   `userId`: String
    *   `planId`: String (ID of the subscribed plan)
    *   `status`: String (e.g., 'active', 'cancelled', 'trial')
    *   `startDate`: Timestamp
    *   `endDate`: Timestamp
    *   `stripeCustomerId`: String (Stripe customer ID)
    *   `stripeSubscriptionId`: String (Stripe subscription ID)

### 16. `invoices` collection

*   **Description**: Stores invoice records for subscriptions or other payments.
*   **Document ID**: Auto-generated or `invoiceId`
*   **Fields**: (Inferred)
    *   `userId`: String
    *   `subscriptionId`: String (if related to a subscription)
    *   `amount`: Number
    *   `currency`: String
    *   `date`: Timestamp
    *   `status`: String (e.g., 'paid', 'unpaid', 'refunded')
    *   `invoiceUrl`: String (URL to the invoice document)
    *   `stripeInvoiceId`: String (Stripe invoice ID)
