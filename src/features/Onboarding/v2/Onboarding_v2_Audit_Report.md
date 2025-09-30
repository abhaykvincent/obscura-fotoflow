# Onboarding v2 Audit Report

This report outlines the findings from a review of the onboarding feature in `src/features/Onboarding/v2/`. It covers UX, performance, and code quality, and provides recommendations for refactoring and fixing bugs.

## 1. High-Level Review

The current onboarding flow has several areas that could be improved for a better user experience and more maintainable code.

### UX Friction Points
*   **Automatic Navigation:** The flow automatically navigates the user forward upon login (`UserContactForm.jsx`) which can be disorienting. User actions should be explicit.
*   **UI Jumps:** When a user logs in, the UI shifts to accommodate the user's profile information, which can feel abrupt.
*   **Lack of Feedback:** There is no loading indicator when creating the account, which might leave the user wondering if the action was successful.

### Performance Bottlenecks
*   **Excessive Database Queries:** The domain availability check in `CreateStudioForm.jsx` sends a query to the database on every keystroke, which is inefficient and can lead to performance degradation.

### Deviation from React Best Practices
*   **Decentralized State Management:** Form state is spread across individual components (`CreateStudioForm.jsx`, `UserContactForm.jsx`) and the `useOnboardingForm` hook. This makes the state difficult to manage and track.
*   **Unmanaged Side Effects:** The `useEffect` hook in `UserContactForm.jsx` triggers a form submission, which is an unexpected side effect.

## 2. Component-Specific Refactoring

To improve code quality and maintainability, the `CreateStudioForm.jsx` and `UserContactForm.jsx` components should be refactored.

*   **Centralize Form State:** All form-related state (e.g., `studioName`, `studioDomain`, `contactNumber`, `isDomainAvailable`) and validation logic should be moved into the `useOnboardingForm` hook.
*   **Simplify Components:** The components should be stateless and receive all necessary data and event handlers (e.g., `updateFormData`, `validateDomain`) as props from the `useOnboardingForm` hook. This will make them purely presentational and easier to test.

## 3. Performance Optimization

The domain availability check needs to be optimized to prevent excessive database queries.

*   **Implement Debouncing:** A debounce mechanism should be added to the domain availability check in `CreateStudioForm.jsx`. This will delay the check until the user has stopped typing for a specified period (e.g., 500ms), reducing the number of queries significantly.

## 4. Bug Hunt: Race Condition in `UserContactForm.jsx`

There is a potential race condition in `UserContactForm.jsx` that can cause the form to be submitted automatically.

*   **The Bug:** A `useEffect` hook triggers the `onNext` function as soon as the user logs in, if the other conditions are met. This happens without the user explicitly clicking the "Open App" button.
    ```javascript
    useEffect(() => {
        if (user?.email && inputMessage.type === 'success' && privacyPolicyAgreed) {
            onNext();
        }
    }, [user?.email, inputMessage.type, privacyPolicyAgreed]);
    ```
*   **The Fix:** This `useEffect` should be removed. Form submission should only be initiated by a user action, i.e., clicking the submit button, which calls the `handleSubmit` function.

## 5. Code Cleanup

The `Onboarding.jsx` component contains debug code that should be removed.

*   **Hardcoded Data:** The `useEffect` that dispatches the `generateReferral` action is clearly for testing and should be removed.
    ```javascript
    useEffect(() => {
      dispatch(generateReferral({
        name: "Abhay",
        campainName: "Admin",
        // ... and so on
      }))
      trackEvent('onboarding_viewed', {
        referral_code: ref
      });
    },[])
    ```
*   **Recommendation:** Remove this `useEffect` entirely before moving to production.
