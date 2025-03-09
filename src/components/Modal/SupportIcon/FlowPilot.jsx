import React, { useState, useEffect, useRef } from 'react'; // React core
import { useNavigate } from 'react-router-dom'; // Routing
// Firebase
import { db, model } from '../../../firebase/app';
import { addDoc, collection, doc, getDocs, query, where, orderBy, updateDoc } from 'firebase/firestore';
// Redux
import { useSelector } from 'react-redux';
import { selectUserStudio } from '../../../app/slices/authSlice';
import { selectProjects } from '../../../app/slices/projectsSlice';
// Assets
import typingSound from '../../../assets/sounds/message-typing.mp3';
import sendSound from '../../../assets/sounds/message-send.mp3';
// Data - Prompt 
import { systemInstruction } from '../../../data/flowpilot/AppDocumentation';
// Utilities 
import { getTimeAgo } from '../../../utils/dateUtils';
import { calculateDelay, convertUsdToInr, formatDecimalKnos } from '../../../utils/stringUtils';
// Styles
import './FlowPilot.scss';

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
  
  const [promptInputs, setPromptInputs] = useState({}); // Store all input values
  const [inputTokens, setInputTokens] = useState(0);
  const [outputTokens, setOutputTokens] = useState(0);
  const [tokenCost, setTokenCost] = useState(0);
  const TOKEN_LIMIT = 10000; // Set token limit
  // OPTIONS
  const generationConfig = {
    temperature: 0.8,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  };
  const geminiPricing = [
    {
      model: "gemini-2.0-flash-001",
      inputCostPerMillion: 0.10,
      outputCostPerMillion: 0.40,
    },
    {
      model: "gemini-2.0-flash-lite",
      inputCostPerMillion: 0.075,
      outputCostPerMillion: 0.30,
    },
    {
      model: "gemini-1.5-flash-001",
      inputCostPerMillion: 0.075,
      outputCostPerMillion: 0.30,
    },
  ];
  let audioTyping = new Audio(typingSound);
  audioTyping.volume = 0.2;


  // Start chat
  const handleNewChat = () => {
    setShowWelcome(false);
    initializeConversation();
  };
  // Function to calculate total cost
  const calculateTotalCost = (inputTokens, outputTokens, modelName) => {
    const pricing = geminiPricing.find((p) => p.model === modelName);
    if (!pricing) {
      console.error(`Pricing not found for model: ${modelName}`);
      return 0;
    }
    const inputCost = (inputTokens / 1_000_000) * pricing.inputCostPerMillion;
    const outputCost = (outputTokens / 1_000_000) * pricing.outputCostPerMillion;
    return inputCost + outputCost;
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
  const handleSendMessage = async (messageText = input, metadata = {}) => {
    if (!messageText.trim() || !activeConversation) return;
    
    // Check token limit
    if (inputTokens + outputTokens >= TOKEN_LIMIT) {
      setInput('');
      return;
    }
  
    if (!messageText.trim() || !activeConversation) return;
    setShowWelcome(false);
  
    const newMessage = {
      conversationId: activeConversation || '', // Fallback to empty string
      studioId: defaultStudio?.domain || '',   // Ensure studioId is defined
      content: {
        text: messageText.trim(),
        aiMetadata: {
          isAIGenerated: false,
          detectedIntent: metadata.action || '',
          ...metadata,
        },
      },
      sender: {
        id: userId || '',                       // Ensure userId is defined
        type: 'customer',
        name: 'Customer Name',                 // Static fallback, replace with dynamic if available
        avatar: '',                            // Fallback to empty string
      },
      status: {
        delivered: true,
        read: false,
        edited: false,
      },
      timestamps: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  
    const messagesRef = collection(db, 'studios', defaultStudio.domain, 'conversations', activeConversation, 'messages');
    const messageRef = await addDoc(messagesRef, newMessage);
  
    const audioSent = new Audio(sendSound);
    audioSent.play().catch((error) => console.log('Error playing sound:', error));
  
    setMessages((prev) => [...prev, { id: messageRef.id, ...newMessage }]);
    await updateDoc(doc(db, 'studios', defaultStudio.domain, 'conversations', activeConversation), {
      'meta.lastMessage': newMessage.content.text,
      'meta.lastUpdated': new Date().toISOString(),
    });
    
    console.log("");
    console.log("Input Text : "+messageText);
  
    setInput('');
  
    // Generate AI response only if not a prompt
    if (metadata.action !== 'prompt') {
      await generateAIResponse([...messages, { id: messageRef.id, ...newMessage }]);
    }
  };
  const handlePromptResponse = async (promptResponse) => {
    if (promptResponse.name && promptResponse.description) {
      const projectData = {
        name: promptResponse.name,
        description: promptResponse.description,
        createdAt: new Date().toISOString(),
        userId,
      };
      const projectsRef = collection(db, 'studios', defaultStudio.domain, 'projects');
      const newProjectRef = await addDoc(projectsRef, projectData);
      
      // Send a confirmation message
      await handleSendMessage(`Created project: ${promptResponse.name}`, {
        action: 'create',
        projectId: newProjectRef.id,
      });
      
      // Optionally navigate to the new project
      navigate(`/${defaultStudio.domain}/project/${newProjectRef.id}`);
    } else {
      // Handle other prompt types or errors
      await handleSendMessage(`Received your input: ${JSON.stringify(promptResponse)}`, {
        action: 'prompt_response',
      });
    }
  };
  const handleSelectItem = async (selectItem) => {
    const { item, action, params } = selectItem;
    const studioName = defaultStudio.domain;
    console.log({params})
    switch (action) {
      case 'navigate':
         if (params.projectId && params.collectionId) {
          console.log(params.projectId, params.collectionId)
          navigate(`/${studioName}/gallery/${params.projectId}/${params.collectionId}`);
        }
        else if (params.projectId) {
          navigate(`/${studioName}/project/${params.projectId}`);
        } 
        break;
  
      case 'create':
        if (params.entity === 'project') {
          const projectData = params.data || { name: item };
          const projectsRef = collection(db, 'studios', studioName, 'projects');
          const newProjectRef = await addDoc(projectsRef, {
            ...projectData,
            createdAt: new Date().toISOString(),
            userId,
          });
          navigate(`/${studioName}/project/${newProjectRef.id}`);
        }
        break;
  
      case 'update':
        if (params.projectId && params.field) {
          const projectRef = doc(db, 'studios', studioName, 'projects', params.projectId);
          await updateDoc(projectRef, { [params.field]: params.value });
        }
        break;
  
      case 'prompt':
        const requiredFields = params.fields || [{ field: params.field, inputType: params.inputType || 'text' }];
        handleSendMessage(`${item}`, {
          action: 'prompt',
          inputPrompt: { fields: requiredFields },
        });
        console.log(requiredFields)
        return; // Wait for input submission
  
      default:
        console.warn('Unhandled action:', action);
    }
  
    handleSendMessage(`${item}`, { action, params });
  };
  const handlePromptSubmission = async (messageId, fields) => {
    const inputs = promptInputs[messageId];
    if (!inputs || fields.some((field) => !inputs[field.field]?.trim())) return;
  
    const promptResponse = fields.reduce((acc, field) => {
      acc[field.field] = inputs[field.field];
      return acc;
    }, {});
  
    // Call handlePromptResponse with the collected inputs
    await handlePromptResponse(promptResponse);
  
    // Clear inputs for this message
    setPromptInputs((prev) => {
      const newInputs = { ...prev };
      delete newInputs[messageId];
      return newInputs;
    });
  };
  const generateAIResponse = async (updatedMessages) => {
    if (!activeConversation || updatedMessages.length === 0 || isTyping) 
      return;

    const lastMessage = updatedMessages[updatedMessages.length - 1];
    if (lastMessage.sender.type !== 'customer') 
      return;

    // Check token limit before proceeding
    if (inputTokens + outputTokens >= TOKEN_LIMIT) {
      const limitMessage = {
        conversationId: activeConversation,
        studioId: defaultStudio.domain,
        content: { 
          text: "Token limit reached (10,000). Please start a new chat.",
          lists: [],
          aiMetadata: { isAIGenerated: true }
        },
        sender: { id: 'flowpilot-bot', type: 'bot', name: 'FlowPilot', avatar: '' },
        status: { delivered: true, read: false, edited: false },
        timestamps: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      };
      const messageRef = await addDoc(collection(db, 'studios', defaultStudio.domain, 'conversations', activeConversation, 'messages'), limitMessage);
      setMessages(prev => [...prev, { id: messageRef.id, ...limitMessage }]);
      return;
    }
    
    setTimeout(() => setIsTyping(true), 500);
    try {
  
      // Construct history with merged consecutive 'model' messages
      const history = [];
      let lastRole = null;
      let mergedText = '';
  
      updatedMessages.slice(0, -1).forEach(msg => {
        const currentRole = msg.sender.type === 'customer' ? 'user' : 'model';
  
        if (currentRole === lastRole && currentRole === 'model') {
          // Merge consecutive 'model' messages
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
  
      // Push the last merged message
      if (mergedText && lastRole) {
        history.push({
          role: lastRole,
          parts: [{ text: mergedText.trim() }],
        });
      }
  
      const chatSession = model.startChat({ generationConfig, history });
  
      const prompt = `
        System Instructions: ${systemInstruction}
        Retrieval Data: ${JSON.stringify(projects)}
        User message: ${lastMessage.content.text}`;
      // For the last message include 2-3 suggested follow-up action "prompt" ,only if nessesery and applicable contextualy.


      // Calculate input tokens
    const inputText = JSON.stringify(history) + prompt;
    
    // Send prompt to model
    const result = await chatSession.sendMessage(prompt);
    let responseText = result.response.text().trim();

    const newInputTokens = result.response.usageMetadata.promptTokenCount;
    // Calculate output tokens
    const newOutputTokens = result.response.usageMetadata.candidatesTokenCount;
    console.log(
      '%c' + newInputTokens + newOutputTokens + " tokens = I " + newInputTokens+ " + O " + newOutputTokens,'color: gray;' );
    // Update token counts
    setInputTokens(prev => prev + newInputTokens);
    setOutputTokens(prev => prev + newOutputTokens);
    const totalCost = calculateTotalCost(inputTokens + newInputTokens, outputTokens + newOutputTokens, "gemini-2.0-flash-lite");
    setTokenCost(totalCost)
    // Strip markdown code block markers if present
      responseText = responseText
        .replace(/^```json\s*/, '')
        .replace(/\s*```\s*$/, '');
  
      let responseJson;
      try {
        responseJson = JSON.parse(responseText);
        console.log("Output")
        if (Array.isArray(responseJson)) {
          for (let i = 0; i < responseJson.length; i++) {
              console.log(responseJson[i]);
          }
      }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError, 'Raw response:', responseText);
        responseJson = [{
          text: "Sorry, I encountered an issue. How can I assist you?",
          lists: [],
          inputPrompt: "",
        }];
      }
  
      const botMessages = responseJson.map((msg, index) => ({
        conversationId: activeConversation,
        studioId: defaultStudio.domain,
        content: {
          text: msg.text|| '',
          lists: msg.lists || [],
          aiMetadata: {
            isAIGenerated: true,
            detectedIntent: lastMessage.content.aiMetadata?.detectedIntent || 'general',
            inputPrompt: msg.inputPrompt || '',
          },
        },
        sender: { id: 'flowpilot-bot', type: 'bot', name: 'FlowPilot', avatar: '' },
        status: { delivered: true, read: false, edited: false },
        timestamps: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      }));
  
      const messagesRef = collection(db, 'studios', defaultStudio.domain, 'conversations', activeConversation, 'messages');
      const newMessages = [];
      for (const botMessage of botMessages) {
        setIsTyping(true);
        const delay = calculateDelay(botMessage.content.text || '');
        await new Promise(resolve => setTimeout(resolve, delay * 2));
  
        const messageRef = await addDoc(messagesRef, botMessage);
        newMessages.push({ id: messageRef.id, ...botMessage });
        setMessages(prev => [...prev, newMessages[newMessages.length - 1]]);
        setIsTyping(false);
      }
  
      const convRef = doc(db, 'studios', defaultStudio.domain, 'conversations', activeConversation);
      await updateDoc(convRef, {
        'meta.lastMessage': botMessages[botMessages.length - 1].content.text,
        'meta.lastUpdated': new Date().toISOString(),
      });
    } 
    catch (error) {
      console.error('Error generating AI response:', error);
      setIsTyping(false);
      const fallbackMessage = {
        conversationId: activeConversation,
        studioId: defaultStudio.domain,
        content: { text: "Oops, something went wrong. Try again?", lists: [], aiMetadata: { isAIGenerated: true } },
        sender: { id: 'flowpilot-bot', type: 'bot', name: 'FlowPilot', avatar: '' },
        status: { delivered: true, read: false, edited: false },
        timestamps: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      };
      const messageRef = await addDoc(collection(db, 'studios', defaultStudio.domain, 'conversations', activeConversation, 'messages'), fallbackMessage);
      setMessages(prev => [...prev, { id: messageRef.id, ...fallbackMessage }]);
    }
  };
  const handleEndChat = async () => {
    if (!activeConversation) return;
    setIsTyping(false);
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

  // Chat Initialization
  useEffect(() => {
    if (defaultStudio?.domain && userId) {
      initializeConversation();
    }
  }, [defaultStudio, userId]);
  // Typing sound effect
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
  // Scroll bottom chat
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flow-pilot">
      <div className="chat-header">
        {/* Back button */}
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
        {/* Signal */}
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
              <div className="conversation-meta">
                FlowPilot 
                <span className="token-usage">
                  {formatDecimalKnos(inputTokens + outputTokens)}/{formatDecimalKnos(TOKEN_LIMIT)} 
                  {/* (In: {inputTokens}, Out: {outputTokens}) */}
                </span>
                <span className="token-usage inr">₹{convertUsdToInr(tokenCost)}
                </span>
              </div>
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
                      handleEndChat()
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
                    {
                      msg.content.text.length > 0 && (
                        <div className="message-content">
                          <p>{msg.content.text}</p>
                        </div>
                      )
                    }
                    {msg.content.lists?.length > 0 && (
                      <div className="suggestions selectable-list">
                        {msg.content.lists.map((listItem, index) => (
                          <div
                            className="ai-suggestion"
                            key={index}
                            onClick={() => handleSelectItem(listItem)}
                          >
                            {listItem.item}
                          </div>
                        ))}
                      </div>
                    )}
                    {msg.content.aiMetadata.inputPrompt?.fields && (
                      <div className="input-prompt">
                        <p>Please provide the following:</p>
                        {msg.content.aiMetadata.inputPrompt.fields.map((field, index) => (
                          <div key={index} className="prompt-field">
                            <label>{field.field}</label>
                            <input
                              type={field.inputType}
                              value={promptInputs[msg.id]?.[field.field] || ''}
                              onChange={(e) =>
                                setPromptInputs((prev) => ({
                                  ...prev,
                                  [msg.id]: {
                                    ...(prev[msg.id] || {}),
                                    [field.field]: e.target.value,
                                  },
                                }))
                              }
                              placeholder={`Enter ${field.field}`}
                            />
                          </div>
                        ))}
                        <button
                          onClick={() => handlePromptSubmission(msg.id, msg.content.aiMetadata.inputPrompt.fields)}
                          disabled={msg.content.aiMetadata.inputPrompt.fields.some(
                            (field) => !promptInputs[msg.id]?.[field.field]?.trim()
                          )}
                        >
                          Submit
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
              {isTyping && (
                <div className="message-group bot">
                  <div className="message tools">
                    <div className="message-content typing">
                      <p>Typing...</p>
                    </div>
                    <div className="message-content typing stop">
                      <p>Stop</p>
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
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
            />
            <button onClick={() => handleSendMessage(input)}></button>
          </div>
        </>
      )}
    </div>
  );
};

export default FlowPilot;