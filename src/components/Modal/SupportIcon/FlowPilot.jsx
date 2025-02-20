import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/app';
import { selectUserStudio } from '../../../app/slices/authSlice';
import { useSelector } from 'react-redux';
import { 
  addDoc, collection, doc, getDocs, 
  query, where, orderBy, updateDoc 
} from 'firebase/firestore';
import './FlowPilot.scss';

const FlowPilot = ({ userId }) => {
  console.log(userId);
  const defaultStudio = useSelector(selectUserStudio);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);

  // ... (keeping the existing useEffect and loadMessages functions unchanged)

  const handleSendMessage = async () => {
    if (!input.trim() || !activeConversation) return;

    // ... (keeping the existing handleSendMessage function unchanged)
  };

  // Function to group messages
  const groupMessages = (messages) => {
    if (!messages.length) return [];

    const grouped = [];
    let currentGroup = {
      senderType: messages[0].sender.type,
      messages: [messages[0]],
      timestamp: new Date(messages[0].timestamps.createdAt)
    };

    for (let i = 1; i < messages.length; i++) {
      const currentMsg = messages[i];
      const prevTimestamp = new Date(currentGroup.timestamp);
      const currentTimestamp = new Date(currentMsg.timestamps.createdAt);
      const timeDiff = (currentTimestamp - prevTimestamp) / 1000; // seconds

      // Check if message is within 30s and same sender type
      if (timeDiff <= 30 && currentMsg.sender.type === currentGroup.senderType) {
        currentGroup.messages.push(currentMsg);
      } else {
        grouped.push(currentGroup);
        currentGroup = {
          senderType: currentMsg.sender.type,
          messages: [currentMsg],
          timestamp: currentTimestamp
        };
      }
    }
    
    grouped.push(currentGroup);
    return grouped;
  };

  return (
    <div className="flow-pilot">
      <div className="chat-header">
        <h3>FlowPilot</h3>
        <div className="conversation-meta"></div>
      </div>
      
      <div className="chat-window-container">
        <div className="chat-window">
          {groupMessages(messages).map((group, groupIndex) => (
            <div 
              key={groupIndex} 
              className={`message-group ${group.senderType}`}
            >
              {group.messages.map((msg, msgIndex) => (
                <div key={msg.id} className="message">
                  <div className="message-content">
                    <p>{msg.content.text}</p>
                    {msg.content.aiMetadata?.suggestedResponses?.length > 0 && (
                      <div className="ai-suggestions">
                        {msg.content.aiMetadata.suggestedResponses.map((suggestion, i) => (
                          <button key={i} className="suggestion">
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Only show timestamp on the last message of the group */}
                  {msgIndex === group.messages.length - 1 && (
                    <div className="message-meta">
                      <span className="time">
                        {new Date(msg.timestamps.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button onClick={handleSendMessage}></button>
      </div>
    </div>
  );
};

// SupportIcon component remains unchanged
function SupportIcon() {
  const [isExpanded, isExpandedSet] = useState(false);

  return (
    <div className={`customer-support ${isExpanded ? 'expanded' : ''}`}>
      <div className="support-actions">
        <div className="action orange"><div className="icon bug"></div>Report Bug</div>
        <div className="action blue"><div className="icon pricing"></div>Pricing</div>
        <div className="action green"><div className="icon support"></div>Customer Support</div>
      </div>
      <div className="support-icon" onClick={() => isExpandedSet(!isExpanded)}></div>
    </div>
  );
}

export default FlowPilot;