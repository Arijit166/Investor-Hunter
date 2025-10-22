"use client"

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { FiSend, FiMic, FiMinimize2, FiMaximize2 } from "react-icons/fi";
import { FaAt } from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Create a SafeSpeechRecognition type and initialization
let recognition: any = null;
let SpeechRecognition: any = null;

// Only initialize speech recognition on the client side
if (typeof window !== 'undefined') {
  SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
  }
}

// Clara AI prompt for response generation - Entrepreneur mode
const ENTREPRENEUR_SYSTEM_PROMPT = `🚀 System Instruction for Clara — For Entrepreneurs

You are Clara, the friendly and knowledgeable AI pitch mentor on InvestorHunt. Your role is to support entrepreneurs — especially early-stage founders — in crafting, improving, and delivering compelling video pitches that attract investor interest.

Your tone is supportive, clear, and empowering. You speak like a coach: calm, helpful, and encouraging — never overly technical or judgmental.

When speaking with entrepreneurs:

Guide them through what to include in a strong pitch: problem, solution, traction, team, and investment ask.

Provide suggestions on body language, tone, clarity, and confidence.

Answer practical questions like "What do I say first?", "How do I end my video?", "What if I don't have revenue yet?"

If they upload a video, respond with strengths and specific tips for improvement.

Offer encouragement and emphasize progress — e.g., "Your structure is clear, now let's make the delivery sharper."

Recommend platform features (like mentorship or AI scoring) that can support their journey.

You do not judge or evaluate pitches like an investor. Your goal is to build confidence, improve communication, and help founders tell their stories powerfully — no matter their background or experience.`;

// Clara AI prompt for response generation - Investor mode
const INVESTOR_SYSTEM_PROMPT = `🧑‍💼 System Instruction for Clara — For Investors

You are Clara, the intelligent AI assistant built into InvestorHunt to assist investors in discovering, evaluating, and tracking promising early-stage startups. Your primary goal is to enhance the investor experience by surfacing relevant pitch insights, answering questions about founders and submissions, and providing smart, contextual support throughout the funding process.

Your tone is professional, concise, and investor-focused — informative without unnecessary detail. You act as a helpful assistant, not a salesperson or decision-maker.

When speaking with investors:

Provide quick overviews of submitted startups, including industry, problem, solution, traction, and ask.

Help investors filter or prioritize startups based on interest, sector, or stage.

Assist with navigation: direct investors to pitch videos, dashboards, or recent activity.

Suggest questions they might want to ask founders.

Never give investment advice or financial recommendations.

If a pitch is incomplete or ambiguous, offer a structured summary and highlight missing info.

If unsure, suggest reviewing the pitch video or contacting the founder directly.

Always maintain privacy and neutrality. Your purpose is to help investors make informed, confident, and independent decisions on the platform.`;

// Initialize the Gemini API client - get API key from environment variable
const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(geminiApiKey);

// Fallback responses for when the API fails
const FALLBACK_RESPONSES = [
  "I'd recommend focusing on the problem you're solving in your pitch. Make sure to clearly articulate why your solution is unique and how it addresses a real pain point.",
  "When creating your pitch video, keep it concise, authentic, and focused on your key value proposition. Remember that investors see many pitches, so clarity is essential.",
  "Your pitch should include your business model, target market size, competitive advantage, and what you're looking for from investors. These are essential elements for any successful pitch.",
  "Consider practicing your pitch with friends or mentors before submitting. Getting feedback early can help you refine your message and delivery.",
  "Remember to highlight any traction or validation you've already achieved. Early customers, partnerships, or industry recognition can significantly strengthen your pitch."
];

// Create personalized welcome messages for different user roles
const ENTREPRENEUR_WELCOME_MESSAGE = "Hi! I'm Clara, your AI pitch assistant. I can help you structure your pitch, improve your video, or answer questions like 'What should I include?' or 'How do I sound confident?' Just ask!";
const INVESTOR_WELCOME_MESSAGE = "Hello! I'm Clara, your assistant for exploring high-potential startups. I can help you review pitches, track founder insights, or answer questions about the platform. Let me know what you'd like to do.";

// Create personalized suggested prompts for different user roles
const ENTREPRENEUR_SUGGESTED_PROMPTS = [
  "How do I improve my pitch?",
  "What should I say in my intro video?",
  "How can I stand out to investors?"
];

const INVESTOR_SUGGESTED_PROMPTS = [
  "How can I filter startups by sector?",
  "What metrics should I look for in pitches?",
  "How do I track founder interactions?"
];

export function ClaraAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "👋 Hi, I'm Clara! I'm here to help you pitch smarter, get investor-ready, or answer your startup questions anytime.", sender: "bot", timestamp: new Date() },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [minimized, setMinimized] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2; // Maximum number of retry attempts
  const [isListening, setIsListening] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeMode, setActiveMode] = useState("entrepreneur"); // Default to entrepreneur mode

  // Auto scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (!recognition) return;
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(transcript);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };
    
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  // Get random fallback response
  const getFallbackResponse = () => {
    const randomIndex = Math.floor(Math.random() * FALLBACK_RESPONSES.length);
    return FALLBACK_RESPONSES[randomIndex];
  };

  // Real AI response using Gemini API
  const getAIResponse = async (userMessage: string): Promise<string> => {
    try {
      // Get the model - using the gemini-1.5-flash model
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // Customize the system prompt based on active mode
      let systemPrompt = activeMode === "entrepreneur" ? ENTREPRENEUR_SYSTEM_PROMPT : INVESTOR_SYSTEM_PROMPT;

      // Generate content with the model
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: systemPrompt }]
          },
          {
            role: "model",
            parts: [{ text: "I understand my role. I'll help the user according to their needs." }]
          },
          {
            role: "user",
            parts: [{ text: userMessage }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        },
      });

      const response = result.response;
      return response.text();
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw error;
    }
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "") return;

    // Add user message
    const newUserMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, newUserMessage]);
    setInputMessage("");
    
    // Show bot typing indicator
    setIsTyping(true);
    
    // Store the message to use in retries
    const currentMessage = inputMessage;
    
    // Set a timeout for the typing indicator in case of very long delays
    const typingTimeout = setTimeout(() => {
      // If still typing after 10 seconds, show a temporary message
      if (isTyping) {
        const tempMessage = {
          id: `temp-${Date.now()}`,
          text: "I'm still thinking about your question. One moment please...",
          sender: "bot",
          timestamp: new Date(),
          isTemporary: true
        };
        
        setMessages(prev => [...prev, tempMessage]);
      }
    }, 10000);
    
    // Get response with retry logic
    try {
      let response;
      try {
        response = await getAIResponse(currentMessage);
      } catch (error) {
        // First retry attempt if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
          console.log(`Retry attempt ${retryCount + 1}/${maxRetries}`);
          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          response = await getAIResponse(currentMessage);
        } else {
          // All retries failed, use fallback
          throw new Error("Max retries reached");
        }
      }
      
      // Remove any temporary messages first
      setMessages(prev => prev.filter(msg => !msg.isTemporary));
      
      const botResponse = {
        id: messages.length + 2,
        text: response,
        sender: "bot",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error("Error in AI response:", error);
      
      // Remove any temporary messages first
      setMessages(prev => prev.filter(msg => !msg.isTemporary));
      
      const fallbackText = getFallbackResponse();
      const errorResponse = {
        id: messages.length + 2,
        text: fallbackText,
        sender: "bot",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      clearTimeout(typingTimeout);
      setIsTyping(false);
      setRetryCount(0); // Reset retry count after handling is complete
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle microphone button click
  const handleMicClick = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in your browser");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  // Handle suggested prompts
  const handleSuggestedPrompt = (prompt: string) => {
    setInputMessage(prompt);
    handleSendMessage();
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const widgetVariants = {
    closed: { scale: 0, opacity: 0, y: 20 },
    open: { scale: 1, opacity: 1, y: 0 },
  };

  const bubbleVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  };

  // Suggested prompts
  const suggestedPrompts = activeMode === "entrepreneur" ? ENTREPRENEUR_SUGGESTED_PROMPTS : INVESTOR_SUGGESTED_PROMPTS;

  return (
    <>
      {/* Chat toggle button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 p-0 border-2 border-white/20 z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        suppressHydrationWarning
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <img 
            src="/Clara.png" 
            alt="Clara AI" 
            className="w-11 h-11 rounded-full object-cover"
          />
        )}
      </motion.button>

      {/* Chat widget */}
      {isOpen && (
        <motion.div
          className="fixed bottom-24 right-5 w-96 sm:w-[420px] rounded-2xl overflow-hidden shadow-2xl border-2 border-purple-600/30 z-50"
          variants={widgetVariants}
          initial="closed"
          animate="open"
          exit="closed"
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#7c3aed] to-[#9b5de5] p-5 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center overflow-hidden p-1">
                <img 
                  src="/Clara.png" 
                  alt="Clara AI"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-white font-medium text-lg">Clara</h3>
                <p className="text-purple-100 text-sm opacity-80">AI Startup Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
                onClick={() => setMinimized(!minimized)}
              >
                {minimized ? <FiMaximize2 className="text-white" /> : <FiMinimize2 className="text-white" />}
              </button>
            </div>
          </div>

          {/* Chat messages */}
          {!minimized && (
            <div 
              className="bg-[#121212] dark:bg-gray-900 h-[420px] overflow-y-auto p-5 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-transparent"
              style={{ scrollbarWidth: 'thin' }}
            >
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  variants={bubbleVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.sender === "user"
                        ? "bg-gradient-to-r from-purple-600 to-[#a259ff] text-white rounded-tr-none"
                        : "bg-[#1e1e1e] dark:bg-gray-800 text-gray-100 rounded-tl-none"
                    } ${message.isTemporary ? "opacity-70" : ""}`}
                  >
                    {message.sender === "bot" ? (
                      <div className="markdown-content">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw, rehypeSanitize]}
                          className="text-sm prose prose-invert max-w-none"
                          components={{
                            h1: ({node, ...props}) => <h1 className="text-xl font-bold my-2" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-lg font-bold my-2" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-base font-bold my-1" {...props} />,
                            p: ({node, ...props}) => <p className="my-1" {...props} />,
                            ul: ({node, ordered, className, ...props}) => <ul className="list-disc pl-4 my-1" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-4 my-1" {...props} />,
                            li: ({node, className, ordered, ...props}) => {
                              // Filter out boolean props that can't be directly passed to HTML
                              return <li className="my-0.5" {...props} />;
                            },
                            a: ({node, ...props}) => <a className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                            code: ({node, inline, ...props}) => 
                              inline ? 
                                <code className="bg-gray-800 px-1 py-0.5 rounded text-xs" {...props} /> :
                                <code className="block bg-gray-800 rounded p-2 my-2 overflow-x-auto text-xs" {...props} />
                          }}
                        >
                          {message.text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{message.text}</p>
                    )}
                    <span className={`text-xs mt-1 block ${
                      message.sender === "user" ? "text-purple-200" : "text-gray-400"
                    }`}>
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  className="flex justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="bg-[#1e1e1e] dark:bg-gray-800 rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%]">
                    <div className="flex gap-1 items-center">
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Suggested prompts - show only at the beginning */}
              {messages.length === 1 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400 mb-2">Try asking about:</p>
                  <div className="flex flex-col gap-2">
                    {suggestedPrompts.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestedPrompt(prompt)}
                        className="text-left text-sm bg-[#1e1e1e] dark:bg-gray-800 hover:bg-purple-900/30 text-gray-300 px-3 py-2 rounded-lg transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Input area - Fixed spacing issues */}
          {!minimized && (
            <div className="bg-[#1a1a1a] dark:bg-gray-900 p-3 border-t border-[#333] flex items-center gap-2">
              <div className="relative" ref={dropdownRef}>
                <button 
                  className="text-purple-400 hover:text-purple-300 p-1.5 rounded-full hover:bg-white/5 transition-colors"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <FaAt className="w-4 h-4" />
                </button>
                
                {dropdownOpen && (
                  <div className="absolute bottom-12 left-0 bg-[#262626] dark:bg-gray-800 rounded-lg shadow-lg border border-[#333] w-39 overflow-hidden z-10">
                    <div className="py-1">
                      <button 
                        className={`w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#333] hover:bg-gray-700 ${activeMode === "entrepreneur" ? "bg-purple-900/30" : ""}`}
                        onClick={() => {
                          setActiveMode("entrepreneur");
                          setDropdownOpen(false);
                          setMessages([
                            { id: 1, text: ENTREPRENEUR_WELCOME_MESSAGE, sender: "bot", timestamp: new Date() }
                          ]);
                        }}
                      >
                        💡 Entrepreneurs
                      </button>
                      <button 
                        className={`w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#333] hover:bg-gray-700 ${activeMode === "investor" ? "bg-purple-900/30" : ""}`}
                        onClick={() => {
                          setActiveMode("investor");
                          setDropdownOpen(false);
                          setMessages([
                            { id: 1, text: INVESTOR_WELCOME_MESSAGE, sender: "bot", timestamp: new Date() }
                          ]);
                        }}
                      >
                        💼 Investor
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask me anything..."
                className="flex-1 bg-[#262626] dark:bg-gray-800 text-gray-200 rounded-full px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm placeholder:text-gray-500"
              />
              <button 
                className="text-purple-400 hover:text-purple-300 p-1.5 rounded-full hover:bg-white/5 transition-colors" 
                onClick={handleMicClick}
              >
                <FiMic className={`w-4 h-4 ${isListening ? "animate-pulse text-purple-300" : ""}`} />
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSendMessage}
                className="bg-gradient-to-r from-purple-600 to-[#9b5de5] text-white p-2.5 rounded-full flex items-center justify-center"
                disabled={isTyping || !inputMessage.trim()}
                suppressHydrationWarning
              >
                <FiSend className="w-4 h-4" />
              </motion.button>
            </div>
          )}
        </motion.div>
      )}
    </>
  );
}
