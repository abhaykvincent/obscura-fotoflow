
import { useState, useEffect } from 'react';

export const usePersonalizedGreeting = () => {
    const [greeting, setGreeting] = useState({
        timeOfDay: '',
        timeGreeting: '',
        personalizedMessage: ''
    });

    useEffect(() => {
        const hours = new Date().getHours();
        let timeOfDay, timeGreeting, personalizedMessage;

        if (hours < 5) { // Night Owls
            timeOfDay = "late-night";
            timeGreeting = "Happy late night!";
            personalizedMessage = "Stars are ready for their close-up—are you? ";
        } else if (hours < 6) { // Early Birds
            timeOfDay = "early-bird";
            timeGreeting = "Hei Early Bird!";
            personalizedMessage = "Fresh mornings, fresh perspectives. Now its the time"
        } else if (hours < 8.5) { // Golden Hour
            timeOfDay = "goden-hour";
            timeGreeting = "Happy Golden Hour!";
            personalizedMessage = " Let the golden hour inspire your creativity today.";
        } else if (hours < 12) { // Morning
            timeOfDay = "morning";
            timeGreeting = "Fresh morning!";
            personalizedMessage = "Sunrise calls for creativity. Let's get started!";
        } else if (hours < 15) { // After Noon
            timeOfDay = "noon";
            timeGreeting = "Good afternoon!";
            personalizedMessage = "Afternoon vibes are perfect for creating something extraordinary!";
        } else if (hours < 17) { // After Noon
            timeOfDay = "evening";
            timeGreeting = "Good Evening!";
            personalizedMessage = "Every great photo starts with the first step. Begin yours now.";
        } else if (hours < 19) { // Golden Hour
            timeOfDay = "golden-hour";
            timeGreeting = "Happy Golden Hour!";
            personalizedMessage = " Let the golden hour inspire your creativity tonight.";
        } else if (hours < 22) { // Night
            timeOfDay = "night";
            timeGreeting = "Good evening!";
            personalizedMessage = "Night is young, and so are ideas.";
        } else { // Final Hour of the Day
            timeOfDay = "late-night";
            timeGreeting = "Happy late night!";
            personalizedMessage = "When the world sleeps, creativity awakens. Let's make magic! ";
        }
        setGreeting({ timeOfDay, timeGreeting, personalizedMessage });
    }, []);

    return greeting;
};
