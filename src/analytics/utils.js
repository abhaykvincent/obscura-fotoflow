import { logEvent } from "firebase/analytics";
import { analytics } from "../firebase/app";

export const trackEvent = (eventName, eventParams = {}) => {
    // only on production
    if (process.env.NODE_ENV === 'production') {
        logEvent(analytics, eventName, eventParams);
    }
    //logEvent(analytics, eventName, eventParams);
    

    /*  Analytics in Dev Mode 
        - Enable below code     */

    if (process.env.NODE_ENV === 'development') {        
        logEvent(analytics, eventName, eventParams);
    }
  };