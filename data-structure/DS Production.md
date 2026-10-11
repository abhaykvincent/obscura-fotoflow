
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

####### `selectionGalleries`

*   **Description**: Client-only proofing/selection workspaces over existing project photos. A Selection Gallery **references existing photos and does not duplicate Storage objects**. The same underlying image is usable in the public gallery, selection galleries, photographer selections and future design workflows via a stable `photoId` (fallback: `url` during migration).
*   **Path**: `studios/{domain}/projects/{projectId}/selectionGalleries/{selectionGalleryId}`
*   **Relationship**: Project Photo → Selection Reference (never Photo → Copy → Selection Gallery Photo).
*   **Separation**: Collection = where photos belong · Selection Gallery = what the client is asked to choose · Category = how that selection is organized · Selection = the client's actual choice.

| Field | Data Type | Description |
| :--- | :--- | :--- |
| `id` | `String` | Unique identifier for the gallery (e.g. `album-selection-x7k2q`, or `default` for the legacy-compat gallery). |
| `name` | `String` | Display name (e.g. "Album Selection"). |
| `description` | `String` | Optional photographer note. |
| `status` | `String` | Lifecycle: `draft` (configuring, client cannot access) · `active` (client can select) · `completed` (submitted, read-only unless reopened) · `locked` (photographer-frozen) · `archived` (historical). |
| `selectionMode` | `String` | `limit` or `unlimited`. |
| `selectionLimit` | `Number\|null` | Overall maximum selections (`null` when unlimited). |
| `selectedCount` | `Number` | Denormalized aggregate; source of truth is the `selections` subcollection. Recomputable via `recomputeGalleryCounters`. |
| `progressPercent` | `Number` | Denormalized 0–100 aggregate. |
| `categories` | `Array` | Selection buckets (not image collections). A photo is assigned to a category when selected. |
| `categories[].id` | `String` | Stable category id (slug). |
| `categories[].name` | `String` | Display name (Bride, Groom, Couple, Family, Ceremony, Reception…). |
| `categories[].maximumSelections` | `Number\|null` | Max selections in this category (`null` = unlimited). Legacy `limit` field mirrors this for reads. |
| `categories[].minimumSelections` | `Number` | Minimum required before completion (default 0). |
| `categories[].required` | `Boolean` | When true, `minimumSelections` must be met before Finish. |
| `categories[].selectedCount` | `Number` | Denormalized per-category aggregate. |
| `categories[].sortOrder` | `Number` | Display order. |
| `client` | `Object` | `{ name, email, phone }` client contact snapshot. |
| `pinRequired` | `Boolean` | Always true in v1; selection uses the project PIN workflow. |
| `createdAt` / `updatedAt` / `activatedAt` / `completedAt` | `Number` | Millis timestamps. |
| `createdBy` / `updatedBy` | `String` | Actor identifiers. |

######## `selections` (subcollection)

*   **Path**: `studios/{domain}/projects/{projectId}/selectionGalleries/{selectionGalleryId}/selections/{photoKey}`
*   **Description**: One document per selected photo reference. High-cardinality data lives here so gallery docs stay small for 1,000–5,000+ photo weddings. Individual records + aggregate counters + paginated photo loading keep reads/writes O(1) per click.

| Field | Data Type | Description |
| :--- | :--- | :--- |
| `photoId` | `String` | Stable photo identity (preferred). Falls back to `url` for legacy selections. |
| `photoKey` | `String` | Resolved identity used as doc-id basis (`photoId` ⟸ `url`). |
| `url` | `String\|null` | Legacy resolution fallback; not a copy. |
| `collectionId` | `String\|null` | Originating project collection (where the photo belongs). |
| `categoryId` | `String\|null` | Selection bucket the choice was assigned to. |
| `selectedAt` | `Number` | Millis timestamp. |
| `selectedBy` | `String` | `client` or photographer identifier. |
| `status` | `String` | `selected`. |

**Backward compatibility**: `collections[].selectionGallery` (boolean) is preserved. Projects with `selectionGallery === true` are treated as having a `default` Selection Gallery (unlimited mode, status `active`). `/{studio}/selection/{projectId}` legacy links resolve to the active gallery or the legacy workflow when no gallery exists. `project.status = "selected"` is preserved for the default gallery; per-gallery `status` is the source of truth for multi-gallery projects. Selection reset requests carry an optional `selectionGalleryId` so Album / Wall Art / Social resets stay isolated. See `scripts/migrate-selection-galleries.js` (idempotent) for the one-time legacy migration.

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
