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

            // yellow
            let color = '#ffd426';
        console.log(`%c GA Event: ${eventName}`, {
            ...eventParams,
            timestamp: new Date().toISOString()
        }, `color: ${color}; `);
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
        let color = '#ffd426';
        console.log(`%c GA User Type: ${userType}`, `color: ${color}; `);
    }
};
