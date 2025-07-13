# Gemini CLI Agent Guidelines for FotoFlow Project

This document provides guidelines for the Gemini CLI agent to effectively interact with and contribute to the `obscura-fotoflow` project.

## 1. Project Overview

`obscura-fotoflow` is a web application designed for managing and sharing photo projects. It integrates with Firebase for backend services, including authentication, data storage (Firestore), and file storage (Cloud Storage). The frontend is built with React and Redux for state management.

## 2. Tech Stack

*   **Frontend**: React.js
*   **State Management**: Redux Toolkit
*   **Styling**: Sass, Tailwind CSS (with `tailwind-merge`, `tailwindcss-animate`)
*   **Backend/Database**: Firebase (Firestore, Cloud Storage, Authentication)
*   **EXIF Data**: `exifreader`
*   **Image Compression**: `browser-image-compression`
*   **Routing**: `react-router-dom`
*   **UI Components**: Material-UI (`@mui/material`), Radix UI (`@radix-ui/react-dropdown-menu`), `sonner` (for toasts)

## 3. Key Directories

*   `src/`: Contains all source code for the React application.
    *   `src/app/`: Redux store configuration and slices.
    *   `src/assets/`: Static assets like images, fonts, animations.
    *   `src/components/`: Reusable React components.
    *   `src/features/`: Feature-specific components and logic (e.g., Login, Projects).
    *   `src/firebase/`: Firebase initialization and Firestore/Storage interaction functions.
    *   `src/hooks/`: Custom React hooks.
    *   `src/utils/`: Utility functions (e.g., file handling, authentication, string manipulation).
    *   `src/style/`: Global styles, variables, and component-specific Sass.
*   `public/`: Static assets served directly (e.g., `index.html`, `favicon.png`).
*   `firebase/`: Firebase configuration files, security rules (`firestore.rules`, `storage.rules`), and Cloud Functions.
*   `data-structure/`: Markdown files describing key data structures (e.g., `Project Data structure.md`).
*   `.env.development`, `.env.production`: Environment variables.

## 4. Development Workflow

*   **Starting the Development Server**:
    ```bash
    npm start
    ```
    (This uses `dotenv -e .env.development react-scripts start` as defined in `package.json`.)

*   **Building for Production**:
    ```bash
    npm run build
    ```
    (This uses `dotenv -e .env.production react-scripts build`.)

*   **Firebase Emulator**:
    ```bash
    npm run emulator
    ```


*   **Linting/Formatting**:
    *   The project uses ESLint (configured via `eslintConfig` in `package.json`).
    *   No explicit linting script is provided in `package.json` for direct execution. Assume `react-scripts` handles basic linting during development/build. If manual linting is required, `npx eslint src/` could be used.
    *   Follow existing code style and formatting.

## 5. Firebase Specifics

*   **Firestore Rules**: Defined in `firebase/firestore.rules`. Adhere to these rules when modifying data access.
*   **Storage Rules**: Defined in `firebase/storage.rules`. Adhere to these rules when modifying file storage access.
*   **Firebase Functions**: Located in `firebase/functions/`. Changes to backend logic should be made here.

## 6. Redux State Management

*   Redux Toolkit is used for state management.
*   Slices are defined in `src/app/slices/`.
*   Actions and reducers should be defined within their respective slices.
*   **Serialization**: Ensure all data stored in the Redux store and dispatched in actions is **serializable**. Avoid storing `Date` objects, Promises, or other non-plain JavaScript values directly. Convert them to serializable formats (e.g., ISO strings for dates) before dispatching.
 
  

# Coding Guidelines
To maintain code quality, consistency, and readability across the project, please adhere to the following guidelines:

## General Principles
*   **Readability:** Write code that is easy to understand, even for someone unfamiliar with the project.
*   **Maintainability:** Design code that is easy to modify, debug, and extend in the future.
*   **DRY (Don't Repeat Yourself):** Avoid redundant code. Abstract common patterns into reusable functions, components, or hooks.
*   **Simplicity:** Prefer simpler solutions over complex ones, even if they seem less "clever."
*   **Consistency:** Follow established patterns and conventions already present in the codebase.
*   **Early Exit:** Use early returns/exits for clearer conditional logic.

## JavaScript
*   **Modern JavaScript:** Utilize ES6+ features (e.g., async/await, const/let, arrow functions, spread/rest operators).
*   **Immutability:** Always treat data as immutable, especially when working with Redux state. Use spread operators (...) or immutable utility libraries (if adopted) for state updates.
*   **Destructuring:** Use object and array destructuring for cleaner code when accessing properties.
*   **Comments:** Add comments to explain why certain decisions were made, complex logic, or workarounds. Avoid commenting on what the code does if it's self-explanatory.

*   **Type Safety (if TypeScript is introduced later):** Use TypeScript for improved code safety and developer experience. Define interfaces and types clearly.

## React.js
*   **Functional Components & Hooks:** Prefer functional components over class components. Utilize React Hooks (useState, useEffect, useContext, custom hooks) for managing state and side effects.

*   **One Component Per File:** Generally, each React component should reside in its own file (e.g., src/components/Button/Button.js).

*   **Props:**
    *   Destructure props at the top of the component function signature or inside the component body for clarity.
    *   Use PropTypes or TypeScript interfaces for prop validation and documentation.
    *   Avoid "prop drilling" (passing props through many layers of components). Consider using Redux or React Context for global state.

*   **Keys:** Always provide a key prop when rendering lists of components. The key should be stable and unique (e.g., database ID, not array index).

*   **Conditional Rendering:** Use && or ternary operators (condition ? <TrueComponent /> : <FalseComponent />) for conditional rendering.

*   **Folder Structure:** Components related to a specific feature or domain can be grouped into subfolders (e.g., src/features/Auth/components/LoginButton.js).

*   **Event Handlers:** Name event handlers clearly (e.g., handleClick, handleSubmit, onInputChange).

## Redux Toolkit
*   **Redux Toolkit Features:** Leverage createSlice for defining reducers and actions, and createAsyncThunk for handling asynchronous logic.

*   **Ducks Pattern:** Organize Redux logic by feature, co-locating the reducer, actions, and selectors for a specific slice of state within a single file or a dedicated folder. (e.g., src/store/authSlice.js or src/store/features/auth/).

*   **Selectors:** Use selector functions to derive data from the Redux store. This centralizes data access logic and makes refactoring easier.

*   **Immutability:** Ensure all reducers produce new state objects rather than mutating the original state. Redux Toolkit's createSlice helps enforce this with Immer.

## SASS
*   **BEM Methodology (or similar):** Consider using a naming convention like BEM (Block-Element-Modifier) for CSS classes to improve modularity and avoid conflicts (e.g., component__element--modifier).

*   **Partials:** Break down your SASS into smaller, manageable partials (files prefixed with _) and import them into a main SASS file.

*   **Variables:** Use SASS variables for colors, fonts, spacing, breakpoints, etc., to ensure consistency and easy updates.

*   **Mixins & Functions:** Utilize mixins for reusable blocks of styles and functions for calculations or generating values.

*   **Nesting:** Use SASS nesting sparingly and thoughtfully. Avoid deep nesting (more than 3-4 levels) as it can lead to overly specific CSS and maintainability issues.

*   **No IDs in CSS:** Avoid styling with ID selectors in SASS as they are too specific and reduce reusability. Stick to classes.

# Important Notes for Gemini

*   **File Paths**: Always use absolute paths when interacting with files using tools like `read_file`, `write_file`, `replace`.
*   **Dependency Management**: Use `npm install` after modifying `package.json`.
*   **Firebase Interaction**: Be mindful of Firebase security rules and data structures. Always verify changes against existing patterns.
*   **Redux State**: Pay close attention to Redux state immutability and serialization.
*   **User Confirmation**: For any significant changes or shell commands that modify the file system, explain the action and its potential impact.
*   **Data Structure**: For any significant changes in the data structure must be updated in Project Data structure Updated.md. Use Project Data structure.md as a reference to investigate changes in DS in the code. Do not use Project Data structure Updated.md as the source to find the change in the DS; it's only to update the change after DS change investigation.

**DS Change Investigation Protocol**:

1.  **Understand the Change**:
    *   Review the `Project Data structure Updated.md` (or similar documentation) to fully grasp the nature of the change (e.g., new fields, removed fields, type changes, renames).
    *   **Crucially, determine the *purpose* of the new field and whether it's truly necessary for the intended functionality or display.**

2.  **Identify Affected Code Areas**:
    *   **Data Interaction Points**: Pinpoint files responsible for reading from and writing to the data structure. This often includes:
        *   Firebase interaction files (`src/firebase/`, `src/utils/firebaseAuthentication.js`, `src/utils/storageOperations.js`, `src/utils/uploadOperations.js`).
        *   Redux slices that manage this data (`src/app/slices/`).
        *   Components that display or manipulate this data (`src/components/`, `src/features/`).
        *   Utility functions that process or transform this data (`src/utils/`).
    *   **Tests**: Locate relevant test files that might need updates (`src/**/*.test.js`).

3.  **Search the Codebase for Usage**:
    *   Use `search_file_content` with relevant keywords (e.g., the old field name, the new field name, the data structure's parent object name) to find all occurrences across the project. I'd typically narrow this down with `include` patterns like `*.js`, `*.jsx`, `*.ts`, `*.tsx`.

4.  **Deep Dive into Affected Files**:
    *   For each identified file, use `read_file` to examine how the data structure is being used, modified, or displayed. This helps in understanding the impact of the change.

5.  **Formulate a Plan for Adaptation**:
    *   Based on the investigation, I'd outline the necessary code modifications:
        *   Updating Redux reducers and selectors to handle the new structure.
        *   Adjusting Firebase queries or data mapping logic.
        *   Modifying React components to correctly render or interact with the updated data.
        *   Refactoring utility functions.
        *   Updating or creating new tests to ensure the changes work as expected and don't introduce regressions.
        *   **If the new field is not strictly necessary for the UI or core functionality, consider if it should be used at all, or if existing fields (like `lastModified`) are sufficient.**

6.  **Implement and Verify**:
    *   Apply the changes using `replace` or `write_file`.
    *   Run relevant tests (if available) and project-specific build/linting commands (`npm run build`, `npx eslint src/`) to ensure code quality and functionality.
When "DS change investigation Protocol" is called, perform the investigation and update the change in Project Data structure Updated.md.

