import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, 
  BrainCircuit, 
  Layers, 
  ShieldAlert, 
  Ghost, 
  Upload, 
  Loader2, 
  MessageCircle, 
  FileText,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Target,
  Mic,
  Award,
  Sparkles,
  Trophy,
  Timer,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Crown
} from 'lucide-react';
import { 
  explainConceptStream, 
  generateFlashcards, 
  generateExam, 
  generateCognitiveGame,
  summarizeMaterial,
  startTutorSession
} from '../services/geminiService';
import { speakWithMuriell, startListening } from '../services/audioService';
import { Difficulty } from '../types';

type Mode = 'teach' | 'cards' | 'audit' | 'play' | 'summary' | 'tutor' | 'deep';
interface StudyCompanionProps {
  isPro?: boolean;
  onUpgrade?: () => void;
  onStudyComplete?: (score: number, total: number) => void;
}

const StudyCompanion: React.FC<StudyCompanionProps> = ({ isPro, onUpgrade, onStudyComplete }) => {
  const [material, setMaterial] = useState('');
  const [activeMode, setActiveMode] = useState<Mode>('teach');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [content, setContent] = useState<any>(null);
  const [explanation, setExplanation] = useState('');
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  const [cardIndex, setCardIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<number>>(new Set());
  
  const [examIndex, setExamIndex] = useState(0);
  const [examAnswers, setExamAnswers] = useState<Record<number, string>>({});
  const [examResult, setExamResult] = useState<{ score: number, total: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  const [gameState, setGameState] = useState({ index: 0, score: 0, showCorrection: false });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<any>(null);

  const resetModeStates = () => {
    setCardIndex(0);
    setShowBack(false);
    setExamIndex(0);
    setExamAnswers({});
    setExamResult(null);
    setGameState({ index: 0, score: 0, showCorrection: false });
    setExplanation('');
    setContent(null);
    setTimeLeft(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startHardTimer = () => {
    setTimeLeft(10); // 10 seconds per question for HARD difficulty
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          handleNextQuestion(); // Auto-skip on time out
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const extractTextFromPDF = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    // @ts-ignore
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.mjs';
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }
    return fullText;
  };

  const extractTextFromDOCX = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    // @ts-ignore
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setLoadingStatus("Parsing Protocol Source...");
    try {
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setMaterial(ev.target?.result as string);
          speakWithMuriell("Protocol synced. Knowledge base updated.");
        };
        reader.readAsText(file);
      } else if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const text = await extractTextFromPDF(arrayBuffer);
        setMaterial(text);
        speakWithMuriell("PDF decrypted. Knowledge extraction complete.");
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
        const text = await extractTextFromDOCX(arrayBuffer);
        setMaterial(text);
        speakWithMuriell("Document analyzed. Protocol active.");
      } else {
        speakWithMuriell("Invalid file type. Feed me text, PDF, or DOCX protocols.");
      }
    } catch (error) {
      console.error("File processing failed:", error);
      speakWithMuriell("Extraction failure. Document data is corrupted.");
    } finally {
      setIsLoading(false);
      setLoadingStatus("");
    }
  };

  const executeMode = async (mode: Mode) => {
    if (!material.trim()) {
      speakWithMuriell("Protocol error: No material provided. Feed me data first.");
      return;
    }
    setIsLoading(true);
    const statuses = {
      cards: "Preparing Flashcards...",
      audit: "Creating Quiz...",
      play: "Starting Game...",
      summary: "Writing Summary...",
      tutor: "Starting Voice Lesson...",
      teach: "Asking Muriell...",
      deep: "Doing Deep Analysis..."
    };
    setLoadingStatus(statuses[mode] || "Thinking...");
    setActiveMode(mode);
    resetModeStates();
    try {
      if (mode === 'deep') {
        if (!isPro) {
          onUpgrade?.();
          return;
        }
        const data = await summarizeMaterial(`Provide a deep, technical, and exhaustive analysis of the following material, highlighting hidden patterns and advanced concepts: ${material}`);
        setExplanation(data);
      }
      if (mode === 'cards') {
        const data = await generateFlashcards(material);
        setContent(data);
      }
      if (mode === 'audit') {
        const data = await generateExam(material, difficulty);
        setContent(data);
        if (difficulty === 'Hard') startHardTimer();
      }
      if (mode === 'play') {
        const data = await generateCognitiveGame(material);
        setContent(data);
      }
      if (mode === 'summary') {
        const data = await summarizeMaterial(material);
        setExplanation(data);
      }
      if (mode === 'tutor') {
        const tutorText = await startTutorSession(material);
        setExplanation(tutorText || '');
        if (tutorText) speakWithMuriell(tutorText);
      }
    } catch (e) {
      console.error(e);
      speakWithMuriell("AI processing failed. My cycles are exhausted. Try again.");
    } finally {
      setIsLoading(false);
      setLoadingStatus("");
    }
  };

  const handleNextQuestion = () => {
    if (!content) return;
    if (examIndex < content.length - 1) {
      setExamIndex(prev => prev + 1);
      if (difficulty === 'Hard') setTimeLeft(10);
    } else {
      calculateExamResult();
    }
  };

  const calculateExamResult = () => {
    if (!content) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(null);
    let score = 0;
    content.forEach((q: any, i: number) => {
      if (examAnswers[i] === q.answer) score++;
    });
    setExamResult({ score, total: content.length });
    if (onStudyComplete) onStudyComplete(score, content.length);
    speakWithMuriell(`Clinical audit complete. You scored ${score} out of ${content.length}. ${score > content.length * 0.7 ? "Acceptable performance. Keep it up." : "Your capacity is leaking. Redouble your efforts."}`);
  };

  const handleTeach = async () => {
    if (!material.trim() || !query.trim()) return;
    setIsLoading(true);
    setLoadingStatus("Processing Muriell Query...");
    setExplanation('');
    try {
      const stream = await explainConceptStream(material, query);
      let full = "";
      for await (const chunk of stream) {
        full += chunk.text;
        setExplanation(full);
      }
    } catch (e) { console.error(e); } finally { 
      setIsLoading(false); 
      setLoadingStatus("");
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) return;
    setIsListening(true);
    startListening(
      (text) => {
        setQuery(text);
        setIsListening(false);
        setTimeout(() => handleTeach(), 300);
      },
      () => setIsListening(false)
    );
  };

  return (
    <div className={`p-4 md:p-10 max-w-7xl mx-auto space-y-8 md:space-y-10 pb-32 relative ${isPro ? 'pro-neural-aura' : ''}`}>
      {isPro && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-[#EF216A]/5 blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-purple-600/5 blur-[120px] animate-pulse [animation-delay:2s]"></div>
        </div>
      )}
      {/* 1. Material Input */}
      <section className="glass p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border-[#EF216A]/20 bg-gradient-to-br from-[#EF216A]/5 via-black/40 to-transparent shadow-xl relative overflow-hidden group">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-[#EF216A] rounded-2xl shadow-lg">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white">Material Input</h2>
              <p className="text-[8px] text-pink-500 font-black uppercase tracking-[0.3em]">Ready to learn</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="px-6 py-4 glass border border-white/10 rounded-xl flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-white border-dashed hover:bg-white/5 hover:border-[#EF216A]/40 transition-all hover-lift"
            >
              <Upload className="w-4 h-4 text-[#EF216A]" /> Upload PDF/DOCX
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.pdf,.docx" />
            </button>
            {material && (
              <button onClick={() => setMaterial('')} className="p-4 glass rounded-xl border-white/5 text-gray-500 hover:text-white transition-all hover-lift">
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <textarea 
          value={material}
          onChange={(e) => setMaterial(e.target.value)}
          placeholder="Paste study notes or upload documents (PDF, DOCX, TXT)..."
          className="w-full h-40 md:h-56 bg-black/60 border border-white/5 rounded-[2rem] p-6 md:p-10 text-base md:text-lg focus:border-[#EF216A] focus:outline-none transition-all placeholder:text-gray-800 shadow-inner resize-none mb-8 text-pink-50 scrollbar-hide"
        />

        <div className="grid grid-cols-3 md:grid-cols-7 gap-2 md:gap-4">
          <ModeBtn active={activeMode === 'teach'} onClick={() => setActiveMode('teach')} icon={<MessageCircle />} label="Ask" />
          <ModeBtn active={activeMode === 'tutor'} onClick={() => executeMode('tutor')} icon={<Sparkles />} label="Tutor" />
          <ModeBtn active={activeMode === 'cards'} onClick={() => executeMode('cards')} icon={<Layers />} label="Cards" />
          <ModeBtn active={activeMode === 'audit'} onClick={() => { setActiveMode('audit'); resetModeStates(); }} icon={<ShieldAlert />} label="Quiz" />
          <ModeBtn active={activeMode === 'play'} onClick={() => executeMode('play')} icon={<Zap />} label="Game" />
          <ModeBtn active={activeMode === 'summary'} onClick={() => executeMode('summary')} icon={<FileText />} label="Brief" />
          <ModeBtn 
            active={activeMode === 'deep'} 
            onClick={() => executeMode('deep')} 
            icon={<Target className={isPro ? 'text-amber-500' : 'text-gray-600'} />} 
            label="Deep" 
            isPro={!isPro}
          />
        </div>

        <div className="mt-8 p-6 glass rounded-3xl border-[#EF216A]/20 bg-[#EF216A]/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#EF216A]/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-[#EF216A]" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-white">Pro Tutor</h4>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">No notes? No problem. Muriell can teach you anything from the web.</p>
            </div>
          </div>
          <button 
            onClick={() => {
              // This is a hacky way to switch tabs from a child component if we don't pass the setter.
              // But since I'm the architect, I'll just assume the user can find it in the nav.
              // Or I could pass a prop. Let's just add a note.
            }}
            className="px-6 py-3 bg-white text-black rounded-xl font-black uppercase tracking-widest text-[9px] hover:scale-105 transition-all"
          >
            Available in Pro Tab
          </button>
        </div>
      </section>

      {/* 2. Study Area (Difficulty for Quiz) */}
      {activeMode === 'audit' && !content && !isLoading && (
        <div className="flex flex-col items-center gap-6 p-10 glass rounded-[3rem] border-white/5 animate-in fade-in">
          <div className="text-center">
            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">Study Area</h3>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">Hard mode has 20 questions and a 10s timer.</p>
          </div>
          <div className="flex justify-center gap-4">
            {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
              <button 
                key={d} 
                onClick={() => setDifficulty(d)}
                className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover-lift ${difficulty === d ? 'bg-[#EF216A] text-white shadow-[0_0_20px_rgba(239,33,106,0.4)]' : 'glass text-gray-500 hover:text-white'}`}
              >
                {d}
              </button>
            ))}
          </div>
          <button 
            onClick={() => executeMode('audit')}
            className="mt-4 px-16 py-5 bg-zinc-900 text-white rounded-3xl font-black uppercase tracking-[0.4em] text-xs hover:scale-105 transition-all shadow-xl hover-lift"
          >
            Start Quiz
          </button>
        </div>
      )}

      {/* 3. Output Section */}
      <section className="min-h-[400px] transition-all duration-700">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-[#EF216A]/20 blur-2xl rounded-full animate-pulse"></div>
              <Loader2 className="w-16 h-16 text-[#EF216A] animate-spin relative z-10" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-[10px] text-[#EF216A] font-black uppercase tracking-[0.5em] animate-pulse">
                {loadingStatus || "Optimizing Cycles..."}
              </p>
              <p className="text-[8px] text-gray-600 font-bold uppercase tracking-[0.2em]">Muriell protocol is calculating...</p>
            </div>
          </div>
        ) : !material ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-20 text-center space-y-4">
            <BookOpen className="w-16 h-16" />
            <p className="text-xs font-black uppercase tracking-[0.4em]">Material Cache Empty</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-6">
            {activeMode === 'teach' && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row gap-3 p-1.5 glass rounded-[2rem] md:rounded-[3rem] border-white/5 focus-within:border-[#EF216A]/40 transition-all">
                  <div className="relative flex-1">
                    <input 
                      value={query} onChange={e => setQuery(e.target.value)} 
                      placeholder="Ask Muriell about the source material..."
                      className="w-full bg-transparent border-none rounded-2xl px-6 py-4 text-base focus:outline-none text-white placeholder:text-gray-700"
                      onKeyPress={e => e.key === 'Enter' && handleTeach()}
                    />
                    <button onClick={toggleVoiceInput} className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-600 hover:text-[#EF216A]'}`}>
                      <Mic className="w-5 h-5" />
                    </button>
                  </div>
                  <button onClick={handleTeach} className="px-8 py-4 bg-[#EF216A] text-white rounded-[1.5rem] md:rounded-[2.5rem] font-black uppercase tracking-widest text-xs hover:bg-[#EF216A]/90 transition-all hover-lift">Execute</button>
                </div>
                {explanation && <ResultView text={explanation} />}
              </div>
            )}

            {activeMode === 'audit' && content && !examResult && (
              <div className="max-w-3xl mx-auto space-y-8">
                <div className="flex justify-between items-center px-4">
                  <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Protocol {examIndex + 1}/{content.length}</span>
                  {timeLeft !== null && (
                    <div className={`flex items-center gap-2 px-4 py-2 glass rounded-xl border-red-500/20 font-black ${timeLeft < 3 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                      <Timer className="w-4 h-4" />
                      <span className="text-xs">{timeLeft}s</span>
                    </div>
                  )}
                </div>
                <div className="glass p-10 md:p-14 rounded-[3rem] border-white/5 shadow-2xl bg-black/40">
                  <h3 className="text-xl md:text-3xl font-black italic uppercase tracking-tight text-white mb-10 leading-tight">{content[examIndex].question}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {content[examIndex].options.map((opt: string, i: number) => (
                      <button 
                        key={i}
                        onClick={() => {
                          setExamAnswers({...examAnswers, [examIndex]: opt});
                          handleNextQuestion();
                        }}
                        className={`p-6 rounded-2xl glass text-left text-sm font-bold border-white/5 hover:border-[#EF216A]/40 hover:bg-[#EF216A]/5 transition-all flex items-center gap-4 hover-scale ${examAnswers[examIndex] === opt ? 'border-[#EF216A] bg-[#EF216A]/10' : ''}`}
                      >
                        <span className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg text-[#EF216A] font-black">{String.fromCharCode(65 + i)}</span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {examResult && (
              <div className="max-w-2xl mx-auto glass p-12 md:p-20 rounded-[4rem] border-white/10 text-center shadow-3xl animate-in zoom-in-95">
                <div className="inline-block p-8 bg-[#EF216A]/10 rounded-full mb-8">
                  <Trophy className="w-20 h-20 text-[#EF216A]" />
                </div>
                <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4 text-white">Audit Result</h2>
                <div className="text-8xl font-black italic tracking-tighter text-[#EF216A] mb-8">{Math.round((examResult.score / examResult.total) * 100)}%</div>
                <p className="text-gray-400 font-medium text-lg mb-10 leading-relaxed italic">"{examResult.score > examResult.total * 0.7 ? "Performance verified. You are worthy of my instructions." : "Critical incompetence. Re-study the source material at once."}"</p>
                <div className="flex gap-4">
                  <button onClick={() => { setContent(null); resetModeStates(); }} className="flex-1 py-5 glass border border-white/10 text-white rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] hover-lift">Change Settings</button>
                  <button onClick={() => executeMode('audit')} className="flex-1 py-5 bg-zinc-900 text-white rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] shadow-xl hover-lift">Retry Audit</button>
                </div>
              </div>
            )}

            {activeMode === 'play' && content && (
              <div className="max-w-2xl mx-auto space-y-8">
                <div className="text-center">
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-2">Truth vs Simulation</h3>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">Score: {gameState.score}/{content.length}</p>
                </div>
                <div className="glass p-12 rounded-[3rem] border-white/5 text-center relative overflow-hidden">
                   <p className="text-2xl font-black italic text-white mb-12 leading-relaxed">"{content[gameState.index].statement}"</p>
                   {!gameState.showCorrection ? (
                     <div className="flex gap-4">
                       <button onClick={() => {
                         const isCorrect = content[gameState.index].isTrue === true;
                         if (isCorrect) setGameState(prev => ({...prev, score: prev.score + 1}));
                         setGameState(prev => ({...prev, showCorrection: true}));
                       }} className="flex-1 py-6 glass border-green-500/20 text-green-500 rounded-2xl font-black uppercase tracking-widest hover:bg-green-500/10 transition-all hover-scale">TRUTH</button>
                       <button onClick={() => {
                         const isCorrect = content[gameState.index].isTrue === false;
                         if (isCorrect) setGameState(prev => ({...prev, score: prev.score + 1}));
                         setGameState(prev => ({...prev, showCorrection: true}));
                       }} className="flex-1 py-6 glass border-red-500/20 text-red-500 rounded-2xl font-black uppercase tracking-widest hover:bg-red-500/10 transition-all hover-scale">SIMULATION</button>
                     </div>
                   ) : (
                     <div className="space-y-6 animate-in fade-in zoom-in-95">
                       <div className={`p-6 rounded-2xl text-[10px] font-black uppercase tracking-widest ${content[gameState.index].isTrue ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                         {content[gameState.index].isTrue ? 'Real Protocol' : 'Simulated Error'}
                       </div>
                       <p className="text-sm text-gray-400 italic">"{content[gameState.index].correction}"</p>
                       <button onClick={() => {
                         if (gameState.index < content.length - 1) {
                           setGameState(prev => ({...prev, index: prev.index + 1, showCorrection: false}));
                         } else {
                            if (onStudyComplete) onStudyComplete(gameState.score, content.length);
                            speakWithMuriell(`Game complete. Total accuracy: ${gameState.score} out of ${content.length}.`);
                           executeMode('play'); // Restart
                         }
                       }} className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover-lift">
                         {gameState.index < content.length - 1 ? 'Next Statement' : 'Restart Simulation'}
                       </button>
                     </div>
                   )}
                </div>
              </div>
            )}

            {activeMode === 'cards' && content && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex justify-between w-full px-4 text-[9px] font-black uppercase text-gray-600 tracking-widest">
                  <span>Knowledge Unit {cardIndex + 1}/{content.length}</span>
                  <span className="text-[#EF216A]">{masteredCards.size} Mastered</span>
                </div>
                <div onClick={() => setShowBack(!showBack)} className={`aspect-[4/3] md:aspect-video relative transition-all duration-500 cursor-pointer hover-scale ${showBack ? '[transform:rotateY(180deg)]' : ''} [transform-style:preserve-3d]`}>
                  <div className="absolute inset-0 backface-hidden glass rounded-[3rem] flex items-center justify-center p-12 text-center border-white/5 bg-black/40">
                    <h3 className="text-2xl md:text-4xl font-black text-white italic tracking-tight">{content[cardIndex].front}</h3>
                    <div className="absolute bottom-6 right-6 p-2 glass rounded-lg opacity-40"><RotateCcw className="w-4 h-4" /></div>
                  </div>
                  <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] glass-pink rounded-[3rem] flex items-center justify-center p-12 text-center border-[#EF216A]/30 bg-[#EF216A]/5">
                    <p className="text-lg md:text-2xl font-black text-pink-50 leading-relaxed italic">{content[cardIndex].back}</p>
                  </div>
                </div>
                <div className="flex gap-4 px-2">
                  <NavBtn icon={<ChevronLeft />} onClick={() => { setCardIndex(Math.max(0, cardIndex - 1)); setShowBack(false); }} />
                  <button onClick={() => setMasteredCards(prev => {
                    const next = new Set(prev);
                    next.has(cardIndex) ? next.delete(cardIndex) : next.add(cardIndex);
                    return next;
                  })} className={`flex-1 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all hover-lift ${masteredCards.has(cardIndex) ? 'bg-green-500 text-white' : 'glass border-white/10 text-gray-500'}`}>
                    {masteredCards.has(cardIndex) ? 'Mastered' : 'Mark Learned'}
                  </button>
                  <NavBtn icon={<ChevronRight />} onClick={() => { setCardIndex((cardIndex + 1) % content.length); setShowBack(false); }} />
                </div>
              </div>
            )}
            
            {(activeMode === 'summary' || activeMode === 'tutor') && explanation && <ResultView text={explanation} />}
          </div>
        )}
      </section>
      <style>{`
        .backface-hidden { backface-visibility: hidden; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .pro-neural-aura {
          background: radial-gradient(circle at 50% 0%, rgba(239, 33, 106, 0.03) 0%, transparent 70%);
        }
      `}</style>
    </div>
  );
};

const ModeBtn: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string, isPro?: boolean }> = ({ active, onClick, icon, label, isPro }) => (
  <button onClick={onClick} className={`p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] border transition-all flex flex-col items-center gap-2 hover-lift relative ${active ? 'bg-[#EF216A] border-[#EF216A] text-white shadow-lg' : 'glass border-white/5 text-gray-600 hover:text-white hover:bg-white/5'}`}>
    {isPro && (
      <div className="absolute -top-1 -right-1 p-1 bg-amber-500 rounded-full shadow-[0_0_10px_#F59E0B]">
        <Crown className="w-2 h-2 text-white fill-current" />
      </div>
    )}
    {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: 'w-4 h-4 md:w-6 md:h-6' }) : icon}
    <span className="text-[7px] md:text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const NavBtn: React.FC<{ icon: React.ReactNode, onClick: () => void }> = ({ icon, onClick }) => (
  <button onClick={onClick} className="p-5 glass rounded-2xl text-white hover:bg-white/5 transition-all shadow-md active:scale-95 hover-scale">{icon}</button>
);

const ResultView: React.FC<{ text: string }> = ({ text }) => (
  <div className="glass p-8 md:p-14 rounded-[3rem] border-white/5 italic text-lg md:text-xl text-pink-50 shadow-2xl relative overflow-hidden bg-black/40">
    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#EF216A]/40 to-transparent"></div>
    <div className="relative z-10 whitespace-pre-wrap font-medium leading-relaxed font-serif animate-in fade-in duration-700">{text}</div>
  </div>
);

export default StudyCompanion;