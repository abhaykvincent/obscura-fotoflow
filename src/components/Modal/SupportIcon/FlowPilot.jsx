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
  console.log(userId)
  const defaultStudio = useSelector(selectUserStudio);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);

  // Fetch or create conversation
  useEffect(() => {
    const initializeConversation = async () => {
      const conversationsRef = collection(db, 'studios', defaultStudio.domain, 'conversations');
      
      // Check for existing conversation with user
      const q = query(
        conversationsRef,
        where('participants.userIds', 'array-contains', userId),
        where('meta.status', '==', 'open'),
        orderBy('meta.lastUpdated', 'desc')
      );

      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const conv = snapshot.docs[0];
        setActiveConversation(conv.id);
        await loadMessages(conv.id);
      } else {
        // Create new conversation
        const newConv = {
          studioId: defaultStudio.domain,
          participants: {
            userIds: [userId],
            agentIds: [],
            unreadCounts: { [userId]: 0 }
          },
          meta: {
            status: 'open',
            type: 'support',
            priority: 'normal',
            tags: ['general'],
            lastMessage: '',
            lastUpdated: new Date().toISOString(),
            createdAt: new Date().toISOString()
          }
        };
        
        const convRef = await addDoc(conversationsRef, newConv);
        setActiveConversation(convRef.id);
      }
    };

    if (defaultStudio?.domain && userId) {
      initializeConversation();
    }
  }, [defaultStudio, userId]);

  // Load messages for conversation
  const loadMessages = async (convId) => {
    const messagesRef = collection(
      db, 
      'studios', 
      defaultStudio.domain, 
      'conversations', 
      convId, 
      'messages'
    );
    
    const q = query(messagesRef, orderBy('timestamps.createdAt', 'asc'));
    const snapshot = await getDocs(q);
    setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleSendMessage = async () => {

    if (!input.trim() || !activeConversation) return;

    // Create message object
    const newMessage = {
      conversationId: activeConversation,
      studioId: defaultStudio.domain,
      content: {
        text: input.trim(),
        aiMetadata: {
          isAIGenerated: false,
          detectedIntent: '',
          suggestedResponses: []
        }
      },
      sender: {
        id: userId,
        type: 'customer',
        name: 'Customer Name', // Replace with actual user data
        avatar: ''
      },
      status: {
        delivered: true,
        read: false,
        edited: false
      },
      timestamps: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    // Add to messages subcollection
    const messagesRef = collection(
      db,
      'studios',
      defaultStudio.domain,
      'conversations',
      activeConversation,
      'messages'
    );
    
    await addDoc(messagesRef, newMessage);
    // Update conversation last message
    const convRef = doc(
      db,
      'studios',
      defaultStudio.domain,
      'conversations',
      activeConversation
    );
    
    await updateDoc(convRef, {
      'meta.lastMessage': newMessage.content.text,
      'meta.lastUpdated': new Date().toISOString(),
    });

    setInput('');
  };

  return (
    <div className="flow-pilot">
      <div className="chat-header">
        <h3>FlowPilot</h3>
        <div className="conversation-meta">
        </div>
      </div>
      <div className="chat-window-container">

        <div className="chat-window">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.sender.type}`}>
              <div className="message-meta">
                <span className="time">
                  {new Date(msg.timestamps.createdAt).toLocaleTimeString()}
                </span>
              </div>
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

      {/* <SupportIcon /> */}
    </div>
  );
};

// SupportIcon component remains the same
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