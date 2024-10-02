import { logEvent } from "firebase/analytics";
import { analytics } from "../firebase/app";

export const trackEvent = (eventName, eventParams = {}) => {
    // Enable Analytics only on PRODUCTION
    if (process.env.NODE_ENV === 'production') {
        logEvent(analytics, eventName, eventParams);
    }
    
    /*  Trigger Events in Dev Mode 
        - Enable below code when Debugging Analytics    */
    /* 
    if (process.env.NODE_ENV === 'development') {        
        logEvent(analytics, eventName, eventParams);
    } 
    */
  };