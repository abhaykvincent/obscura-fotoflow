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

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};
const splitIntoSentences = (text) => {
  const parts = text.split(/([.!?])\s*/);
  const sentences = [];
  for (let i = 0; i < parts.length; i += 2) {
    if (i + 1 < parts.length) {
      sentences.push(parts[i] + parts[i + 1]);
    } else {
      sentences.push(parts[i]);
    }
  }
  return sentences;
};
const initialContext = {
  role: 'model',
  parts: [{ text: "You are FlowPilot, a helpful assistant for FotoFlow users. FotoFlow is a SaaS web app designed to streamline the workflow of event photographers. Your role is to assist users with their queries about FotoFlow's features, provide guidance on using the platform, and help troubleshoot any issues they might encounter. Be friendly, professional, and concise in your responses." }]
};
const AppDocumentation=`
Getting Started
Fotoflow is a cloud-based platform tailored for event photographers to simplify their workflow. To begin:

Sign up at fotoflow.com (URL placeholder).
Log in to access your dashboard.
Explore the core features below to start managing your photography business efficiently.
Core Features
Storing & Organizing Photos
How It Works: Upload your photos to Fotoflow’s cloud-based storage, where they are automatically organized into galleries within a project.
Key Benefits: Access your photos from anywhere, keep projects tidy, and save time searching for files.
Tips: Create a new project for each event to keep galleries organized.
Sharing Galleries
How It Works: Once photos are uploaded, generate a shareable link for each gallery. Anyone with the link can view the gallery.
Client Gallery: A passcode-protected gallery (default setting) allows clients to securely view and interact with their photos.
Coming Soon: Custom permissions and passcode protection for all galleries.
Tips: Share links via email or messaging apps directly from Fotoflow.
Selecting Photos for Final Album
How It Works: Clients can pick their favorite photos from the passcode-protected client gallery. Photographers can then copy the selected file names with one click and import them into Lightroom for editing.
Key Benefits: Streamlines collaboration and speeds up the editing process.
Tips: Ensure clients have their passcode before sharing the gallery link.
Managing Clients
How It Works: Create client profiles to store key information.
Coming Soon: Communication tools (e.g., in-app messaging) and status tracking (e.g., “Awaiting Approval,” “Delivered”).
Tips: Keep client details updated for quick reference during shoots.
Managing Shoots
How It Works: Schedule shoots, track locations, and log details like date and time within Fotoflow.
Key Benefits: Stay on top of your calendar and never miss a booking.
Tips: Add location notes to prepare for each event’s logistics.
Managing Financials
How It Works: Create invoices, track payments, and monitor expenses directly in Fotoflow.
Key Benefits: Simplify bookkeeping and maintain financial clarity for your business.
Tips: Use the payment tracking feature to follow up on outstanding invoices.
Managing Projects
How It Works: Project management tools are coming soon to help you oversee tasks, timelines, and progress for each event.
Tips: Stay tuned for updates to enhance your project oversight!
Core
5 GB
Free
*
for 12 months.
No Credit Card Required
5 GB Storage
Gallery
Selection
3 galleries/project

3 new projects/month

Plan expries on

31 July 2026

Current Plan
Freelancer
100 GB
₹980
/mo
Welcome Offer
Core +
Gallery
Selection
Financials
e-Invitation
Unlimited Projects

12 Galleries/month

+Everything in Core plan

Pay Later in 14 days.

Try for Free
Pay Now
Secured by Razorpay
Pay with UPI . Secure offer.

Studio
1 TB
₹2,800₹1,020
/mo
for 2 months.
Offer expires soon!
₹2,800/month after
Website
Portfolio
Bookings
Unlimited Galleries

1 Million Photos

+Everything in Freelancer plan

Pay Later in 14 days.

Try for Free
Pay Now
Secured by Razorpay
Pay with UPI . Secure offer.

Company
5 TB
₹4,800₹2,800
/mo
for 2 months.
Save up to ₹8,640 with offer
₹9,800/month after
Multi-studio
Custom Domain
Addon Storage
Unlimited Bandwidth

Original File Size

+Everything in Studio plan

Pay Later in 14 days.

Try for Free
Pay Now
Secured by Razorpay
Pay with UPI . Secure offer.

you are a great salles person. Make sure use of the pricing incentive to upsell like if user is intrested in freelaanmcxer plan you could uplsell to studio plan and mention the small upcharge 
Navigate the Platform:
Command: “Hey Copilot, how do I upload photos?”
Response: “Go to Projects, select a project, click Add Gallery, and upload your photos.”
Command: “Hey Copilot, where can I see my scheduled shoots?”
Response: “Navigate to Shoots from the dashboard to view your schedule.”
Command: “Hey Copilot, take me to the Financials section.”
Response: Directs you to the Financials tab or highlights it on-screen.
Ask About Projects:
Command: “Hey Copilot, what’s in the Smith Wedding project?”
Response: “The Smith Wedding project has 3 galleries: Ceremony, Reception, and Portraits, with a shoot scheduled for April 10th.”
Command: “Hey Copilot, how many photos are in the Jones Engagement gallery?”
Response: “The Jones Engagement gallery contains 45 photos.”
Command: “Hey Copilot, has the client submitted selections for Project X?”
Response: “Yes, selections were submitted on February 18th—check the client gallery.”
Pricing Insights:
Command: “Hey Copilot, how much have I invoiced this month?”
Response: “You’ve invoiced $3,200 in February so far.”
Command: “Hey Copilot, what’s the payment status for Client B’s invoice?”
Response: “Client B’s invoice for $1,000 is still unpaid, due February 25th.”
Command: “Hey Copilot, how much did I spend on expenses last week?”
Response: “You recorded $120 in expenses last week, including $80 for travel.”
Take Actions:
Command: “Hey Copilot, create an invoice for Client A for $500.”
Response: “Invoice created for Client A—$500 for ‘Event Package.’ Send it now?”
Command: “Hey Copilot, share the Ceremony gallery from Project Y with a passcode.”
Response: “Ceremony gallery link generated with passcode ‘1234.’ Copy it now?”
Command: “Hey Copilot, schedule a shoot for March 5th at 3 PM at Central Park.”
Response: “Shoot scheduled for March 5th, 3 PM, Central Park. Add more details?”
Command: “Hey Copilot, add a new client named Sarah Jones with email sarah@email.com.”
Response: “Client Sarah Jones added with email sarah@email.com. View profile?”
Command: “Hey Copilot, mark Invoice #123 as paid.”
Response: “Invoice #123 marked as paid. Update your records?”
Additional Use Cases:
Command: “Hey Copilot, suggest tags for my Reception gallery.”
Response: “Suggested tags: wedding, reception, dancing, candid, night.”
Command: “Hey Copilot, draft an email to Client C about their gallery.”
Response: “Draft: ‘Hi Client C, your gallery is ready! View it here: [link]. Passcode: 5678.’ Send?”
Command: “Hey Copilot, remind me about my next shoot.”
Response: “Your next shoot is March 1st at 2 PM—‘Davis Portrait’ at Studio A.”`
const calculateDelay = (text) => {
  const baseDelay = 500; // Minimum delay in milliseconds
  const delayPerChar = 10; // Additional delay per character
  return Math.min(baseDelay + text.length * delayPerChar, 2000); // Cap at 2 seconds
};
const FlowPilot = ({ userId }) => {
  const defaultStudio = useSelector(selectUserStudio);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const chatWindowRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  // Fetch or create conversation
  useEffect(() => {
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
          <p 
            onClick={handleEndChat}
            className="end-chat-btn"
            disabled={!activeConversation}
          >
            End chat
          </p>
          <p

            className="ai-chat-decleration"
          >
          AI assists; you decide.
          </p>
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