import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  User, 
  Bot, 
  Settings, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  X, 
  Plus, 
  Phone, 
  Mail, 
  Calendar,
  Building2,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { GoogleGenAI } from "@google/genai";
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function LeadBot({ isEmbedded = false, listingId = null, agentId = null }: { isEmbedded?: boolean; listingId?: string | null; agentId?: string | null }) {
  const { user } = useAuth();
  const targetUserId = agentId || user?.id;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: isEmbedded 
        ? "Hi! I'm your property assistant. How can I help you with this listing?" 
        : "Hi! I'm your AI Real Estate Assistant. I can help you follow up with leads, answer property questions, and schedule showings. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const prompt = `You are a professional AI Real Estate Assistant for a realtor. 
      ${isEmbedded ? `You are helping a potential lead on a property landing page (ID: ${listingId}).` : ''}
      Your goal is to be helpful, professional, and engaging. 
      Answer the following lead inquiry: "${input}"
      
      Context: You have access to property details, can schedule showings, and can provide market insights.
      If the user asks about a specific property, provide a professional response.
      If they want to schedule a showing, ask for their preferred time.
      Always try to capture lead information (name, phone, email) if not already provided.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      const assistantMessage: Message = {
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        content: response.text || "I'm sorry, I'm having trouble processing that right now. How else can I help?",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Lead Extraction
      const extractionPrompt = `Extract lead information from this conversation snippet:
      User: "${input}"
      Assistant: "${response.text}"
      
      Return a JSON object with keys: name, email, phone, property_interest. 
      Only include fields that were explicitly mentioned. If none, return an empty object.`;

      const extractionResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: extractionPrompt,
        config: { responseMimeType: "application/json" }
      });

      const leadData = JSON.parse(extractionResponse.text || '{}');
      if (Object.keys(leadData).length > 0 && targetUserId) {
        try {
          await addDoc(collection(db, 'leads'), {
            ...leadData,
            user_id: targetUserId,
            listing_id: listingId,
            source: isEmbedded ? 'Landing Page Chat' : 'AI Chatbot',
            created_at: serverTimestamp(),
            status: 'New'
          });
          toast.success('Lead information captured!');
        } catch (err) {
          console.error('Failed to save lead:', err);
        }
      }
    } catch (error) {
      console.error("Chat failed:", error);
      if (!isEmbedded) toast.error("Failed to get response from AI.");
    } finally {
      setIsTyping(false);
    }
  };

  if (isEmbedded) {
    return (
      <div className="flex flex-col h-full bg-[#0A0A0A]">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-3 max-w-[90%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                msg.role === 'assistant' ? "bg-orange-500/10 text-orange-500" : "bg-white/10 text-white/60"
              )}>
                {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className={cn(
                "p-3 rounded-2xl text-xs leading-relaxed",
                msg.role === 'assistant' 
                  ? "bg-white/5 border border-white/10 text-white/80 rounded-tl-none" 
                  : "bg-orange-500 text-black font-medium rounded-tr-none"
              )}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <div className="flex gap-3 max-w-[90%]">
              <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-orange-500" />
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl rounded-tl-none flex gap-1">
                <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce" />
                <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-white/10 bg-white/5">
          <div className="relative">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question..."
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-orange-500 transition-all"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-orange-500 text-black rounded-lg hover:bg-orange-400 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-12rem)] flex flex-col space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">AI Lead Follow-Up Bot</h1>
          <p className="text-white/60">Automated, instant responses for all your real estate leads.</p>
        </div>
        <div className="flex gap-3">
          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10">
            <Settings className="w-5 h-5 text-white/40" />
          </button>
          <button 
            onClick={() => setMessages([messages[0]])}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 text-red-400"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
        {/* Chat Interface */}
        <div className="lg:col-span-2 flex flex-col bg-white/5 border border-white/10 rounded-[32px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-6 border-b border-white/10 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Bot className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="font-bold">EstateFlow Assistant</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-white/40">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Avg. Response: Instant</span>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-4 max-w-[85%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  msg.role === 'assistant' ? "bg-orange-500/10 text-orange-500" : "bg-white/10 text-white/60"
                )}>
                  {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <div className={cn(
                  "p-4 rounded-2xl text-sm leading-relaxed",
                  msg.role === 'assistant' 
                    ? "bg-white/5 border border-white/10 text-white/80 rounded-tl-none" 
                    : "bg-orange-500 text-black font-medium rounded-tr-none"
                )}>
                  {msg.content}
                  <div className={cn(
                    "text-[10px] mt-2 opacity-40",
                    msg.role === 'user' ? "text-black" : "text-white"
                  )}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}
            {isTyping && (
              <div className="flex gap-4 max-w-[85%]">
                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-orange-500" />
                </div>
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl rounded-tl-none flex gap-1">
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-white/10 bg-white/5">
            <div className="relative">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message here..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:border-orange-500 transition-all"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-orange-500 text-black rounded-xl hover:bg-orange-400 transition-all disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6 overflow-y-auto scrollbar-hide">
          <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 space-y-6">
            <h3 className="font-bold text-lg">Lead Insights</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Interest</p>
                  <p className="text-xs font-bold">Modern Villa, Beverly Hills</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Last Active</p>
                  <p className="text-xs font-bold">Just now</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 space-y-6">
            <h3 className="font-bold text-lg">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-3">
              <button className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-left group">
                <Phone className="w-5 h-5 text-green-500 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-xs font-bold">Call Lead</p>
                  <p className="text-[10px] text-white/40">Connect instantly</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-left group">
                <Mail className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-xs font-bold">Send Email</p>
                  <p className="text-[10px] text-white/40">Follow up via email</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all text-left group">
                <Calendar className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-xs font-bold">Schedule Showing</p>
                  <p className="text-[10px] text-white/40">Book a property tour</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
