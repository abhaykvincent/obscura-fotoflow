# Project Overview

This is a React application built with `create-react-app`. It integrates with Firebase for backend services and uses Redux for state management. Styling is handled with SASS.

## Key Technologies

*   **Frontend:** React.js
*   **State Management:** Redux Toolkit
*   **Styling:** SASS
*   **Backend/Cloud:** Firebase (Firestore, Cloud Functions)

## Available Scripts

In the project directory, you can run:

*   `npm start`: Runs the app in development mode.
*   `npm build`: Builds the app for production to the `build` folder.
*   `npm test`: Launches the test runner.

## Project Structure Highlights

*   `src/components/`: Contains reusable React components.
*   `src/firebase/`: Firebase configuration and initialization.
*   `src/store/`: Redux slices and store configuration.
*   `src/style/`: Global styles and SASS partials.
*   `functions/`: Firebase Cloud Functions.

## Conventions

*   **Component Naming:** PascalCase for React components (e.g., `MyComponent.js`).
*   **Styling:** SASS modules are used, with partials prefixed by `_`.
*   **State Management:** Redux slices are defined in `src/store/`.
*   **Firebase:** Configuration and service interactions are centralized in `src/firebase/`.


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