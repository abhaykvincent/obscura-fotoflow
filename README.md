
# FotoFlow

FotoFlow is a comprehensive **workflow management tool** built for **event photographers**. It offers streamlined solutions for project management, client interaction, image selection, financial tracking, and gallery sharing.

---

## Table of Contents
1. [Features](#features)
2. [Installation](#installation)
3. [Usage](#usage)
4. [Tech Stack](#tech-stack)
5. [Configuration](#configuration)
6. [Contact](#contact)

---

## Features

- **Client Management**: Simplify client onboarding, contracts, and communication.
- **Image Selection & Gallery**: Upload, share, and let clients select final album photos.
- **Project Management**: Track events, monitor progress, and manage tasks.
- **Financial Management**: Track expenses, invoices, and cash flow.
- **Multi-Studio Support**: Manage multiple studios in a single instance.
- **Team Collaboration**: Assign roles and work with team members.

---

## Installation

### Prerequisites
- **Node.js** v16+
- **npm** v8+
- Firebase project with **Firestore** & **Authentication**

### Steps
1. **Clone** the repository:
   ```bash
   git clone https://your-repo-url/fotoflow.git
   cd fotoflow
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Firebase Setup**: Create a Firebase project, enable Firestore and Authentication, and get config details.
4. **Environment Variables**: Rename `.env.example` to `.env`, add Firebase config.
5. **Run**:
   ```bash
   npm start
   ```

---

## Usage

1. **Create Projects** and define client information.
2. **Upload Images** for client selection and feedback.
3. **Share Galleries** with clients for image selection.
4. **Track Financials**: Manage expenses, invoices, and payments.

---

## Tech Stack

- **Frontend**: React, JavaScript, SCSS
- **Backend**: Node.js, Express
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **State Management**: Redux Toolkit

---

## Configuration

### Firebase & Environment Variables
Add the following variables to `.env`:
```plaintext
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

---

## Contact

For inquiries or support, please reach out at [fotoflow.web@gmail.com].

---

© [Year] FotoFlow. All rights reserved. **Proprietary Software**. No permission is granted to copy, modify, or distribute.
