# Project Data Structure

This document outlines the data structure for a "Project" object within the FotoFlow application, as stored and managed in Firestore.

## Root Level Fields

| Field                 | Type      | Description                                                                 |
| --------------------- | --------- | --------------------------------------------------------------------------- |
| `id`                  | `String`  | Unique identifier for the project.                                          |
| `name`                | `String`  | The name of the project.                                                    |
| `name2`               | `String`  | An optional second name, often used for weddings.                           |
| `type`                | `String`  | The type of project (e.g., 'Wedding', 'Birthday').                          |
| `status`              | `String`  | The current status of the project (e.g., 'draft', 'active', 'completed').   |
| `description`         | `String`  | A description of the project.                                               |
| `createdAt`           | `Timestamp`| The date and time the project was created.                                  |
| `lastOpened`          | `Timestamp`| The date and time the project was last opened.                              |
| `projectCover`        | `String`  | URL of the project's cover image.                                           |
| `pin`                 | `String`  | A memorable PIN for project access.                                         |
| `projectValidityMonths`| `Number`  | The number of months the project is valid for.                              |
| `totalFileSize`       | `Number`  | The total size of all files in the project, in bytes.                       |
| `uploadedFilesCount`  | `Number`  | The total number of files uploaded to the project.                          |
| `collections`         | `Array`   | An array of [Collection](#collection-object) objects.                       |
| `events`              | `Array`   | An array of [Event](#event-object) objects.                                 |
| `budgets`             | `Object`  | A [Budget](#budget-object) object containing budget details.                |
| `payments`            | `Array`   | An array of [Payment](#payment-object) objects.                             |
| `expenses`            | `Array`   | An array of [Expense](#expense-object) objects.                             |
| `invitation`          | `Object`  | An [Invitation](#invitation-object) object for the project.                 |

---

## Nested Objects

### Collection Object

| Field            | Type    | Description                                                               |
| ---------------- | ------- | ------------------------------------------------------------------------- |
| `id`             | `String`| Unique identifier for the collection.                                     |
| `name`           | `String`| The name of the collection.                                               |
| `status`         | `String`| The status of the collection.                                             |
| `galleryCover`   | `String`| URL of the gallery's cover image.                                         |
| `favoriteImages` | `Array` | An array of URLs for favorite images.                                     |
| `filesCount`     | `Number`| The number of files in the collection.                                    |
| `uploadedFiles`  | `Array` | An array of [Uploaded File](#uploaded-file-object) objects.               |

### Uploaded File Object

| Field    | Type     | Description                                                              |
| -------- | -------- | ------------------------------------------------------------------------ |
| `name`   | `String` | The name of the file.                                                    |
| `url`    | `String` | The URL of the uploaded file.                                            |
| `status` | `String` | The status of the file (e.g., 'selected', 'unselected').                 |

### Event Object

| Field      | Type     | Description                                                              |
| ---------- | -------- | ------------------------------------------------------------------------ |
| `id`       | `String` | Unique identifier for the event.                                         |
| `type`     | `String` | The type of event (e.g., 'Photo Upload Completion', 'Wedding Ceremony'). |
| `date`     | `Timestamp`| The date and time of the event.                                          |
| `location` | `String` | The location of the event.                                               |
| `crews`    | `Array`  | An array of [Crew Member](#crew-member-object) objects.                  |

### Crew Member Object

| Field       | Type     | Description                               |
| ----------- | -------- | ----------------------------------------- |
| `displayName`| `String` | The display name of the crew member.      |
| `email`     | `String` | The email of the crew member.             |
| `photoURL`  | `String` | The URL of the crew member's photo.       |
| `studio`    | `String` | The studio the crew member belongs to.    |

### Budget Object

| Field | Type | Description |
| --- | --- | --- |
| `amount` | `Number` | The total budget amount. |
| `currency` | `String` | The currency of the budget. |

### Payment Object

| Field | Type | Description |
| --- | --- | --- |
| `id` | `String` | Unique identifier for the payment. |
| `amount` | `Number` | The amount of the payment. |
| `date` | `Timestamp` | The date of the payment. |
| `method` | `String` | The payment method used. |

### Expense Object

| Field | Type | Description |
| --- | --- | --- |
| `id` | `String` | Unique identifier for the expense. |
| `amount` | `Number` | The amount of the expense. |
| `date` | `Timestamp` | The date of the expense. |
| `description` | `String` | A description of the expense. |

### Invitation Object

| Field | Type | Description |
| --- | --- | --- |
| `id` | `String` | Unique identifier for the invitation. |
| `...` | `...` | Other invitation-related fields. |
