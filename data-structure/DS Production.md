
# Firestore Data Structure

This document outlines the data structure of the Firestore database for the FotoFlow application.

## Top-level Collections

### `studios`

*   **Description**: Stores information about each photo studio.
*   **Document ID**: `domain` (e.g., "ethan-ross-photography")

| Field | Data Type | Description |
| :--- | :--- | :--- |
| `id` | `String` | Unique identifier for the studio. |
| `name` | `String` | Name of the studio. |
| `domain` | `String` | The studio's unique domain name. |
| `status` | `String` | Enum: "active", "inactive", "suspended". |
| `batch` | `String` | Batch number for the studio. |
| `usage` | `Object` | Object containing usage data. |
| `usage.storage` | `Object` | Storage usage details. |
| `usage.storage.quota` | `Number` | Storage quota in MB. |
| `usage.storage.used` | `Number` | Used storage in MB. |
| `usage.projects` | `Object` | Project usage details. |
| `usage.projects.weeklyUsed` | `Number` | Number of projects created in the last week. |
| `usage.projects.monthlyUsed`| `Number` | Number of projects created in the last month. |
| `planId` | `String` | Reference to a plan in the `plans` collection. |
| `subscriptionId` | `String` | Reference to a subscription in the `subscriptions` collection. |
| `metadata` | `Object` | Metadata for the studio. |
| `metadata.createdAt` | `String` | ISO 8601 timestamp of creation. |
| `metadata.updatedAt` | `String` | ISO 8601 timestamp of last update. |
| `metadata.createdBy` | `String` | User or admin who created the studio. |
| `metadata.updatedBy` | `String` | User or admin who last updated the studio. |

#### Subcollections

##### `projects`

*   **Description**: Stores projects created by a studio.
*   **Document ID**: Auto-generated ID.

| Field | Data Type | Description |
| :--- | :--- | :--- |
| `id` | `String` | Unique identifier for the project. |
| `name` | `String` | Name of the project. |
| `type` | `String` | Type of project (e.g., "Wedding", "Portfolio"). |
| `status` | `String` | Status of the project. |
| `lastOpened` | `Number` | Timestamp of when the project was last opened. |
| `collections` | `Array` | An array of objects, each representing a collection. |
| `collections[].id` | `String` | Unique identifier for the collection. |
| `collections[].name` | `String` | Name of the collection. |
| `collections[].status` | `String` | Status of the collection. |
| `collections[].galleryCover`| `String` | URL of the gallery cover image. |
| `collections[].favoriteImages`| `Array` | An array of strings containing URLs of favorite images. |
| `collections[].filesCount` | `Number` | The number of files in the collection. |
| `totalFileSize` | `Number` | Total size of all files in the project. |
| `uploadedFilesCount` | `Number` | Total number of uploaded files in the project. |
| `projectCover` | `String` | URL of the project cover image. |
| `pin` | `String` | PIN for the project. |
| `events` | `Array` | An array of objects, each representing an event. |
| `events[].id` | `String` | Unique identifier for the event. |
| `events[].type` | `String` | Type of event. |
| `events[].date` | `String` | Date of the event. |
| `events[].location` | `String` | Location of the event. |
| `events[].crews` | `Array` | An array of objects, each representing a crew member. |
| `budgets` | `Object` | Budget information for the project. |
| `payments` | `Array` | An array of objects, each representing a payment. |
| `expenses` | `Array` | An array of objects, each representing an expense. |
| `invitation` | `Object` | Invitation information for the project. |

###### Subcollections

####### `collections`

*   **Description**: Stores collections within a project.
*   **Document ID**: Auto-generated ID.

| Field | Data Type | Description |
| :--- | :--- | :--- |
| `id` | `String` | Unique identifier for the collection. |
| `name` | `String` | Name of the collection. |
| `status` | `String` | Status of the collection. |
| `uploadedFiles` | `Array` | An array of objects, each representing an uploaded file. |
| `uploadedFiles[].name` | `String` | Name of the file. |
| `uploadedFiles[].url` | `String` | URL of the file. |
| `uploadedFiles[].status` | `String` | Status of the file (e.g., "selected", "unselected"). |

####### `events`

*   **Description**: Stores events within a project.
*   **Document ID**: Auto-generated ID.

| Field | Data Type | Description |
| :--- | :--- | :--- |
| `id` | `String` | Unique identifier for the event. |
| `type` | `String` | Type of event. |
| `date` | `String` | Date of the event. |
| `location` | `String` | Location of the event. |

### `users`

*   **Description**: Stores user information.
*   **Document ID**: `email`

| Field | Data Type | Description |
| :--- | :--- | :--- |
| `displayName` | `String` | The user's display name. |
| `email` | `String` | The user's email address. |
| `studio` | `String` | The domain of the studio the user belongs to. |

### `subscriptions`

*   **Description**: Stores subscription information for studios.
*   **Document ID**: Auto-generated ID.

| Field | Data Type | Description |
| :--- | :--- | :--- |
| `id` | `String` | Unique identifier for the subscription. |
| `studioId` | `String` | Reference to the studio. |
| `planId` | `String` | Reference to the plan. |
| `name` | `String` | Name of the subscription plan. |
| `type` | `String` | Enum: "free", "paid", "enterprise". |
| `status` | `String` | Enum: "active", "trial", "expired", "canceled". |
| `billingCycle` | `String` | The billing cycle for the subscription. |
| `trialEndDate` | `String` | ISO 8601 timestamp of the trial end date. |
| `startDate` | `String` | ISO 8601 timestamp of the subscription start date. |
| `endDate` | `String` | ISO 8601 timestamp of the subscription end date. |
| `autoRenew` | `Boolean` | Whether the subscription will auto-renew. |
| `pricing` | `Object` | Pricing information for the subscription. |
| `pricing.basePrice` | `Number` | The base price of the subscription. |
| `pricing.discount` | `Number` | The discount on the subscription. |
| `pricing.tax` | `Number` | The tax on the subscription. |
| `pricing.currency` | `String` | The currency of the subscription price. |
| `pricing.totalPrice` | `Number` | The total price of the subscription. |
| `paymentPlatform` | `String` | The payment platform used for the subscription. |
| `paymentMethod` | `String` | The payment method used for the subscription. |
| `metadata` | `Object` | Metadata for the subscription. |
| `metadata.createdAt` | `String` | ISO 8601 timestamp of creation. |
| `metadata.updatedAt` | `String` | ISO 8601 timestamp of last update. |
| `metadata.createdBy` | `String` | User or admin who created the subscription. |
| `metadata.updatedBy` | `String` | User or admin who last updated the subscription. |

### `referrals`

*   **Description**: Stores referral information.
*   **Document ID**: Auto-generated ID.

| Field | Data Type | Description |
| :--- | :--- | :--- |
| `code` | `Array` | An array of referral codes. |
| `name` | `String` | The name of the referral. |
| `quota` | `Number` | The number of times the referral can be used. |
| `used` | `Number` | The number of times the referral has been used. |
| `status` | `String` | Enum: "active", "passive". |
