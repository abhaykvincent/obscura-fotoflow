import React, { useState, useEffect, useRef } from 'react';
import { db, model } from '../../../firebase/app';
import { selectUserStudio } from '../../../app/slices/authSlice';
import { useSelector } from 'react-redux';
import { 
  addDoc, collection, doc, getDocs, 
  query, where, orderBy, updateDoc 
} from 'firebase/firestore';
import './FlowPilot.scss';
import sendSound from '../../../assets/sounds/message-send.mp3';
import { getTimeAgo } from '../../../utils/dateUtils';
import { calculateDelay } from '../../../utils/stringUtils';
import { AppDocumentation } from '../../../data/flowpilot/AppDocumentation';



const FlowPilot = ({ userId }) => {
  const defaultStudio = useSelector(selectUserStudio);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);
  const chatWindowRef = useRef(null);
  // OPTIONS
  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  };

  // Fetch or create conversation
  const initializeConversation = async () => {
    const conversationsRef = collection(db, 'studios', defaultStudio.domain, 'conversations');
    
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
  useEffect(() => {
    

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
  // 
  const handleSendMessage = async () => {
    if (!input.trim() || !activeConversation) return;
  
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
        name: 'Customer Name',
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
  
    const messagesRef = collection(
      db,
      'studios',
      defaultStudio.domain,
      'conversations',
      activeConversation,
      'messages'
    );
    
    const messageRef = await addDoc(messagesRef, newMessage);
    
    const audio = new Audio(sendSound);
    audio.play().catch(error => console.log('Error playing sound:', error));
    
    setMessages(prevMessages => [
      ...prevMessages,
      {
        id: messageRef.id,
        ...newMessage
      }
    ]);
  
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
    await generateAIResponse();
  };

  const generateAIResponse = async () => {
    if (!activeConversation || messages.length === 0) return;
    if (isTyping) return; // Prevent re-run while typing
    const lastMessage = messages[messages.length - 1];

    if (lastMessage.sender.type !== 'customer') return;
  
    try {
      setIsTyping(true); // Show typing indicator
  
      // Build history with merged consecutive user and bot messages
      const history = [];
      let lastRole = null;
      let mergedText = '';
  
      messages.slice(0, -1).forEach((msg) => {
        const currentRole = msg.sender.type === 'customer' ? 'user' : 'model';
  
        if (currentRole === lastRole) {
          // Merge consecutive messages of the same role
          mergedText += '\n' + msg.content.text;
        } else {
          if (mergedText) {
            history.push({
              role: lastRole,
              parts: [{ text: mergedText.trim() }],
            });
          }
          mergedText = msg.content.text;
          lastRole = currentRole;
        }
      });
  
      if (mergedText && lastRole) {
        history.push({
          role: lastRole,
          parts: [{ text: mergedText.trim() }],
        });
      }
  
      const chatSession = model.startChat({
        generationConfig,
        history,
      });
      console.log(lastMessage.content.text)
      const prompt = `You are FlowPilot, a helpful assistant for FotoFlow users. FotoFlow is a SaaS web app designed to streamline the workflow of event photographers. Your role is to assist users with their queries about FotoFlow's features, provide guidance on using the platform, and help troubleshoot any issues they might encounter. Be friendly, professional, and concise in your responses.
      ${AppDocumentation}
  Respond to the following user message by providing your answer as a numbered list of short, standalone messages(max 3 standalone messages). Each item in the list should be a separate, concise message suitable for a chat interface. Avoid long paragraphs; break your response into distinct, bite-sized parts. Start each line with a number followed by a period (e.g., "1. Hi there!").
  
  User message: ${lastMessage.content.text}`;
  
      const result = await chatSession.sendMessage(prompt);
      const responseText = result.response.text();
  
      // Parse the numbered list into separate messages
      const botMessages = responseText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.match(/^\d+\./)) // Only keep lines starting with "number."
        .map(line => line.replace(/^\d+\.\s*/, '')) // Remove "number." prefix
        .filter(line => line) // Remove empty lines
        .map((text) => ({
          conversationId: activeConversation,
          studioId: defaultStudio.domain,
          content: {
            text,
            aiMetadata: {
              isAIGenerated: true,
              detectedIntent: '',
              suggestedResponses: []
            }
          },
          sender: {
            id: 'flowpilot-bot',
            type: 'bot',
            name: 'FlowPilot',
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
        }));
  
      // Add each bot message to Firestore with delay
      const messagesRef = collection(
        db,
        'studios',
        defaultStudio.domain,
        'conversations',
        activeConversation,
        'messages'
      );
  
      const newMessages = [];
      for (const botMessage of botMessages) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Introduce delay
        setIsTyping(true)
        const delay = calculateDelay(botMessage.content.text);
        await new Promise(resolve => setTimeout(resolve, delay*2)); // Introduce delay
        
        const messageRef = await addDoc(messagesRef, botMessage);
        newMessages.push({
          id: messageRef.id,
          ...botMessage
        });
        setIsTyping(false)

        setMessages(prevMessages => [...prevMessages, newMessages[newMessages.length - 1]]); // Update state incrementally
      }
  
      setIsTyping(false); // Hide typing indicator
  
      // Update conversation with the last bot message
      const lastBotMessage = botMessages[botMessages.length - 1];
      const convRef = doc(
        db,
        'studios',
        defaultStudio.domain,
        'conversations',
        activeConversation
      );
      await updateDoc(convRef, {
        'meta.lastMessage': lastBotMessage.content.text,
        'meta.lastUpdated': new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error generating AI response:', error);
      setIsTyping(false); // Hide typing indicator on error
    }
  };

  const handleEndChat = async () => {
    if (!activeConversation) return;

    const convRef = doc(
      db,
      'studios',
      defaultStudio.domain,
      'conversations',
      activeConversation
    );

    try {
      await updateDoc(convRef, {
        'meta.status': 'closed',
        'meta.lastUpdated': new Date().toISOString(),
        'meta.closedAt': new Date().toISOString()
      });
      
      setMessages([]);
      setActiveConversation(null);
      setInput('');
      initializeConversation()
    } catch (error) {
      console.error('Error ending chat:', error);
    }
  };

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
      const timeDiff = (currentTimestamp - prevTimestamp) / 1000;

      if (timeDiff <= 60 && currentMsg.sender.type === currentGroup.senderType) {
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

  useEffect(() => {
    if (chatWindowRef.current) {
      // last message is customer

      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flow-pilot">
      <div className="chat-header">
        <h3>FlowPilot</h3>
        <div className="conversation-meta">Powered by FlowAI & Google Gemini</div>
      </div>
      
      <div className="chat-window-container" ref={chatWindowRef}>
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
                  </div>
                  {msgIndex === group.messages.length - 1 && (
                    <div className="message-meta">
                      <span className="time">
                        {groupIndex === groupMessages(messages).length - 1 && group.senderType ==='user'&& <span className="sent-label">Sent</span>}
                        {/* {new Intl.DateTimeFormat('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        }).format(new Date(msg.timestamps.createdAt))} */}
                        {getTimeAgo(new Date(msg.timestamps.createdAt))}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
          {isTyping && (
            <div className="message-group bot">
              <div className="message">
                <div className="message-content typing">
                  <p>Typing...</p>
                </div>
              </div>
            </div>
          )}
          <p className="ai-chat-decleration">AI assists; you decide.</p>
          <div className="chat-actions">
            
            <p className="end-chat-btn"
              onClick={handleEndChat}
              disabled={!activeConversation} >
               Close
            </p>
            <p className="end-chat-btn"
              onClick={handleEndChat}
              disabled={!activeConversation} >
              Contact Support
            </p>
            <p className="end-chat-btn"
              onClick={handleEndChat}
              disabled={!activeConversation} >
              Start Over
            </p>
          </div>
          
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

export default FlowPilot;