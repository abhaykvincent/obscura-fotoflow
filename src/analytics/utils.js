import { logEvent, setUserProperties } from "firebase/analytics";
import { analytics } from "../firebase/app";

let colorYellow = '#ffd426';
let colourYellowLight = '#ffd42622'
const userAgent = navigator.userAgent;
/* eslint-disable no-restricted-globals */
export const isDeveloper =  userAgent.includes('Mozilla/5.0')
    && userAgent.includes('Intel Mac OS X 10_15_7')
    && userAgent.includes('AppleWebKit/537.36')
    && screen.width === 1920
    && screen.height === 1080
/* eslint-enable no-restricted-globals */



export const trackEvent = (eventName, eventParams = {}) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Production Mode - log events to Google Analytics
    if (isProduction) {
        if(isDeveloper){
            console.log(`%c This device is not tracked by analytics`, `color: ${colorYellow}; `);
            console.log(`%c GA Event: ${eventName} `, `color: ${colorYellow}; `);
        }
        else logEvent(analytics, eventName, eventParams);
    }

    // Development Mode Debugging - logs to console
    if (!isProduction) {

        console.log(`%c GA Event: ${eventName} 
${JSON.stringify(eventParams, null, 2)}`, `color: ${colorYellow}; `);
       
    }
};

// Set the user property 'user_type'
export const setUserType = (userType) => {
    const isProduction = process.env.NODE_ENV === 'production';

    // Production Mode - set user property in Google Analytics
    if (isProduction) {
        if (isDeveloper) {
            setUserProperties(analytics, { user_type: 'developer' });
        }
        else{
            setUserProperties(analytics, { user_type: userType });
        }
    }

    // Development Mode Debugging - logs to console
    if (!isProduction) {
        let color = '#ffd426';
        console.log(`%c GA User Type: ${userType}`, `color: ${color}; `);
    }

    
};
