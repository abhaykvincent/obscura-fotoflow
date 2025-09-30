# Scrutiny Report: Onboarding Feature (v2)

This report analyzes the onboarding feature located in `src/features/Onboarding/v2/`. It covers the user flow, component structure, state management, and provides suggestions for improvement.

## 1. Overall Summary

The `v2` onboarding feature is a multi-step process designed to sign up new users and create their first "Studio". It guides the user through Google authentication, studio name and domain creation, and contact information collection. The flow is heavily dependent on a valid referral code. It uses custom hooks to manage business logic and component state, and Redux Toolkit for managing the final onboarding submission.

## 2. User Flow

1.  **Invitation Validation:** The user arrives with a `ref` code in the URL. The `useInvitation` hook validates this code against the backend. If the code is invalid, the user is prompted to contact support via WhatsApp.
2.  **Greeting:** If the invitation is valid, the user is greeted with a personalized message based on the time of day, courtesy of the `usePersonalizedGreeting` hook.
3.  **Studio Creation:**
    *   The user is first presented with the `CreateStudioForm`.
    *   They enter a studio name, which automatically generates a suggested studio domain (URL slug).
    *   The app checks for the domain's availability in real-time against Firebase.
    *   The user can only proceed once an available domain is entered.
4.  **Contact & Authentication:**
    *   The user moves to the `UserContactForm`.
    *   They enter a 10-digit phone number. Basic validation is provided.
    *   If not already logged in, the user is prompted to "Continue with Google". This triggers Firebase Google Authentication.
    *   Upon successful login, the user's Google account information is displayed.
    *   The user must agree to the Privacy Policy.
5.  **Account Completion:**
    *   Once all steps are complete, the `completeOnboarding` async thunk is dispatched.
    *   This thunk calls `onboardingService.createAccountAndStudio` to create the user and studio documents in Firestore.
    *   A success notification is shown, the user is logged into the Redux state, and they are redirected to their newly created studio's dashboard (e.g., `/<studio-domain>`).

## 3. Component & Hooks Breakdown

### Components

*   **`Onboarding.jsx`**: The main container component. It orchestrates the entire flow, manages which screen (`CreateStudioForm` or `UserContactForm`) is visible, and handles the final submission.
*   **`CreateStudioForm.jsx`**: A controlled form for capturing the studio name and checking for domain availability. It provides suggestions for subdomains.
*   **`UserContactForm.jsx`**: A controlled form for capturing the user's contact number. It also handles the trigger for Google Sign-In and requires agreement to the privacy policy.

### Hooks

*   **`useInvitation.js`**: Fetches and validates the referral code from the backend. Manages loading and error states for this specific API call.
*   **`useOnboardingForm.js`**: A simple state manager for the form data across both component steps. It centralizes the `formData` object.
*   **`usePersonalizedGreeting.js`**: Returns a time-sensitive greeting message. This is a purely presentational hook.

### State Management (`onboardingSlice.js`)

*   **`completeOnboarding` (Async Thunk)**: This is the core of the feature's side effects. It encapsulates the entire process of creating a studio, dispatching notifications, showing alerts, and handling navigation upon success.
*   **Slice State**: The slice itself is very simple, primarily tracking the `status` (`loading`, `succeeded`, `failed`) of the `completeOnboarding` operation.

## 4. Potential Issues & Suggestions for Improvement

1.  **Hardcoded Test Data**: In `Onboarding.jsx`, a `useEffect` hook dispatches `generateReferral` with hardcoded data (`name: "Abhay"`). This is clearly for testing and should be removed from the production component code.
    *   **Suggestion**: Move this logic to a dedicated admin panel, a seeding script, or a separate test file.

2.  **Implicit Form Submission**: In `UserContactForm.jsx`, a `useEffect` is set up to automatically call `onNext()` when `user?.email`, `inputMessage.type`, and `privacyPolicyAgreed` are all satisfactory. This can lead to unexpected behavior and race conditions. The form submission should always be triggered by an explicit user action (i.e., clicking the button).
    *   **Suggestion**: Remove the `useEffect`. The `handleSubmit` function is already correctly wired to the "Open App" button. The `handleGoogleSignInAndProceed` should be the only path for automatic progression after login.

3.  **Inefficient Domain Checking**: The `checkStudioDomainAvailability` function in `CreateStudioForm.jsx` is called on every keystroke in the studio name field because `studioDomain` is updated on every change. This results in a high number of reads from Firebase.
    *   **Suggestion**: Debounce the `checkStudioDomainAvailability` call within the `useEffect`. A delay of 300-500ms would significantly reduce the number of requests while still feeling responsive.

4.  **State Management Complexity**: The management of the current screen (`currentScreen`) is handled by a simple `useState` in `Onboarding.jsx`. For a two-step form, this is acceptable, but for more complex flows, it can become unwieldy.
    *   **Suggestion**: For future scalability, consider using a state machine library (like XState) or a reducer (`useReducer`) to manage the flow between screens. This makes the transitions more explicit and robust.

5.  **Fragmented Form State**: The form state is spread across multiple locations: `formData` from `useOnboardingForm`, `contactNumber` and `privacyPolicyAgreed` in `UserContactForm`, and `studioName`/`studioDomain` in `CreateStudioForm`. Validation logic (`errors`, `inputMessage`) is also local to each component.
    *   **Suggestion**: Consolidate all form state and validation logic into the `useOnboardingForm` hook. The hook could return the state, update functions, and validation status, making the components themselves simpler and more focused on rendering.

## 5. Alternative Prompts for an AI Coding Agent

Based on the analysis, here are some specific, actionable prompts that could be given to an AI agent to improve this feature:

*   **Prompt 1 (Remove Test Code):** "In `/src/features/Onboarding/v2/Onboarding.jsx`, there is a `useEffect` hook that dispatches the `generateReferral` action with hardcoded data. This is for testing purposes and should not be in the component. Please remove this entire `useEffect` block."

*   **Prompt 2 (Fix Implicit Submission):** "In `/src/features/Onboarding/v2/components/UserContactForm.jsx`, there is a `useEffect` hook that automatically submits the form by calling `onNext()` when the user logs in. This can cause unexpected behavior. Remove this `useEffect` to ensure the form is only submitted when the user explicitly clicks the 'Open App' or 'Continue with Google' button."

*   **Prompt 3 (Debounce Domain Check):** "The domain availability check in `/src/features/Onboarding/v2/components/CreateStudioForm.jsx` makes a Firebase call on every keystroke. To improve efficiency, please debounce this check. The `checkStudioDomainAvailability` function should only be called 500ms after the user has stopped typing in the studio name field."

*   **Prompt 4 (Refactor Form State):** "Refactor the onboarding forms to centralize state management. Modify the `useOnboardingForm` hook in `/src/features/Onboarding/v2/hooks/useOnboardingForm.js` to manage the state for `studioName`, `studioDomain`, `studioContact`, and `privacyPolicyAgreed`. The hook should also handle validation and return an `errors` object. Update `CreateStudioForm.jsx` and `UserContactForm.jsx` to use this centralized hook for all form state and validation logic."

*   **Prompt 5 (Improve UX):** "In `/src/features/Onboarding/v2/components/CreateStudioForm.jsx`, when a user clicks on a suggested domain like `-studio`, the suggestions disappear. Modify the component so that after clicking a suggestion, the list of suggestions remains visible, allowing the user to potentially click another one if they made a mistake."
