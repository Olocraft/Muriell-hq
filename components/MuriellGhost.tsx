
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Mic, Volume2, VolumeX, CheckCircle, Heart } from 'lucide-react';
import { chatWithMuriell } from '../services/geminiService';
import { speakWithMuriell, startListening } from '../services/audioService';
import { Message, MuriellMood, Task } from '../types';
import Logo, { LogoExpression } from './Logo';

interface MuriellGhostProps {
  mood: MuriellMood;
  rageLevel: number;
  onAddTask?: (task: Omit<Task, 'id' | 'status' | 'deadline' | 'outcome'>) => void;
}

const MuriellGhost: React.FC<MuriellGhostProps> = ({ mood, rageLevel, onAddTask }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [voiceMode, setVoiceMode] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [inputMethod, setInputMethod] = useState<'text' | 'voice'>('text');
  const [isReacting, setIsReacting] = useState(false);
  const [showTaskToast, setShowTaskToast] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      content: "Stop wasting time. What are you doing right now?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const getExpression = (): LogoExpression => {
    if (isTyping) return 'annoyed';
    switch (mood) {
      case MuriellMood.RAGE: return 'angry';
      case MuriellMood.DISAPPOINTED: return 'sad';
      case MuriellMood.ANNOYED: return 'annoyed';
      case MuriellMood.PROUD: return 'proud';
      default: return 'neutral';
    }
  };

  const triggerReaction = () => {
    setIsReacting(true);
    setTimeout(() => setIsReacting(false), 1000);
  };

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim()) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    triggerReaction();

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await chatWithMuriell(history, textToSend, mood);
      
      if (response.functionCalls) {
        for (const call of response.functionCalls) {
          if (call.name === 'addTask' && onAddTask) {
            const args = call.args as any;
            onAddTask({
              title: args.title,
              description: args.description,
              type: args.type || 'focus',
              stakeAmount: args.stakeAmount
            });
            setShowTaskToast(args.title);
            setTimeout(() => setShowTaskToast(null), 3000);
          }
        }
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response.text || (response.functionCalls ? "Done. I've added that to your list." : "I have nothing to say to that."),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
      triggerReaction();
      
      if (voiceMode && response.text) {
        speakWithMuriell(response.text);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleMic = () => {
    if (isListening) return;
    setIsListening(true);
    setInputMethod('voice');
    startListening(
      (text) => {
        handleSend(text);
        setIsListening(false);
      },
      () => setIsListening(false)
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {showTaskToast && (
        <div className="mb-4 bg-green-500 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-[0_0_30px_rgba(34,197,94,0.4)] animate-in slide-in-from-bottom-4 duration-500 font-bold uppercase tracking-widest text-[10px]">
          <CheckCircle className="w-4 h-4" />
          Task Added: {showTaskToast}
        </div>
      )}

      {isOpen && (
        <div className="glass w-80 md:w-96 h-[550px] mb-4 rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl border-pink-500/30 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#EF216A] p-5 flex justify-between items-center shadow-lg transition-colors duration-500" style={{ backgroundColor: mood === MuriellMood.RAGE ? '#FF0000' : '#EF216A' }}>
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-white/20 rounded-xl transition-transform duration-300 ${isTyping ? 'animate-pulse scale-110' : ''}`}>
                <Logo className="w-6 h-6" expression={getExpression()} />
              </div>
              <div>
                <span className="font-black tracking-tighter text-xs uppercase block text-white">Muriell</span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-pink-200">
                  {mood === MuriellMood.RAGE ? 'ANGER MODE' : 'Your Assistant'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setVoiceMode(!voiceMode)}
                className={`p-2 rounded-xl transition-all ${voiceMode ? 'bg-white/20 text-white' : 'bg-black/10 text-pink-300'}`}
              >
                {voiceMode ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-black/10 rounded-xl transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
          
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-black/40 scroll-smooth">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed shadow-sm transform transition-all hover:scale-[1.02] ${
                  m.role === 'user' 
                  ? 'bg-[#EF216A] text-white font-bold rounded-tr-none' 
                  : 'glass-pink text-pink-100 rounded-tl-none border-[#EF216A]/20'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="glass-pink p-3 rounded-2xl text-[10px] font-bold italic flex items-center gap-2 text-pink-300 animate-pulse">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <div className="p-5 flex gap-3 bg-[#0A0A0A]/40 backdrop-blur-md">
            {inputMethod === 'voice' ? (
              <button 
                onClick={toggleMic}
                className={`flex-1 py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs ${
                  isListening ? 'bg-red-500 animate-pulse text-white shadow-[0_0_20px_rgba(239,33,106,0.6)]' : 'bg-[#EF216A]/10 text-[#EF216A] hover:bg-[#EF216A]/20 border border-[#EF216A]/20'
                }`}
              >
                <Mic className="w-5 h-5" />
                {isListening ? "Listening..." : "Speak"}
              </button>
            ) : (
              <>
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="What's up?"
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-[#EF216A] transition-all placeholder:text-gray-700"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className="p-4 bg-[#EF216A] rounded-2xl hover:bg-[#d11a5b] transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative p-1 rounded-full transition-all duration-300 ${
          rageLevel > 70 || isReacting ? 'shake-animation' : 'float-animation'
        } ${isReacting ? 'scale-125' : 'scale-100'}`}
      >
        <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-500 ${
          mood === MuriellMood.PROUD ? 'bg-green-500/20' : (rageLevel > 50 ? 'bg-red-500/40' : 'bg-pink-500/20')
        } group-hover:blur-3xl ${isReacting ? 'scale-150' : 'scale-100'}`}></div>
        <Logo 
          className={`w-16 h-16 md:w-20 md:h-20 relative z-10 transition-transform group-hover:scale-110 active:scale-95`}
          expression={getExpression()}
        />
        {mood === MuriellMood.PROUD && (
          <div className="absolute -top-1 -left-1 text-green-500 z-20 animate-bounce">
            <Heart className="w-6 h-6 fill-current" />
          </div>
        )}
      </button>
    </div>
  );
};

export default MuriellGhost;
