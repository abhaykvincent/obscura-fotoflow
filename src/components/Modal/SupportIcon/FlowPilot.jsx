import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Added for navigation
import { db, model } from '../../../firebase/app';
import { selectUserStudio } from '../../../app/slices/authSlice';
import { useSelector } from 'react-redux';
import { 
  addDoc, collection, doc, getDocs, 
  query, where, orderBy, updateDoc 
} from 'firebase/firestore';
import './FlowPilot.scss';
import sendSound from '../../../assets/sounds/message-send.mp3';
import typingSound from '../../../assets/sounds/message-typing.mp3';
import { getTimeAgo } from '../../../utils/dateUtils';
import { calculateDelay } from '../../../utils/stringUtils';
import { AppDocumentation } from '../../../data/flowpilot/AppDocumentation';
import { selectProjects } from '../../../app/slices/projectsSlice';

const FlowPilot = ({ userId }) => {
  const defaultStudio = useSelector(selectUserStudio);
  const projects = useSelector(selectProjects);
  const navigate = useNavigate(); // Added for navigation

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);
  const chatWindowRef = useRef(null);
  const [showWelcome, setShowWelcome] = useState(true);

  // OPTIONS
  const generationConfig = {
    temperature: 0.4,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  };

  // Start chat
  const handleNewChat = () => {
    setShowWelcome(false);
    initializeConversation();
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

  const audioTyping = new Audio(typingSound);
  audioTyping.volume = 0.2;
  useEffect(() => {
    if (isTyping) {
      audioTyping.loop = true;
      audioTyping.play().catch(error => console.log('Error playing sound:', error));
    } else {
      audioTyping.pause();
      audioTyping.currentTime = 0;
    }

    return () => {
      audioTyping.pause();
      audioTyping.currentTime = 0;
    };
  }, [isTyping]);

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

  // Handle sending messages (both from input and suggestions)
  const handleSendMessage = async (messageText = input, metadata = {}) => {
    if (!messageText.trim() || !activeConversation) return;
    setShowWelcome(false);
    const newMessage = {
      conversationId: activeConversation,
      studioId: defaultStudio.domain,
      content: {
        text: messageText.trim(),
        aiMetadata: {
          isAIGenerated: false,
          detectedIntent: '',
          suggestedResponses: [],
          ...metadata // Merge provided metadata (e.g., parameters)
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
    
    const audioSent = new Audio(sendSound);
    audioSent.play().catch(error => console.log('Error playing sound:', error));
    
    const updatedMessages = [
      ...messages,
      {
        id: messageRef.id,
        ...newMessage
      }
    ];
    
    setMessages(updatedMessages);
    
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
    await generateAIResponse(updatedMessages);
  };

  // Added handleSelectItem for navigation
  const handleSelectItem = (selectItem) => {
    const { item, action, params } = selectItem;
  
    // Prepare message with hidden parameters in aiMetadata
    const messageData = {
      text: `Select ${item}`,
      aiMetadata: {
        isAIGenerated: false,
        detectedIntent: 'select-item',
        parameters: {}
      }
    };
  
    // Add parameters and navigate based on action type
    if (action === 'showProject') {
      messageData.aiMetadata.parameters = { projectId: params };
      const studioName = defaultStudio.domain;
      const url = `/${studioName}/project/${params}`;
      navigate(url);
    } else if (action === 'showGallery') { // Updated action name to 'showGallery'
      const [projectId, collectionId] = params.split('/'); // Split params into projectId and collectionId
      messageData.aiMetadata.parameters = { projectId, collectionId };
      const studioName = defaultStudio.domain;
      const url = `/${studioName}/gallery/${projectId}/${collectionId}`;
      navigate(url); // Smooth navigation to gallery URL
    }
  
    // Send message with parameters hidden in metadata
    handleSendMessage(messageData.text, messageData.aiMetadata);
  };

  const generateAIResponse = async (updatedMessages) => {
    if (!activeConversation || updatedMessages.length === 0) return;
    if (isTyping) return;
    const lastMessage = updatedMessages[updatedMessages.length - 1];

    if (lastMessage.sender.type !== 'customer') return;
  
    try {
      setTimeout(() => {
        setIsTyping(true);
      }, 1000);
  
      const history = [];
      let lastRole = null;
      let mergedText = '';
  
      updatedMessages.slice(0, -1).forEach((msg) => {
        const currentRole = msg.sender.type === 'customer' ? 'user' : 'model';
  
        if (currentRole === lastRole) {
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
      
      const prompt = `You are FlowPilot, a helpful assistant for FotoFlow users. FotoFlow is a SaaS web app designed to streamline the workflow of event photographers. Your role is to assist users with their queries about FotoFlow's features, provide guidance on using the platform, and help troubleshoot any issues they might encounter. Be friendly, professional, and concise in your responses.
${AppDocumentation}
Retrieval Data: ${JSON.stringify(projects)}

Respond to the following user message by providing your answer as a numbered list of short, standalone messages (1-3 standalone messages). 
Each item in the list should be a separate, concise message suitable for a chat interface.
Then provide a list of select items that the user might want to select or act next, based on the retrieval data. Format these suggestions after suggests, each prefixed with @Lists: and items should be shorter (1-4 words).
Avoid long paragraphs; break your response into distinct, bite-sized parts.
Start each line with a number followed by a period (e.g., "1. Hi there!").
Start each line that describe about the list (e.g., "1. You have 5 projects. 2*. Joehans & Jolsna, Renjitha & Smith, Sara & Matan, Sara & ssss, and Sara.").
Additionally, provide a list of 2-3 suggested follow-up questions or commands that the user might want to ask next, based on the context of the conversation. Format these suggestions as a separate list after the main response, each prefixed with @Suggestion: and questions or commands should be shorter (5-6 words).

User message: ${lastMessage.content.text}`;

      const result = await chatSession.sendMessage(prompt);
      const responseText = result.response.text();
  
      const lines = responseText.split('\n').map(line => line.trim()).filter(line => line);
      
      const mainResponseLines = lines.filter(line => line.match(/^\d+\./));
      const suggestionLines = lines.filter(line => line.startsWith('@Suggestion:'));

      // Updated parsing to create selectItems array of objects
      const selectItems = lines
        .filter(line => line.startsWith('@Lists:'))
        .map(line => {
          const listPart = line.split('@Action:')[0].replace('@Lists:', '').trim();
          const actionPart = line.split('@Action:')[1]?.split('@Params:')[0].trim() || '';
          const paramsPart = line.split('@Params:')[1]?.trim() || '';
          return { item: listPart, action: actionPart, params: paramsPart };
        });

      const suggestions = suggestionLines.map(line => line.replace(/^@Suggestion:\s*/, ''));

      const botMessages = mainResponseLines.map((line, index) => {
        const text = line.replace(/^\d+\.\s*/, '');
        return {
          conversationId: activeConversation,
          studioId: defaultStudio.domain,
          content: {
            text,
            aiMetadata: {
              isAIGenerated: true,
              detectedIntent: '',
              suggestedResponses: index === mainResponseLines.length - 1 ? suggestions : [],
              selectItems: index === mainResponseLines.length - 1 ? selectItems : [], // Updated to use selectItems
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
        };
      });
  
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
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsTyping(true);
        const delay = calculateDelay(botMessage.content.text);
        await new Promise(resolve => setTimeout(resolve, delay * 2));
        
        const messageRef = await addDoc(messagesRef, botMessage);
        newMessages.push({
          id: messageRef.id,
          ...botMessage
        });
        setIsTyping(false);
        setMessages(prevMessages => [...prevMessages, newMessages[newMessages.length - 1]]);
      }
  
      setIsTyping(false);
  
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
      setIsTyping(false);
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
    setShowWelcome(true);
    try {
      await updateDoc(convRef, {
        'meta.status': 'closed',
        'meta.lastUpdated': new Date().toISOString(),
        'meta.closedAt': new Date().toISOString()
      });
      
      setMessages([]);
      setActiveConversation(null);
      setInput('');
      initializeConversation();
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
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flow-pilot">
      <div className="chat-header">
        {!showWelcome && (
          <div 
            className="back-btn" 
            onClick={() => {
              setShowWelcome(true);
              setMessages([]);
              setActiveConversation(null);
            }}
          ></div>
        )}
        {!showWelcome && <div className="status-signal"></div>}
        <div className="flowpilot-titles">
          <h3>
            {showWelcome ? 'FlowPilot' : (
              <>
                {!showWelcome && <div className="chat-agent"></div>}
                Flowya
              </>
            )}
            {!showWelcome ? (
              <div className="conversation-meta">FlowPilot</div>
            ) : (
              <div className="conversation-meta">Powered by FlowAI</div>
            )}
          </h3>
        </div>
      </div>
      {showWelcome ? (
        <>
          <div className="welcome-section">
            <div className="welcome-content">
              <p className='welcome-message'>👋 Hi, <span className='iconic-gradient'>{defaultStudio?.name}</span></p>
              <p className='welcome-message'>How can I help you?</p>
              <div className="welcome-suggestions">
                <p></p>
                <div className="suggestions">
                  <div 
                    className="ai-suggestion" 
                    onClick={() => {
                      setShowWelcome(false);
                      handleSendMessage("Show projects?");
                    }}
                  >
                    Show projects?
                  </div>
                  <div 
                    className="ai-suggestion" 
                    onClick={() => {
                      setShowWelcome(false);
                      handleSendMessage("What are the pricing plans?");
                    }}
                  >
                    What are the pricing plans?
                  </div>
                  <div 
                    className="ai-suggestion" 
                    onClick={() => {
                      setShowWelcome(false);
                      handleSendMessage("How to organize my events?");
                    }}
                  >
                    How to organize my events?
                  </div>
                </div>
              </div>
              <div className="chat-actions">
                <div className="new-chat-btn" onClick={handleNewChat}>History</div>
                <div className="new-chat-btn" onClick={handleNewChat}>Contact Support</div>
                <div className="new-chat-btn" onClick={handleNewChat}>Start New Chat</div>
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
            <button onClick={() => handleSendMessage()}></button>
          </div>
        </>
      ) : (
        <>
          <div className="chat-window-container" ref={chatWindowRef}>
            <div className="chat-window">
              {groupMessages(messages).map((group, groupIndex) => (
                <div key={groupIndex} className={`message-group ${group.senderType}`}>
                  {group.messages.map((msg, msgIndex) => (
                    <div key={msg.id} className="message">
                      {msgIndex === 0 && (
                        <div className="message-meta">
                          <span className="time">
                            {groupIndex === groupMessages(messages).length - 1 && group.senderType === 'user' && (
                              <span className="sent-label">Sent</span>
                            )}
                            {getTimeAgo(new Date(msg.timestamps.createdAt))}
                          </span>
                        </div>
                      )}
                      <div className="message-content">
                        <p>{msg.content.text}</p>
                      </div>
                      {/* Updated Selectable Lists */}
                      {msg.content.aiMetadata.selectItems && msg.content.aiMetadata.selectItems.length > 0 && (
                        <div className="suggestions selectable-list">
                          {msg.content.aiMetadata.selectItems.map((selectItem, index) => (
                            <div 
                              className='ai-suggestion' 
                              key={index} 
                              onClick={() => handleSelectItem(selectItem)}
                            >
                              {selectItem.item}
                            </div>
                          ))}
                        </div>
                      )}
                      {msg.content.aiMetadata.suggestedResponses && msg.content.aiMetadata.suggestedResponses.length > 0 && (
                        <div className="suggestions">
                          {msg.content.aiMetadata.suggestedResponses.map((suggestion, index) => (
                            <div 
                              className='ai-suggestion' 
                              key={index} 
                              onClick={() => handleSendMessage(suggestion)}
                            >
                              {suggestion}
                            </div>
                          ))}
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
              <div className="chat-actions">
                <p className="end-chat-btn" onClick={handleEndChat} disabled={!activeConversation}>
                  End chat
                </p>
                <p className="end-chat-btn" onClick={handleEndChat} disabled={!activeConversation}>
                  Contact Support
                </p>
                <p className="end-chat-btn" onClick={handleEndChat} disabled={!activeConversation}>
                  Start Over
                </p>
              </div>
              <p className="ai-chat-decleration">AI assists -- you decide.</p>
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
            <button onClick={() => handleSendMessage()}></button>
          </div>
        </>
      )}
    </div>
  );
};

export default FlowPilot;