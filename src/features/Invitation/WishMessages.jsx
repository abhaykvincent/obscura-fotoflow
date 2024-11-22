import React, { useState } from 'react';
import './WishMessages.scss'

const WishMessages = ({ data,initialMessages }) => {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [senderName, setSenderName] = useState('');

  const handleAddMessage = () => {
    if (newMessage.trim() && senderName.trim()) {
      setMessages([...messages, { text: newMessage, sender: senderName, id: Date.now() }]);
      setNewMessage(''); // Clear the message input
      setSenderName(''); // Clear the sender name input
    }
  };

  return (
    <div className="wish-messages">
      <h3 className='wish-title'>Guest Wishes</h3>
      
      {/* Display each message */}
      <ul>
       {messages.map((message) => (
            <li key={message.id} className="message-item"
              style={{ backgroundColor: data?.backgroundColor + "12" }}
            >
            {message.text}<strong> -{message.sender}</strong> 
            </li>
        ))}
        </ul>

      {/* Input for adding a new message */}
      <div className="message-input">
      <input
            type="textbox"
            className='wish-input'
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write a wish..."
        />
        <input
            type="text"
            className='sender-input'
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="Your name"
        />
        
        <button  className="button primary" onClick={handleAddMessage}
          style={{ background: data?.backgroundColor + "77", border: '2px solid ' + data?.backgroundColor + '66' }}
        >Send Wish</button>
    </div>
    </div>
  );
};

export default WishMessages;
