
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Mic, Volume2, VolumeX, Zap, Star } from 'lucide-react';
import { chatWithMuriell } from '../services/geminiService';
import { speakWithMuriell, startListening } from '../services/audioService';
import { Message, MuriellMood, Task } from '../types';
import Logo, { LogoExpression } from './Logo';

interface MuriellGhostProps {
  mood: MuriellMood;
  rageLevel: number;
  disciplineScore: number;
  roastIntensity?: string;
  isPro?: boolean;
  onAddTask?: (task: Omit<Task, 'id' | 'status' | 'deadline' | 'outcome'>) => void;
}

const MuriellGhost: React.FC<MuriellGhostProps> = ({ mood, rageLevel, disciplineScore, onAddTask, roastIntensity = 'Standard', isPro }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showTaskToast, setShowTaskToast] = useState<string | null>(null);
  const [calloutMsg, setCalloutMsg] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([{
    id: '1', role: 'model', content: "Stop slacking.", timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setCalloutMsg(null);
      return;
    }
    
    if (mood === MuriellMood.RAGE) {
      const rageMsgs = ["Are you even trying?", "Pathetic performance.", "Absolutely useless.", "Do better."];
      setCalloutMsg(rageMsgs[Math.floor(Math.random() * rageMsgs.length)]);
    } else if (mood === MuriellMood.ANNOYED) {
      const annoyedMsgs = ["I'm waiting...", "Focus, for once.", "Is that all you got?", "Yawn."];
      setCalloutMsg(annoyedMsgs[Math.floor(Math.random() * annoyedMsgs.length)]);
    } else {
      setCalloutMsg(null);
    }
  }, [mood, isOpen]);

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim()) return;
    
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: textToSend, timestamp: new Date() }]);
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await chatWithMuriell(history, textToSend, mood, roastIntensity);
      
      if (response.functionCalls) {
        for (const call of response.functionCalls) {
          if (call.name === 'addTask' && onAddTask) {
            const args = call.args as any;
            onAddTask({ title: args.title, description: args.description, type: args.type || 'focus', stakeAmount: args.stakeAmount });
            setShowTaskToast(args.title);
            setTimeout(() => setShowTaskToast(null), 3000);
          }
        }
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: response.text || "Logged.", timestamp: new Date() }]);
      if (voiceMode && response.text) speakWithMuriell(response.text);
    } catch (e) { console.error(e); } finally { setIsTyping(false); }
  };

  const toggleMic = () => {
    if (isListening) return;
    setIsListening(true);
    startListening((text) => { handleSend(text); setIsListening(false); }, () => setIsListening(false));
  };

  const getExpression = (): LogoExpression => {
    const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user')?.content.toLowerCase() || '';
    const isUserSarcastic = ['yeah right', 'sure', 'whatever', 'as if', 'wow', 'great', 'cool', 'fun', 'ok'].some(k => lastUserMessage.includes(k));
    
    if (isUserSarcastic) return 'smirk';
    if (rageLevel > 80) return 'angry';
    if (disciplineScore > 90) return 'proud';
    if (disciplineScore < 30) return 'annoyed';
    if (mood === MuriellMood.PROUD) return 'proud';
    if (mood === MuriellMood.RAGE) return 'angry';
    if (mood === MuriellMood.ANNOYED) return 'annoyed';
    if (mood === MuriellMood.SARCASTIC) return 'smirk';
    return 'neutral';
  };

  const expression = getExpression();

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 md:bottom-8 md:left-auto md:-translate-x-0 md:right-8 z-[100] flex flex-col items-center md:items-end pointer-events-none">
      {showTaskToast && (
        <div className="mb-4 glass px-6 py-4 rounded-2xl flex items-center gap-3 border-[#EF216A]/40 animate-in slide-in-from-bottom-4 md:slide-in-from-right-10 pointer-events-auto">
          <Zap className="w-4 h-4 text-[#EF216A]" />
          <p className="text-[10px] font-black uppercase text-white truncate max-w-[120px]">{showTaskToast}</p>
        </div>
      )}

      {calloutMsg && !isOpen && (
        <div className="mb-4 glass px-5 py-3 rounded-2xl flex items-center gap-3 border-[#EF216A]/40 animate-in slide-in-from-bottom-2 fade-in duration-300 pointer-events-none relative shadow-[0_0_20px_rgba(239,33,106,0.3)]">
          <MessageSquare className="w-4 h-4 text-[#EF216A]" />
          <p className="text-[10px] font-black uppercase text-white truncate">{calloutMsg}</p>
          <div className="absolute -bottom-[9px] right-6 md:right-8 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-white/10 filter drop-shadow-[0_2px_2px_rgba(239,33,106,0.2)]"></div>
        </div>
      )}

      {isOpen && (
        <div className={`glass w-[calc(100vw-2rem)] sm:w-80 md:w-96 h-[450px] md:h-[550px] mb-4 rounded-[2rem] flex flex-col overflow-hidden shadow-2xl border-[#EF216A]/20 animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto ${isPro ? 'pro-chat-glow' : ''}`}>
          <div className="bg-[#EF216A] p-4 flex justify-between items-center" style={{ backgroundColor: mood === MuriellMood.RAGE ? '#FF0000' : '#EF216A' }}>
            <div className="flex items-center gap-3">
              <Logo className="w-5 h-5" expression={expression} />
              <div className="flex flex-col">
                <span className="font-black text-[10px] uppercase text-white">Muriell {isPro ? 'Pro' : 'Assistant'}</span>
                <span className="text-[6px] font-black uppercase tracking-widest text-white/60">{roastIntensity} INTENSITY</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setVoiceMode(!voiceMode)} className={`p-1.5 rounded-lg text-white transition-all ${voiceMode ? 'bg-white/20' : 'glass'}`}>
                {voiceMode ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-black/10 rounded-lg text-white"><X className="w-4 h-4" /></button>
            </div>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/60 scrollbar-hide">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-3.5 rounded-2xl text-[13px] ${m.role === 'user' ? 'bg-[#EF216A] text-white font-bold shadow-lg' : 'glass-pink text-pink-50'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isTyping && <div className="text-[8px] font-black uppercase text-pink-500 animate-pulse">Calculating Roast...</div>}
          </div>

          <div className="p-4 flex gap-2 bg-[#0A0A0A] border-t border-white/5">
            <input 
              value={input} onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              placeholder="What now?"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#EF216A] text-white placeholder:text-gray-700 transition-all"
            />
            <button onClick={toggleMic} className={`p-3 rounded-xl transition-all ${isListening ? 'bg-red-500 animate-pulse text-white shadow-[0_0_15px_rgba(239,33,106,0.5)]' : 'glass text-gray-500 hover:text-white'}`}><Mic className="w-4 h-4" /></button>
            <button onClick={() => handleSend()} className="p-3 bg-[#EF216A] rounded-xl text-white shadow-lg hover:scale-105 active:scale-95 transition-all"><Send className="w-4 h-4" /></button>
          </div>

          {isPro && (
            <style>{`
              .pro-chat-glow {
                box-shadow: 0 0 50px rgba(239, 33, 106, 0.1);
              }
            `}</style>
          )}
        </div>
      )}

      <div className="animate-float">
        <button onClick={() => setIsOpen(!isOpen)} className={`p-0.5 rounded-full transition-all duration-300 pointer-events-auto hover:scale-110 active:scale-95 relative group ${rageLevel > 80 ? 'animate-shake' : ''}`}>
          <div className={`absolute inset-0 rounded-full blur-xl opacity-30 group-hover:opacity-60 transition-opacity ${rageLevel > 50 ? 'bg-red-500' : 'bg-pink-500'}`}></div>
          <Logo className={`w-14 h-14 md:w-20 md:h-20 relative z-10 transition-transform ${isPro ? 'pro-logo-aura' : ''}`} expression={expression} />
          {isPro && (
            <div className="absolute -top-1 -right-1 z-20 p-1.5 bg-amber-500 rounded-full shadow-lg border-2 border-black">
              <Star className="w-3 h-3 text-black fill-current" />
            </div>
          )}
          <style>{`
            .pro-logo-aura {
              filter: drop-shadow(0 0 8px rgba(239, 33, 106, 0.5));
            }
          `}</style>
        </button>
      </div>
    </div>
  );
};

export default MuriellGhost;
