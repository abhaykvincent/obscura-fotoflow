# Gemini CLI Agent Guidelines for FotoFlow Project

This document provides guidelines for the Gemini CLI agent to effectively interact with and contribute to the `obscura-fotoflow` project.

## 1. Project Overview

`obscura-fotoflow` is a web application designed for managing and sharing photo projects. It integrates with Firebase for backend services, including authentication, data storage (Firestore), and file storage (Cloud Storage). The frontend is built with React and Redux for state management.

## 2. Tech Stack

*   **Frontend**: React.js
*   **State Management**: Redux Toolkit
*   **Backend/Database**: Firebase (Firestore, Cloud Storage, Authentication)
*   **EXIF Data**: `exifreader`
*   **Image Compression**: `browser-image-compression`
*   **Routing**: `react-router-dom`


## 6. Redux State Management

*   Redux Toolkit is used for state management.
*   Slices are defined in `src/app/slices/`.
*   Actions and reducers should be defined within their respective slices.
*   **Serialization**: Ensure all data stored in the Redux store and dispatched in actions is **serializable**. Avoid storing `Date` objects, Promises, or other non-plain JavaScript values directly. Convert them to serializable formats (e.g., ISO strings for dates) before dispatching.
 
  

# Coding Guidelines
Maintain code quality, consistency, and readability across the project