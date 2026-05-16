
import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight, 
  RotateCcw, 
  Loader2, 
  Mic, 
  MessageCircle,
  Trophy,
  Target,
  Search,
  Zap,
  ExternalLink
} from 'lucide-react';
import { 
  generateSchemeOfWork, 
  getProTutorContent, 
  evaluateProExplanation 
} from '../services/geminiService';
import { speakWithMuriell, startListening } from '../services/audioService';
import { ProTutorSession, ProTutorStep } from '../types';

interface ProTutorProps {
  isPro: boolean;
  onUpgrade: () => void;
}

const ProTutor: React.FC<ProTutorProps> = ({ isPro, onUpgrade }) => {
  const [topic, setTopic] = useState('');
  const [session, setSession] = useState<ProTutorSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [currentContent, setCurrentContent] = useState('');
  const [userExplanation, setUserExplanation] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [evaluation, setEvaluation] = useState('');
  const [isDeepResearching, setIsDeepResearching] = useState(false);
  const [deepResearchContent, setDeepResearchContent] = useState<string | null>(null);

  const startSession = async () => {
    if (!topic.trim()) return;
    setIsLoading(true);
    setLoadingStatus("Architecting Scheme of Work...");
    try {
      const scheme = await generateSchemeOfWork(topic);
      if (!scheme || scheme.length === 0) {
        throw new Error("Empty scheme generated");
      }
      setSession({
        topic,
        scheme,
        currentStepIndex: 0,
        status: 'teaching'
      });
      await loadStepContent(topic, scheme[0].title);
    } catch (error) {
      console.error(error);
      speakWithMuriell("Failed to architect the scheme. My neural pathways are blocked.");
    } finally {
      setIsLoading(false);
      setLoadingStatus("");
    }
  };

  const loadStepContent = async (topic: string, stepTitle: string) => {
    setIsLoading(true);
    setLoadingStatus(`Scraping knowledge for: ${stepTitle}...`);
    try {
      const content = await getProTutorContent(topic, stepTitle);
      setCurrentContent(content);
      speakWithMuriell(content);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setLoadingStatus("");
    }
  };

  const handleExplanationSubmit = async () => {
    if (!userExplanation.trim() || !session) return;
    setIsLoading(true);
    setLoadingStatus("Auditing your comprehension...");
    try {
      const currentStep = session.scheme[session.currentStepIndex];
      if (!currentStep) throw new Error("Current step not found");
      
      const result = await evaluateProExplanation(
        session.topic, 
        currentStep.title, 
        userExplanation
      );
      setEvaluation(result);
      speakWithMuriell(result);
      setSession({ ...session, status: 'testing' });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setLoadingStatus("");
    }
  };

  const nextStep = async () => {
    if (!session) return;
    const nextIndex = session.currentStepIndex + 1;
    setDeepResearchContent(null);
    if (nextIndex < session.scheme.length && session.scheme[nextIndex]) {
      setSession({
        ...session,
        currentStepIndex: nextIndex,
        status: 'teaching'
      });
      setUserExplanation('');
      setEvaluation('');
      await loadStepContent(session.topic, session.scheme[nextIndex].title);
    } else {
      setSession({ ...session, status: 'completed' });
      speakWithMuriell("Curriculum complete. You have survived the Pro Tutor protocol. For now.");
    }
  };

  const toggleVoiceInput = () => {
    if (isListening) return;
    setIsListening(true);
    startListening(
      (text) => {
        setUserExplanation(text);
        setIsListening(false);
      },
      () => setIsListening(false)
    );
  };

  const handleDeepResearch = async () => {
    if (!session) return;
    setIsDeepResearching(true);
    try {
      const currentStep = session.scheme[session.currentStepIndex];
      // Simulate deep research by getting more detailed content
      const content = await getProTutorContent(session.topic, `Deep dive and technical details of: ${currentStep.title}`);
      setDeepResearchContent(content);
      speakWithMuriell("Deep research protocol complete. Neural pathways expanded.");
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeepResearching(false);
    }
  };

  if (!isPro) {
    return (
      <div className="p-10 max-w-4xl mx-auto text-center space-y-8">
        <div className="inline-block p-6 bg-[#EF216A]/10 rounded-full mb-4">
          <Sparkles className="w-16 h-16 text-[#EF216A]" />
        </div>
        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">Pro Tutor Protocol</h2>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Unlock the ultimate learning machine. No uploads required. Muriell will scrape the web, build a custom curriculum, and test your understanding step-by-step.
        </p>
        <button 
          onClick={onUpgrade}
          className="px-12 py-5 bg-[#EF216A] text-white rounded-3xl font-black uppercase tracking-[0.3em] text-sm hover:scale-105 transition-all shadow-[0_0_30px_rgba(239,33,106,0.4)]"
        >
          Upgrade to Pro
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-10 pb-32">
      {!session ? (
        <section className="glass p-10 md:p-16 rounded-[4rem] border-[#EF216A]/20 bg-gradient-to-br from-[#EF216A]/5 via-black/40 to-transparent shadow-2xl text-center space-y-10">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-5 bg-[#EF216A] rounded-2xl shadow-lg">
                <Search className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white">What shall I teach you?</h2>
            <p className="text-[10px] text-pink-500 font-black uppercase tracking-[0.4em]">Pro Tutor Protocol Active</p>
          </div>

          <div className="max-w-2xl mx-auto relative">
            <input 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter any topic (e.g. Quantum Physics, Roman History, React Hooks)..."
              className="w-full bg-black/60 border border-white/10 rounded-[2.5rem] px-10 py-6 text-xl focus:border-[#EF216A] focus:outline-none transition-all placeholder:text-gray-800 text-white shadow-inner"
              onKeyPress={(e) => e.key === 'Enter' && startSession()}
            />
            <button 
              onClick={startSession}
              disabled={isLoading || !topic.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-4 bg-[#EF216A] text-white rounded-full hover:scale-110 transition-all disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {['Machine Learning', 'Stock Market', 'World War II', 'Neuroscience'].map(t => (
              <button 
                key={t} 
                onClick={() => setTopic(t)}
                className="px-6 py-3 glass rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:border-[#EF216A]/40 transition-all"
              >
                {t}
              </button>
            ))}
          </div>
        </section>
      ) : session.status === 'completed' ? (
        <section className="glass p-16 md:p-24 rounded-[5rem] border-white/10 text-center shadow-3xl animate-in zoom-in-95 space-y-10">
          <div className="inline-block p-10 bg-[#EF216A]/10 rounded-full">
            <Trophy className="w-24 h-24 text-[#EF216A]" />
          </div>
          <div className="space-y-4">
            <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white">Protocol Mastered</h2>
            <p className="text-gray-400 text-xl italic">"You have successfully navigated the curriculum for {session.topic}. Don't let the knowledge leak."</p>
          </div>
          <button 
            onClick={() => { setSession(null); setTopic(''); }}
            className="px-16 py-6 bg-white text-black rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-xs hover:scale-105 transition-all shadow-xl"
          >
            New Curriculum
          </button>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scheme of Work Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="glass p-8 rounded-[3rem] border-white/5 space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-5 h-5 text-[#EF216A]" />
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Scheme of Work</h3>
              </div>
              <div className="space-y-4">
                {session.scheme.map((step, i) => (
                  <div 
                    key={i}
                    className={`p-5 rounded-2xl border transition-all ${i === session.currentStepIndex ? 'bg-[#EF216A]/10 border-[#EF216A]/40' : i < session.currentStepIndex ? 'bg-green-500/5 border-green-500/20' : 'glass border-white/5 opacity-40'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Step {i + 1}</span>
                      {i < session.currentStepIndex && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                    </div>
                    <h4 className="text-xs font-black uppercase text-white">{step.title}</h4>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-2 space-y-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-6 glass rounded-[4rem] border-white/5">
                <Loader2 className="w-16 h-16 text-[#EF216A] animate-spin" />
                <p className="text-[10px] text-[#EF216A] font-black uppercase tracking-[0.5em] animate-pulse">{loadingStatus}</p>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6">
                {/* Teaching Content */}
                <div className="glass p-10 md:p-14 rounded-[3.5rem] border-white/5 shadow-2xl bg-black/40 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#EF216A]/40 to-transparent"></div>
                  <div className="flex items-center gap-3 mb-8">
                    <Target className="w-5 h-5 text-[#EF216A]" />
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
                      Current Lesson: {session.scheme[session.currentStepIndex]?.title || 'Loading...'}
                    </span>
                  </div>
                  <div className="text-lg md:text-xl text-pink-50 leading-relaxed italic whitespace-pre-wrap font-medium">
                    {currentContent}
                  </div>

                  <div className="mt-8 flex gap-4">
                    <button 
                      onClick={handleDeepResearch}
                      disabled={isDeepResearching}
                      className="flex-1 py-4 glass border-[#EF216A]/30 text-[#EF216A] rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-[#EF216A]/10 transition-all flex items-center justify-center gap-2"
                    >
                      {isDeepResearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Deep Research</>}
                    </button>
                  </div>

                  {deepResearchContent && (
                    <div className="mt-8 p-8 bg-white/5 border border-white/10 rounded-[2.5rem] animate-in slide-in-from-top-4">
                      <div className="flex items-center gap-2 mb-4 text-amber-500">
                        <Zap className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Advanced Insights</span>
                      </div>
                      <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {deepResearchContent}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Explanation Input */}
                <div className="glass p-10 rounded-[3rem] border-white/5 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white">Explain back to Muriell</h3>
                    <button onClick={toggleVoiceInput} className={`p-3 rounded-xl transition-all ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-[#EF216A]'}`}>
                      <Mic className="w-5 h-5" />
                    </button>
                  </div>
                  <textarea 
                    value={userExplanation}
                    onChange={(e) => setUserExplanation(e.target.value)}
                    placeholder="In your own words, what did you just learn?"
                    className="w-full h-32 bg-black/40 border border-white/5 rounded-2xl p-6 text-sm focus:border-[#EF216A] focus:outline-none transition-all placeholder:text-gray-800 text-white resize-none"
                  />
                  <button 
                    onClick={handleExplanationSubmit}
                    disabled={!userExplanation.trim()}
                    className="w-full py-5 bg-[#EF216A] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all disabled:opacity-50 shadow-lg"
                  >
                    Submit Explanation
                  </button>
                </div>

                {/* Evaluation & Next Step */}
                {evaluation && (
                  <div className="glass p-10 rounded-[3rem] border-green-500/20 bg-green-500/5 animate-in slide-in-from-top-4 space-y-6">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-5 h-5 text-green-500" />
                      <span className="text-[10px] font-black uppercase text-green-500 tracking-widest">Muriell's Audit</span>
                    </div>
                    <p className="text-sm text-green-50 italic leading-relaxed">{evaluation}</p>
                    <button 
                      onClick={nextStep}
                      className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover-lift"
                    >
                      {session.currentStepIndex < session.scheme.length - 1 ? 'Proceed to Next Step' : 'Complete Curriculum'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
};

export default ProTutor;
