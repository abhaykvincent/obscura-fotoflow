import { logEvent, setUserProperties } from "firebase/analytics";
import { analytics } from "../firebase/app";

export const trackEvent = (eventName, eventParams = {}) => {
    const isProduction = process.env.NODE_ENV === 'production';

    // Production Mode - log events to Google Analytics
    if (isProduction) {
        logEvent(analytics, eventName, eventParams);
    }

    // Development Mode Debugging - logs to console
    if (!isProduction) {
        console.log(`Debug Event: ${eventName}`, {
            ...eventParams,
            timestamp: new Date().toISOString()
        });
    }
};

// Set the user property 'user_type'
export const setUserType = (userType) => {
    const isProduction = process.env.NODE_ENV === 'production';

    // Production Mode - set user property in Google Analytics
    if (isProduction) {
        setUserProperties(analytics, { user_type: userType });
    }

    // Development Mode Debugging - logs to console
    if (!isProduction) {
        console.log(`Debug User Type: ${userType}`, {
            user_type: userType,
            timestamp: new Date().toISOString()
        });
    }
};
