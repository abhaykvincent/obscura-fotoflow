import React, { useState } from 'react';
import './WishMessages.scss'

const WishMessages = ({ initialMessages }) => {
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
      <h2>Guest Wishes</h2>
      
      {/* Display each message */}
      <ul>
       {messages.map((message) => (
            <li key={message.id} className="message-item">
            {message.text}<strong> -{message.sender}</strong> 
            </li>
        ))}
        </ul>

      {/* Input for adding a new message */}
      <div className="message-input">
      <text
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Write a wish..."
        />
        <input
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="Your name"
        />
        
        <button  className="button " onClick={handleAddMessage}>Add Wish</button>
    </div>
    </div>
  );
};

export default WishMessages;
