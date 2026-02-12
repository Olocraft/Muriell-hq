
import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Target, 
  ChevronRight, 
  ChevronLeft, 
  Calendar,
  Ghost,
  Sparkles,
  Loader2,
  CheckCircle,
  Mic,
  Volume2,
  VolumeX,
  Keyboard
} from 'lucide-react';
import { generateRoutine, getPlanningGuidance } from '../services/geminiService';
import { speakWithMuriell, startListening } from '../services/audioService';

const MonthlyPlanner: React.FC = () => {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [inputMethod, setInputMethod] = useState<'text' | 'voice'>('text');
  
  const [routine, setRoutine] = useState<string | null>(null);
  const [advice, setAdvice] = useState<string>("What are we working on? Tell me your goals.");
  
  const [data, setData] = useState({
    longTermGoals: '',
    shortTermGoals: '',
    obligations: '',
    weakHabits: '',
    intensity: 'Moderate'
  });

  const handleNext = () => setStep(s => Math.min(s + 1, 5));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const getCurrentInput = () => {
    switch(step) {
      case 1: return data.longTermGoals;
      case 2: return data.shortTermGoals;
      case 3: return data.obligations;
      case 4: return data.weakHabits;
      default: return "";
    }
  };

  const setStepData = (val: string) => {
    if (step === 1) setData({...data, longTermGoals: val});
    if (step === 2) setData({...data, shortTermGoals: val});
    if (step === 3) setData({...data, obligations: val});
    if (step === 4) setData({...data, weakHabits: val});
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      const input = getCurrentInput();
      if (input.trim().length > 5 && step < 5) {
        setIsAdviceLoading(true);
        try {
          const res = await getPlanningGuidance(step, input);
          setAdvice(res || advice);
          if (autoSpeak && res) {
            speakWithMuriell(res);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsAdviceLoading(false);
        }
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [step, getCurrentInput(), autoSpeak]);

  const handleFinalize = async () => {
    setIsGenerating(true);
    try {
      const result = await generateRoutine(
        `Main Goal: ${data.longTermGoals}. Monthly: ${data.shortTermGoals}. Bad Habits: ${data.weakHabits}`,
        `Time/Schedule: ${data.obligations}. Focus: ${data.intensity}`
      );
      setRoutine(result);
      speakWithMuriell("I've made a plan for you. Stick to it.");
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDictate = () => {
    if (isListening) return;
    setIsListening(true);
    startListening(
      (text) => setStepData(getCurrentInput() + " " + text),
      () => setIsListening(false)
    );
  };

  if (routine) {
    return (
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        <div className="glass p-8 rounded-[3rem] border-[#EF216A]/20">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-[#EF216A] rounded-2xl shadow-xl">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Your Plan</h2>
                <p className="text-[10px] text-pink-500 font-black uppercase tracking-widest">Active now</p>
              </div>
            </div>
            <button onClick={() => speakWithMuriell(routine)} className="p-4 glass rounded-2xl text-[#EF216A] hover:bg-[#EF216A]/10 transition-all border-[#EF216A]/20">
              <Volume2 className="w-6 h-6" />
            </button>
          </div>
          <div className="bg-black/40 p-8 rounded-[2rem] border border-white/5 text-pink-50 leading-relaxed whitespace-pre-wrap font-medium text-sm shadow-inner">
            {routine}
          </div>
          <button 
            onClick={() => setRoutine(null)}
            className="w-full mt-8 py-5 bg-[#EF216A] rounded-2xl font-black uppercase tracking-[0.3em] text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(239,33,106,0.4)]"
          >
            Change Plan
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    { title: "Long Term", desc: "What's your big goal for the year?", placeholder: "Ex: Learn coding, Get a new job..." },
    { title: "This Month", desc: "What's the main focus right now?", placeholder: "Ex: Finish my project..." },
    { title: "Your Schedule", desc: "When are you busy?", placeholder: "Ex: Work 9-5, School on Fridays..." },
    { title: "Obstacles", desc: "What distracts you most?", placeholder: "Ex: Social media, Gaming..." }
  ];

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Input Section */}
      <div className="lg:col-span-8 glass p-6 md:p-12 rounded-[3.5rem] border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5">
          <div className="h-full bg-[#EF216A] transition-all duration-700 shadow-[0_0_15px_#EF216A]" style={{ width: `${(step / 5) * 100}%` }} />
        </div>

        <div className="flex justify-end mb-8 gap-3">
          <button 
            onClick={() => setInputMethod('text')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inputMethod === 'text' ? 'bg-[#EF216A] text-white shadow-lg' : 'bg-white/5 text-gray-500'}`}
          >
            <Keyboard className="w-3.5 h-3.5" /> Type
          </button>
          <button 
            onClick={() => setInputMethod('voice')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inputMethod === 'voice' ? 'bg-[#EF216A] text-white shadow-lg' : 'bg-white/5 text-gray-500'}`}
          >
            <Mic className="w-3.5 h-3.5" /> Voice
          </button>
        </div>

        {step <= 4 ? (
          <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex items-center justify-center bg-[#EF216A]/10 text-[#EF216A] font-black rounded-2xl border border-[#EF216A]/20 text-xl shadow-lg">0{step}</div>
                <h3 className="text-3xl font-black italic uppercase tracking-tight text-white">{steps[step-1].title}</h3>
              </div>
            </div>
            <p className="text-gray-400 text-base font-medium">{steps[step-1].desc}</p>
            
            {inputMethod === 'voice' ? (
              <div className="flex flex-col items-center justify-center h-48 bg-black/40 border-2 border-white/5 border-dashed rounded-[2.5rem] p-8 text-center group">
                <button 
                  onClick={handleDictate}
                  className={`p-10 rounded-full transition-all duration-500 ${isListening ? 'bg-red-500 shadow-[0_0_40px_rgba(239,33,106,0.6)] animate-pulse' : 'bg-[#EF216A]/10 hover:bg-[#EF216A]/20'}`}
                >
                  <Mic className={`w-12 h-12 ${isListening ? 'text-white' : 'text-[#EF216A]'}`} />
                </button>
                <p className={`mt-6 text-sm font-bold tracking-tight transition-all ${isListening ? 'text-red-400' : 'text-gray-500'}`}>
                  {isListening ? "Listening..." : "Tap to speak"}
                </p>
                {getCurrentInput() && (
                  <div className="mt-4 p-4 bg-white/5 rounded-2xl text-xs text-pink-100 italic border border-white/5 w-full">
                    "{getCurrentInput()}"
                  </div>
                )}
              </div>
            ) : (
              <textarea 
                value={getCurrentInput()}
                onChange={e => setStepData(e.target.value)}
                placeholder={steps[step-1].placeholder}
                className="w-full h-48 bg-black/40 border-2 border-white/5 rounded-[2.5rem] p-8 text-lg font-medium focus:border-[#EF216A] focus:outline-none transition-all placeholder:text-gray-800 shadow-inner"
              />
            )}
          </div>
        ) : (
          <div className="text-center space-y-8 animate-in zoom-in-95 duration-500 py-10">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-[#EF216A]/20 blur-3xl rounded-full"></div>
              <CheckCircle className="w-24 h-24 text-[#EF216A] mx-auto relative z-10" />
            </div>
            <h3 className="text-4xl font-black italic uppercase tracking-tighter">Save your plan?</h3>
            <p className="text-gray-400 max-w-sm mx-auto font-medium">I'll track your work based on these goals. How hard do you want to work?</p>
            <div className="flex gap-4 max-w-sm mx-auto">
              {['Easy', 'Medium', 'Hard'].map(lvl => (
                <button 
                  key={lvl}
                  onClick={() => setData({...data, intensity: lvl})}
                  className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${
                    data.intensity === lvl ? 'bg-[#EF216A] border-[#EF216A] text-white shadow-[0_0_20px_rgba(239,33,106,0.4)]' : 'border-white/5 text-gray-500 hover:border-white/20'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-12 pt-10 border-t border-white/5">
          <button onClick={handleBack} className={`p-5 rounded-2xl glass hover:bg-white/5 shadow-lg transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}>
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          {step < 5 ? (
            <button onClick={handleNext} className="flex-1 max-w-[240px] py-5 bg-white text-black rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-2 hover:bg-gray-200 shadow-2xl transition-all">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleFinalize} disabled={isGenerating} className="flex-1 max-w-[280px] py-5 bg-[#EF216A] text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(239,33,106,0.5)] hover:scale-105 active:scale-95 disabled:opacity-50 transition-all">
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-5 h-5" /> Save Plan</>}
            </button>
          )}
        </div>
      </div>

      {/* Advice Panel */}
      <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
        <div className="glass p-8 rounded-[3rem] border-[#EF216A]/10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#EF216A]/5 via-transparent to-transparent"></div>
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3 text-[#EF216A]">
              <Sparkles className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Advice</span>
            </div>
          </div>
          
          <div className="min-h-[120px] flex flex-col justify-center relative z-10">
            {isAdviceLoading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-[#EF216A] animate-spin" />
              </div>
            ) : (
              <p className="text-xl italic text-pink-50 leading-relaxed font-serif animate-in fade-in duration-700">"{advice}"</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyPlanner;
