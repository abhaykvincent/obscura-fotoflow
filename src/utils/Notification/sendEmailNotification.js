export const sendEmailNotification = async (to,subject,text) => {
    console.log(to,subject,text)
    console.log(JSON.stringify({
        "to":to, 
        "subject":subject,
        "text":text
      }))
    try {
      const response = await fetch('https://6706ef241c409e5cac66.appwrite.global/send-email', {
        method: 'POST', // Change to the appropriate method (GET, POST, etc.)
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to, 
          subject,
          text
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data.message);
    } catch (error) {
      console.error('Error sending notification:', error);
      console.log('Failed to send email: ' + error.message);
    }
}