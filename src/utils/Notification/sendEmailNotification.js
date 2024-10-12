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
          'Content-Type': 'application/json',
          'X-Appwrite-Project': 'fotoflow-notifications',
          'X-Appwrite-Key': 'standard_58c71f3e2a8859f44ba1f4788ba6f0b899d02f8ccae736938bddd3f5d85d846322d2c9bfb9a1c02ffaac1f428b4eedead26a402e6b9cf89a5526182e49b716679dff8fdb505a3a5e1209d0390331845de776d057a2b4930f7ade1e29f7faa80af81f21e48bbfcce660eba5295433feaeecc2814a6429104ec49680806816c308',

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