
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Target, 
  ShieldCheck, 
  Activity, 
  ChevronRight, 
  Sparkles,
  CheckCircle2,
  Ghost
} from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to MURIELL",
      description: "I'm your personal coach. I'm here to make sure you actually get things done. No more excuses.",
      icon: <Ghost className="w-16 h-16 text-[#EF216A]" />,
      color: "from-[#EF216A]/20 to-transparent"
    },
    {
      title: "Set Your Goals",
      description: "Tell me what you want to achieve. I'll help you build a plan and track your progress every day.",
      icon: <Target className="w-16 h-16 text-blue-500" />,
      color: "from-blue-500/20 to-transparent"
    },
    {
      title: "Focus Tracking",
      description: "I can watch your browser (if you let me) to make sure you aren't wasting time on distracting sites.",
      icon: <Activity className="w-16 h-16 text-green-500" />,
      color: "from-green-500/20 to-transparent"
    },
    {
      title: "High Stakes",
      description: "If you fail, I'll let you know. If you succeed, you'll level up. Let's start your first protocol.",
      icon: <Zap className="w-16 h-16 text-amber-500" />,
      color: "from-amber-500/20 to-transparent"
    }
  ];

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black p-4 overflow-hidden">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,#EF216A_0%,transparent_50%)] animate-pulse"></div>
      
      <AnimatePresence mode="wait">
        <motion.div 
          key={step}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.1, y: -20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-full max-w-lg glass p-10 md:p-16 rounded-[4rem] border-white/10 shadow-2xl overflow-hidden text-center"
        >
          <div className={`absolute inset-0 bg-gradient-to-b ${steps[step].color} pointer-events-none`}></div>
          
          <div className="relative z-10 space-y-8">
            <motion.div 
              initial={{ rotate: -10, scale: 0.5 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="flex justify-center"
            >
              <div className="p-8 bg-white/5 rounded-[3rem] border border-white/10 shadow-inner">
                {steps[step].icon}
              </div>
            </motion.div>

            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-white">
                {steps[step].title}
              </h2>
              <p className="text-gray-400 text-lg font-medium leading-relaxed">
                {steps[step].description}
              </p>
            </div>

            <div className="flex flex-col gap-6 pt-6">
              <button 
                onClick={nextStep}
                className="w-full py-6 bg-white text-black rounded-3xl font-black uppercase tracking-[0.3em] text-xs hover:bg-gray-200 transition-all shadow-2xl flex items-center justify-center gap-3 group"
              >
                {step === steps.length - 1 ? "Start Now" : "Next Step"}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="flex justify-center gap-2">
                {steps.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-[#EF216A]' : 'w-2 bg-white/10'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Onboarding;
