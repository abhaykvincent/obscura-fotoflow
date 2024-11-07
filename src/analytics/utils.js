import { logEvent } from "firebase/analytics";
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