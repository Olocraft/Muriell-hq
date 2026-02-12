
import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, 
  BrainCircuit, 
  Layers, 
  ShieldAlert, 
  Ghost, 
  Upload, 
  Loader2, 
  CheckCircle, 
  MessageCircle, 
  Play, 
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Dumbbell,
  FileText,
  Target,
  Award,
  Mic,
  MicOff,
  Search,
  BookOpen
} from 'lucide-react';
import { 
  explainConceptStream, 
  generateFlashcards, 
  generateExam, 
  generateCognitiveGame,
  summarizeMaterial
} from '../services/geminiService';
import { speakWithMuriell, startListening } from '../services/audioService';

type Mode = 'teach' | 'cards' | 'audit' | 'play' | 'summary';

const StudyCompanion: React.FC = () => {
  const [material, setMaterial] = useState('');
  const [activeMode, setActiveMode] = useState<Mode>('teach');
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<any>(null);
  const [explanation, setExplanation] = useState('');
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  // Mode-specific states
  const [cardIndex, setCardIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<number>>(new Set());
  
  const [examIndex, setExamIndex] = useState(0);
  const [examAnswers, setExamAnswers] = useState<Record<number, string>>({});
  const [examResult, setExamResult] = useState<{ score: number, total: number } | null>(null);
  
  const [gameState, setGameState] = useState({ index: 0, score: 0, showCorrection: false });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetModeStates = () => {
    setCardIndex(0);
    setShowBack(false);
    setExamIndex(0);
    setExamAnswers({});
    setExamResult(null);
    setGameState({ index: 0, score: 0, showCorrection: false });
    setExplanation('');
    setContent(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setMaterial(ev.target?.result as string);
        speakWithMuriell("File uploaded. What do you want to do with it?");
      };
      reader.readAsText(file);
    }
  };

  const executeMode = async (mode: Mode) => {
    if (!material.trim()) return;
    setIsLoading(true);
    setActiveMode(mode);
    resetModeStates();
    
    try {
      if (mode === 'cards') {
        const data = await generateFlashcards(material);
        setContent(data);
        speakWithMuriell("Flashcards ready. Let's see what you remember.");
      }
      if (mode === 'audit') {
        const data = await generateExam(material);
        setContent(data);
        speakWithMuriell("Quiz mode on. Don't fail.");
      }
      if (mode === 'play') {
        const data = await generateCognitiveGame(material);
        setContent(data);
        speakWithMuriell("Game starting. Think fast.");
      }
      if (mode === 'summary') {
        const data = await summarizeMaterial(material);
        setExplanation(data);
        speakWithMuriell("Here is the short version of that material.");
      }
    } catch (e) {
      console.error(e);
      speakWithMuriell("Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeach = async () => {
    if (!material.trim() || !query.trim()) return;
    setIsLoading(true);
    setExplanation('');
    try {
      const stream = await explainConceptStream(material, query);
      let full = "";
      for await (const chunk of stream) {
        full += chunk.text;
        setExplanation(full);
      }
    } catch (e) { 
      console.error(e); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) return;
    setIsListening(true);
    startListening(
      (text) => {
        setQuery(text);
        setIsListening(false);
        setTimeout(() => handleTeach(), 500);
      },
      () => setIsListening(false)
    );
  };

  const submitExam = () => {
    let score = 0;
    content.forEach((q: any, i: number) => {
      if (examAnswers[i] === q.answer) score++;
    });
    setExamResult({ score, total: content.length });
    speakWithMuriell(`Done. You got ${score} out of ${content.length}. ${score === content.length ? "Not bad." : "You need to study more."}`);
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-10 pb-32">
      {/* 1. Universal Ingestion */}
      <section className="glass p-8 md:p-12 rounded-[4rem] border-[#EF216A]/20 bg-gradient-to-br from-[#EF216A]/5 via-black/40 to-transparent shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 transition-opacity">
          <BookOpen className="w-32 h-32 text-[#EF216A]" />
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10 relative z-10">
          <div className="flex items-center gap-6">
            <div className="p-6 bg-[#EF216A] rounded-[2rem] shadow-[0_0_30px_rgba(239,33,106,0.4)] transition-transform hover:scale-110">
              <BrainCircuit className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">Study Hub</h2>
              <p className="text-[10px] text-pink-500 font-black uppercase tracking-[0.4em] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
                Ready to learn
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt" />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="px-8 py-5 glass border-white/10 rounded-2xl flex items-center gap-4 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-white border-dashed"
            >
              <Upload className="w-4 h-4 text-[#EF216A]" /> Upload File (.txt)
            </button>
          </div>
        </div>

        <textarea 
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          placeholder="Paste your study notes or text here..."
          className="w-full h-56 bg-black/60 border-2 border-white/5 rounded-[3rem] p-10 text-lg font-medium focus:border-[#EF216A] focus:outline-none transition-all placeholder:text-gray-800 shadow-inner resize-none mb-10 text-pink-50 scrollbar-hide"
        />

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <ModeButton active={activeMode === 'teach'} onClick={() => setActiveMode('teach')} icon={<MessageCircle />} label="Ask" />
          <ModeButton active={activeMode === 'cards'} onClick={() => executeMode('cards')} icon={<Layers />} label="Cards" />
          <ModeButton active={activeMode === 'audit'} onClick={() => executeMode('audit')} icon={<ShieldAlert />} label="Quiz" />
          <ModeButton active={activeMode === 'play'} onClick={() => executeMode('play')} icon={<Zap />} label="Game" />
          <ModeButton active={activeMode === 'summary'} onClick={() => executeMode('summary')} icon={<FileText />} label="Summary" />
        </div>
      </section>

      {/* 2. Laboratory View */}
      <section className="min-h-[600px] transition-all duration-1000">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center py-40 space-y-10 animate-in fade-in zoom-in-95">
            <div className="relative">
              <div className="absolute inset-0 bg-[#EF216A] blur-3xl opacity-20 animate-pulse"></div>
              <Loader2 className="w-24 h-24 text-[#EF216A] animate-spin relative z-10" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-[12px] font-black text-white uppercase tracking-[0.8em] animate-pulse">Thinking...</p>
              <p className="text-[8px] text-gray-600 font-bold uppercase tracking-[0.4em]">Muriell is looking at your notes</p>
            </div>
          </div>
        ) : !material ? (
          <div className="h-full flex flex-col items-center justify-center py-40 text-center space-y-8 opacity-20 group">
            <Ghost className="w-24 h-24 text-gray-500 group-hover:text-[#EF216A] transition-colors" />
            <div className="space-y-2">
              <p className="text-xl font-black uppercase tracking-[0.5em] text-white">No Notes Added</p>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Add some text to start</p>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
            {/* Teach & Summary Mode */}
            {(activeMode === 'teach' || activeMode === 'summary') && (
              <div className="max-w-4xl mx-auto space-y-8">
                {activeMode === 'teach' && (
                  <div className="flex gap-4 p-2 glass rounded-[3rem] border-white/10 shadow-xl">
                    <div className="relative flex-1">
                      <input 
                        value={query} onChange={e => setQuery(e.target.value)} 
                        placeholder="Ask Muriell anything..."
                        className="w-full bg-transparent border-none rounded-3xl px-10 py-6 text-xl focus:outline-none text-white placeholder:text-gray-700"
                        onKeyPress={e => e.key === 'Enter' && handleTeach()}
                      />
                      <button 
                        onClick={toggleVoiceInput}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-2xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-white/5 text-gray-500'}`}
                      >
                        <Mic className="w-6 h-6" />
                      </button>
                    </div>
                    <button 
                      onClick={handleTeach} 
                      className="px-12 bg-[#EF216A] text-white rounded-[2.5rem] font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(239,33,106,0.3)] hover:scale-105 transition-all"
                    >
                      Ask
                    </button>
                  </div>
                )}
                {explanation && (
                  <div className="glass p-12 md:p-16 rounded-[4rem] border-white/10 italic text-2xl leading-relaxed text-pink-50 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#EF216A]/40 to-transparent"></div>
                    <div className="absolute top-8 right-8 text-[#EF216A] opacity-10 group-hover:opacity-30 transition-opacity">
                      <Sparkles className="w-16 h-16" />
                    </div>
                    <div className="relative z-10 whitespace-pre-wrap font-medium">
                      {explanation}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Flashcard Mode */}
            {activeMode === 'cards' && content && (
              <div className="max-w-3xl mx-auto flex flex-col items-center space-y-10">
                <div className="flex justify-between w-full px-10 text-[10px] font-black uppercase tracking-widest text-gray-600">
                  <span className="flex items-center gap-3"><span className="text-[#EF216A]">Card</span> {cardIndex + 1} / {content.length}</span>
                  <span className="flex items-center gap-3">{masteredCards.size} <span className="text-green-500">Learned</span></span>
                </div>
                
                <div className="perspective-1000 w-full group">
                  <div 
                    onClick={() => setShowBack(!showBack)}
                    className={`w-full aspect-[16/9] relative transition-all duration-700 preserve-3d cursor-pointer ${showBack ? '[transform:rotateY(180deg)]' : ''}`}
                  >
                    {/* Front */}
                    <div className="absolute inset-0 backface-hidden glass rounded-[4rem] border-[#EF216A]/20 flex flex-col items-center justify-center p-16 text-center shadow-2xl overflow-hidden">
                       <h3 className="text-3xl md:text-5xl font-black text-white italic drop-shadow-md">{content[cardIndex].front}</h3>
                       <p className="absolute bottom-10 text-[10px] font-bold text-gray-700 uppercase tracking-widest">Tap to see answer</p>
                    </div>
                    {/* Back */}
                    <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] glass-pink rounded-[4rem] border-[#EF216A]/40 flex flex-col items-center justify-center p-16 text-center shadow-2xl overflow-hidden">
                       <p className="text-2xl md:text-3xl font-black text-pink-50 leading-relaxed italic">{content[cardIndex].back}</p>
                       <p className="absolute bottom-10 text-[10px] font-bold text-pink-900 uppercase tracking-widest">Tap to hide</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 w-full px-4">
                  <button onClick={() => { setCardIndex(Math.max(0, cardIndex - 1)); setShowBack(false); }} className="p-6 glass rounded-3xl font-black uppercase tracking-widest text-xs text-white hover:bg-white/5 transition-all flex items-center gap-3">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button 
                    onClick={() => setMasteredCards(prev => {
                      const next = new Set(prev);
                      if (next.has(cardIndex)) next.delete(cardIndex); else next.add(cardIndex);
                      return next;
                    })}
                    className={`flex-1 py-6 rounded-3xl font-black uppercase tracking-widest text-xs transition-all border-2 ${masteredCards.has(cardIndex) ? 'bg-green-500 border-green-500 text-white shadow-[0_0_20px_#22C55E]' : 'glass text-gray-500 border-white/10'}`}
                  >
                    {masteredCards.has(cardIndex) ? 'Learned!' : 'Mark as Learned'}
                  </button>
                  <button onClick={() => { setCardIndex((cardIndex + 1) % content.length); setShowBack(false); }} className="p-6 bg-[#EF216A] text-white rounded-3xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all flex items-center gap-3 shadow-lg">
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Exam Mode */}
            {activeMode === 'audit' && content && (
              <div className="max-w-4xl mx-auto space-y-10">
                {!examResult ? (
                  <div className="space-y-10">
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-gradient-to-r from-[#EF216A] to-pink-400 transition-all duration-1000 shadow-[0_0_20px_#EF216A]" style={{ width: `${((examIndex + 1) / content.length) * 100}%` }}></div>
                    </div>
                    
                    <div className="glass p-12 md:p-16 rounded-[4rem] border-white/5 space-y-10 shadow-2xl relative">
                      <div className="flex items-center gap-4 text-[#EF216A] text-[10px] font-black uppercase tracking-[0.4em]">
                        <Target className="w-4 h-4" /> Question {examIndex + 1}
                      </div>
                      <p className="text-3xl md:text-5xl font-black text-white italic leading-[1.1] relative z-10">{content[examIndex].question}</p>
                      <div className="grid gap-4 relative z-10">
                        {content[examIndex].options.map((opt: string, i: number) => (
                          <button 
                            key={i}
                            onClick={() => setExamAnswers({ ...examAnswers, [examIndex]: opt })}
                            className={`text-left px-10 py-8 rounded-[2.5rem] transition-all border-2 text-xl font-bold group flex items-center justify-between ${examAnswers[examIndex] === opt ? 'bg-[#EF216A] border-[#EF216A] text-white shadow-2xl scale-[1.02]' : 'glass border-white/5 text-gray-500 hover:border-white/20'}`}
                          >
                            <span>{opt}</span>
                            <div className={`w-6 h-6 rounded-full border-2 transition-all ${examAnswers[examIndex] === opt ? 'bg-white border-white scale-125' : 'border-gray-800'}`}></div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center px-10">
                      <button 
                        onClick={() => setExamIndex(Math.max(0, examIndex - 1))}
                        className={`flex items-center gap-4 text-xs font-black uppercase tracking-widest text-gray-600 transition-all hover:text-white ${examIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                      >
                        <ChevronLeft className="w-5 h-5" /> Back
                      </button>
                      
                      {examIndex === content.length - 1 ? (
                        <button onClick={submitExam} className="px-16 py-8 bg-white text-black rounded-full font-black uppercase tracking-[0.4em] text-xs shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:scale-105 transition-all">Submit Quiz</button>
                      ) : (
                        <button 
                          onClick={() => setExamIndex(Math.min(content.length - 1, examIndex + 1))}
                          className="flex items-center gap-4 text-xs font-black uppercase tracking-[0.4em] text-[#EF216A] transition-all hover:scale-105"
                        >
                          Next <ChevronRight className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="glass p-20 rounded-[5rem] border-white/10 text-center space-y-12 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden animate-in zoom-in-95">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#EF216A]/10 via-transparent to-transparent"></div>
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-[#EF216A]/30 blur-3xl rounded-full scale-150 animate-pulse"></div>
                      <Award className="w-40 h-40 text-[#EF216A] relative z-10 mx-auto drop-shadow-2xl" />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-white">Quiz Done</h3>
                      <div className="flex justify-center items-center gap-8">
                        <div className="h-px bg-white/10 flex-1"></div>
                        <p className="text-pink-500 font-black uppercase tracking-[0.6em] text-xs">Score: {Math.round((examResult.score / examResult.total) * 100)}%</p>
                        <div className="h-px bg-white/10 flex-1"></div>
                      </div>
                    </div>
                    <div className="text-4xl md:text-5xl font-black text-white italic">
                      {examResult.score} <span className="text-gray-700 mx-2">/</span> {examResult.total}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                       <button onClick={() => executeMode('audit')} className="px-12 py-7 bg-[#EF216A] text-white rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl">Try Again</button>
                       <button onClick={() => setActiveMode('teach')} className="px-12 py-7 glass rounded-full font-black uppercase tracking-widest text-xs text-white hover:bg-white/5 transition-all">Close</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Simulation Game Mode */}
            {activeMode === 'play' && content && (
              <div className="max-w-3xl mx-auto space-y-10">
                <div className="flex items-center justify-between px-10">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-xl">
                      <Dumbbell className="w-6 h-6 text-amber-500" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.4em] text-gray-500">True or False</span>
                  </div>
                  <div className="text-3xl font-black text-white italic drop-shadow-md">Score: {gameState.score}</div>
                </div>

                <div className="glass p-16 md:p-24 rounded-[4rem] border-white/5 text-center space-y-12 shadow-2xl min-h-[500px] flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,33,106,0.05)_0%,transparent_70%)]"></div>
                  <p className="text-4xl md:text-5xl font-black italic text-pink-50 leading-tight relative z-10">"{content[gameState.index].statement}"</p>
                  
                  {!gameState.showCorrection ? (
                    <div className="flex flex-col sm:flex-row gap-6 relative z-10">
                      <button 
                        onClick={() => {
                          const correct = content[gameState.index].isTrue === true;
                          setGameState(prev => ({ ...prev, score: correct ? prev.score + 100 : Math.max(0, prev.score - 50), showCorrection: true }));
                        }}
                        className="flex-1 py-8 bg-green-500/10 border-2 border-green-500/30 text-green-500 font-black rounded-[2.5rem] hover:bg-green-500/20 transition-all uppercase tracking-[0.3em] text-xs shadow-lg"
                      >
                        True
                      </button>
                      <button 
                        onClick={() => {
                          const correct = content[gameState.index].isTrue === false;
                          setGameState(prev => ({ ...prev, score: correct ? prev.score + 100 : Math.max(0, prev.score - 50), showCorrection: true }));
                        }}
                        className="flex-1 py-8 bg-red-500/10 border-2 border-red-500/30 text-red-500 font-black rounded-[2.5rem] hover:bg-red-500/20 transition-all uppercase tracking-[0.3em] text-xs shadow-lg"
                      >
                        False
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-10 animate-in zoom-in-95 duration-500 relative z-10">
                      <div className="p-10 glass-pink rounded-[3rem] border-pink-500/20 italic text-2xl text-pink-100 font-medium">
                        {content[gameState.index].correction}
                      </div>
                      <button 
                        onClick={() => {
                          if (gameState.index < content.length - 1) {
                            setGameState(prev => ({ ...prev, index: prev.index + 1, showCorrection: false }));
                          } else {
                            speakWithMuriell("Game over. Nice work.");
                            executeMode('play');
                          }
                        }}
                        className="w-full py-8 bg-[#EF216A] text-white font-black rounded-full uppercase tracking-[0.4em] text-xs shadow-2xl hover:scale-105 transition-all"
                      >
                        Next Question
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
      
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

const ModeButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`p-6 md:p-8 rounded-[2.5rem] border-2 transition-all duration-700 flex flex-col items-center justify-center gap-4 group ${
      active 
      ? `bg-[#EF216A] border-[#EF216A] text-white shadow-[0_0_40px_rgba(239,33,106,0.4)] scale-110 z-20` 
      : 'glass border-white/5 text-gray-500 hover:border-white/20 hover:bg-white/5'
    }`}
  >
    <div className={`transition-all duration-500 group-hover:scale-125 ${active ? 'text-white' : 'text-gray-600'}`}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: 'w-7 h-7' }) : icon}
    </div>
    <span className="text-[10px] font-black uppercase tracking-[0.3em]">{label}</span>
  </button>
);

export default StudyCompanion;
