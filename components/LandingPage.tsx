
import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  BookOpen, 
  ChevronRight, 
  Sparkles, 
  Target, 
  Rocket, 
  Ghost, 
  Crown, 
  Check,
  Mail,
  Lock,
  User as UserIcon,
  Chrome,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  RefreshCcw,
  Key
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import Logo from './Logo';

interface LandingPageProps {
  initialUser?: FirebaseUser | null;
}

const LandingPage: React.FC<LandingPageProps> = ({ initialUser }) => {
  const [authView, setAuthView] = useState<'landing' | 'login' | 'signup' | 'verification' | 'forgot-password'>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string>('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (initialUser && !initialUser.emailVerified) {
      setVerificationEmail(initialUser.email || '');
      setAuthView('verification');
    }
  }, [initialUser]);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      if (!cred.user.emailVerified) {
        setVerificationEmail(cred.user.email || '');
        setAuthView('verification');
      }
    } catch (err: any) {
      setError("Email or password is incorrect");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user);
      setVerificationEmail(email);
      setAuthView('verification');
    } catch (err: any) {
      const errorCode = err.code || "";
      const errorMessage = err.message || "";
      if (errorCode === 'auth/email-already-in-use' || errorMessage.includes('email-already-in-use')) {
        setError("User already exists. Please sign in");
      } else {
        setError(errorMessage.replace("Firebase: ", "").replace("Error (", "").replace(").", ""));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Check your email to reset your password.");
    } catch (err: any) {
      setError("We couldn't find that email address.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0 || !auth.currentUser) return;
    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setSuccess("Verification email sent.");
      setResendCooldown(60);
    } catch (err: any) {
      setError("Please wait a bit before trying again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      const errorCode = err.code || "";
      const errorMessage = err.message || "";
      if (errorCode === 'auth/email-already-in-use' || errorMessage.includes('email-already-in-use')) {
        setError("User already exists. Please sign in");
      } else {
        setError(errorMessage.replace("Firebase: ", "").replace("Error (", "").replace(").", ""));
      }
    }
  };

  const renderAuthForm = () => {
    if (authView === 'verification') {
      return (
        <div className="w-full max-w-md p-10 glass rounded-[3rem] animate-in fade-in zoom-in-95 duration-500 shadow-2xl border-white/10 text-center">
          <div className="mb-8 flex justify-center">
            <div className="p-6 bg-green-500/10 rounded-full border border-green-500/20">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Verify Email</h2>
          <p className="text-gray-400 text-sm mb-10 leading-relaxed px-4">
            We sent a link to <span className="text-[#EF216A] font-bold">{verificationEmail}</span>. Click it to activate your account.
          </p>

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-green-500 text-xs font-bold">
              {success}
            </div>
          )}

          <div className="space-y-4">
            <button 
              onClick={() => { signOut(auth); setAuthView('login'); setError(null); }}
              className="w-full py-5 bg-[#EF216A] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
            >
              Back to Login
            </button>
            <button 
              onClick={handleResendVerification}
              disabled={resendCooldown > 0 || loading}
              className="w-full py-5 glass border border-white/10 text-gray-400 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {resendCooldown > 0 ? (
                `Wait ${resendCooldown}s`
              ) : (
                <><RefreshCcw className="w-4 h-4" /> Resend Link</>
              )}
            </button>
          </div>
        </div>
      );
    }

    if (authView === 'forgot-password') {
      return (
        <div className="w-full max-w-md p-8 glass rounded-[3rem] animate-in fade-in slide-in-from-bottom-10 duration-500 shadow-2xl border-white/10">
          <button 
            onClick={() => { setAuthView('login'); setError(null); setSuccess(null); }} 
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Reset Password</h2>
          <p className="text-gray-500 text-sm mb-8">Enter your email to get a reset link.</p>
          
          {error && <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 text-xs font-bold mb-6">{error}</div>}
          {success && <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-green-500 text-xs font-bold mb-6">{success}</div>}

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-600 tracking-widest ml-4">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-[#EF216A] transition-colors text-white"
                  placeholder="your@email.com"
                />
              </div>
            </div>
            <button 
              type="submit" disabled={loading}
              className="w-full py-5 bg-[#EF216A] text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        </div>
      );
    }

    const isLogin = authView === 'login';
    return (
      <div className="w-full max-w-md p-8 glass rounded-[3rem] animate-in fade-in slide-in-from-bottom-10 duration-500 shadow-2xl border-white/10">
        <button 
          onClick={() => { setAuthView('landing'); setError(null); }} 
          className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">
          {isLogin ? 'Welcome Back' : 'Get Started'}
        </h2>
        <p className="text-gray-500 text-sm mb-8">
          {isLogin ? 'Sign in to your account.' : 'Create an account to start focus tracking.'}
        </p>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 text-xs font-bold mb-6 animate-in shake-animation">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-600 tracking-widest ml-4">Email</label>
            <div className="relative">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-[#EF216A] transition-colors text-white"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-gray-600 tracking-widest ml-4">Password</label>
            <div className="relative">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 focus:outline-none focus:border-[#EF216A] transition-colors text-white"
                placeholder="••••••••"
              />
            </div>
            {isLogin && (
              <div className="flex justify-end pt-1 pr-4">
                <button 
                  type="button" onClick={() => setAuthView('forgot-password')}
                  className="text-[9px] font-black uppercase text-gray-600 hover:text-[#EF216A] transition-colors tracking-widest"
                >
                  Forgot Password?
                </button>
              </div>
            )}
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full py-5 bg-[#EF216A] text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Wait...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <div className="my-8 flex items-center gap-4 text-gray-700">
          <div className="flex-1 h-px bg-white/5"></div>
          <span className="text-[8px] font-black uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-white/5"></div>
        </div>

        <button 
          onClick={handleGoogleAuth}
          className="w-full py-4 glass border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all text-white"
        >
          <Chrome className="w-4 h-4 text-[#EF216A]" /> Continue with Google
        </button>

        <p className="mt-8 text-center text-gray-500 text-xs">
          {isLogin ? "No account? " : "Already have an account? "}
          <button 
            onClick={() => { setAuthView(isLogin ? 'signup' : 'login'); setError(null); }}
            className="text-[#EF216A] font-black hover:underline"
          >
            {isLogin ? 'Create one' : 'Login instead'}
          </button>
        </p>
      </div>
    );
  };

  if (authView !== 'landing') {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-5%] left-[-10%] w-[100%] h-[60%] bg-gradient-to-br from-[#EF216A]/10 to-transparent rounded-full blur-[100px] animate-pulse"></div>
        </div>
        {renderAuthForm()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] overflow-x-hidden selection:bg-[#EF216A] selection:text-white relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-10%] w-[100%] md:w-[60%] h-[60%] bg-gradient-to-br from-[#EF216A]/20 via-purple-600/10 to-transparent rounded-full blur-[100px] md:blur-[180px] animate-pulse"></div>
        <div className="absolute bottom-[-5%] right-[-10%] w-[100%] md:w-[60%] h-[60%] bg-gradient-to-tl from-blue-600/15 via-[#EF216A]/10 to-transparent rounded-full blur-[100px] md:blur-[180px] [animation-delay:3s] animate-pulse"></div>
      </div>

      <nav className="relative z-50 max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10" />
          <span className="font-black italic uppercase tracking-tighter text-2xl">Muriell</span>
        </div>
        <div className="flex gap-6 md:gap-10 text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">
          <a href="#rituals" className="hover:text-white transition-colors">Pricing</a>
          <a href="#features" className="hover:text-white transition-colors hidden sm:inline">Features</a>
          <button onClick={() => setAuthView('login')} className="text-[#EF216A] hover:text-white transition-colors">Log In</button>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-12 md:pt-24 pb-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 glass-pink rounded-full border-[#EF216A]/40 mb-12 animate-in fade-in slide-in-from-top-8 duration-1000 shadow-[0_0_40px_rgba(239,33,106,0.2)]">
          <Sparkles className="w-4 h-4 text-[#EF216A]" />
          <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] text-pink-50">FOCUS ASSISTANT</span>
        </div>

        <h1 className="text-5xl sm:text-7xl md:text-9xl lg:text-[11rem] font-black italic uppercase tracking-tighter leading-[0.8] mb-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 select-none">
          WORK OR <br className="hidden sm:block"/>
          <span className="animate-shimmer text-transparent bg-clip-text bg-gradient-to-r from-[#EF216A] via-purple-500 to-amber-400 drop-shadow-[0_0_30px_rgba(239,33,106,0.3)]">
            GET ROASTED.
          </span>
        </h1>
        
        <p className="max-w-3xl text-lg md:text-3xl text-gray-400 font-medium leading-tight mb-20 animate-in fade-in slide-in-from-bottom-16 duration-1000 px-4">
          Muriell watches your screen. If you waste time, it <span className="text-white font-black underline decoration-[#EF216A] decoration-[4px] md:decoration-[8px] underline-offset-4 md:underline-offset-8">insults you</span>. Work hard, and you win.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-20 duration-1000 w-full sm:w-auto px-6">
          <button 
            onClick={() => setAuthView('signup')}
            className="group px-16 md:px-20 py-8 md:py-10 bg-[#EF216A] text-white rounded-[4rem] font-black uppercase tracking-[0.4em] md:tracking-[0.5em] shadow-[0_40px_80px_rgba(239,33,106,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 text-base md:text-lg border-t border-white/20"
          >
            START NOW <ChevronRight className="w-6 h-6 md:w-8 md:h-8 group-hover:translate-x-2 transition-transform" />
          </button>
          <a href="#rituals" className="px-16 md:px-20 py-8 md:py-10 glass rounded-[4rem] font-black uppercase tracking-[0.4em] md:tracking-[0.5em] border-white/20 hover:bg-white/10 transition-all text-base md:text-lg backdrop-blur-3xl text-gray-300 flex items-center justify-center">
            PRICING
          </a>
        </div>
      </div>

      <div id="features" className="relative z-10 max-w-7xl mx-auto px-6 pb-32 md:pb-48">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <FeatureCard 
            icon={<Monitor className="w-10 h-10 md:w-12 md:h-12 text-[#EF216A]" />}
            title="Screen Monitor"
            description="Muriell sees what you're doing. Watching YouTube? It'll know instantly."
            color="pink"
          />
          <FeatureCard 
            icon={<Target className="w-10 h-10 md:w-12 md:h-12 text-purple-500" />}
            title="Daily Goals"
            description="Set a task. If you fail, the AI shames you in front of everyone."
            color="blue"
          />
          <FeatureCard 
            icon={<BookOpen className="w-10 h-10 md:w-12 md:h-12 text-amber-500" />}
            title="AI Study Bot"
            description="Struggling with work? Muriell explains hard stuff until you get it."
            color="green"
          />
        </div>
      </div>

      <div className="relative z-10 bg-gradient-to-r from-transparent via-white/5 to-transparent border-y border-white/5 py-16 md:py-24 mb-32 md:mb-48 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center relative z-10">
          <div className="space-y-1">
            <div className="text-5xl md:text-8xl font-black text-white tracking-tighter italic">100K</div>
            <div className="text-[10px] md:text-[12px] text-gray-500 font-black uppercase tracking-[0.4em]">Goals Met</div>
          </div>
          <div className="space-y-1">
            <div className="text-5xl md:text-8xl font-black text-[#EF216A] tracking-tighter italic">24/7</div>
            <div className="text-[10px] md:text-[12px] text-gray-500 font-black uppercase tracking-[0.4em]">Watching You</div>
          </div>
          <div className="space-y-1">
            <div className="text-5xl md:text-8xl font-black text-white tracking-tighter italic">ZERO</div>
            <div className="text-[10px] md:text-[12px] text-gray-500 font-black uppercase tracking-[0.4em]">Excuses</div>
          </div>
          <div className="space-y-1">
            <div className="text-5xl md:text-8xl font-black text-white tracking-tighter italic">12M+</div>
            <div className="text-[10px] md:text-[12px] text-gray-500 font-black uppercase tracking-[0.4em]">XP Gained</div>
          </div>
        </div>
      </div>

      <div id="rituals" className="relative z-10 max-w-7xl mx-auto px-6 pb-48 md:pb-64">
        <div className="text-center mb-16 md:mb-24">
          <h2 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter mb-4">PICK A PLAN</h2>
          <p className="text-gray-500 font-black uppercase tracking-[0.4em] text-[10px]">Stop wasting your time.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          <PricingCard 
            title="Free"
            price="0"
            description="Basic tracking and tasks."
            features={['Standard Screen Watch', 'Daily Goals', 'Web Dashboard']}
            buttonText="Start Free"
            onStart={() => setAuthView('signup')}
          />
          
          <PricingCard 
            title="Pro"
            price="9"
            description="AI voice chat and study help."
            features={['Real-Time AI Voice', 'Study Bot & Quizzes', 'Work Reports', 'Priority Help']}
            highlighted={true}
            buttonText="Go Pro"
            onStart={() => setAuthView('signup')}
          />

          <PricingCard 
            title="Elite"
            price="19"
            description="Phone alerts and money bets."
            features={['SMS Alerts', 'Bet Money on Goals', 'All Devices', 'Custom Plans']}
            buttonText="Go Elite"
            onStart={() => setAuthView('signup')}
          />
        </div>
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, description: string, color: string }> = ({ icon, title, description, color }) => {
  return (
    <div className="glass p-10 md:p-14 rounded-[3rem] border-white/5 transition-all duration-700 group flex flex-col items-center text-center hover:bg-white/5">
      <div className="p-6 md:p-8 bg-white/5 rounded-[2rem] mb-8 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-2xl md:text-3xl font-black italic uppercase mb-4 text-white tracking-tighter">{title}</h3>
      <p className="text-gray-400 text-base md:text-lg leading-relaxed font-medium">{description}</p>
    </div>
  );
};

const PricingCard: React.FC<{ 
  title: string, 
  price: string, 
  description: string, 
  features: string[], 
  highlighted?: boolean, 
  buttonText: string,
  onStart: () => void
}> = ({ title, price, description, features, highlighted, buttonText, onStart }) => {
  return (
    <div className={`glass p-10 md:p-12 rounded-[3.5rem] flex flex-col border transition-all duration-500 ${highlighted ? 'border-[#EF216A] bg-white/[0.05] scale-105 shadow-[0_40px_100px_rgba(239,33,106,0.15)]' : 'border-white/5 hover:border-white/20'}`}>
      {highlighted && (
        <div className="flex justify-center mb-6">
          <span className="px-5 py-1.5 bg-[#EF216A] text-white font-black uppercase text-[8px] tracking-[0.3em] rounded-full">Best Choice</span>
        </div>
      )}
      <div className="flex items-center gap-4 mb-4">
        {highlighted ? <Crown className="w-8 h-8 text-amber-500" /> : <Ghost className="w-8 h-8 text-gray-700" />}
        <h3 className="text-3xl font-black italic uppercase tracking-tighter">{title}</h3>
      </div>
      <div className="flex items-baseline gap-2 mb-8">
        <span className="text-6xl font-black italic tracking-tighter">${price}</span>
        <span className="text-gray-500 font-bold uppercase text-[9px] tracking-widest">/mo</span>
      </div>
      <p className="text-gray-400 text-sm font-medium mb-12 leading-relaxed italic h-12">{description}</p>
      <div className="space-y-5 mb-12 flex-1">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-4">
            <Check className={`w-4 h-4 shrink-0 ${highlighted ? 'text-[#EF216A]' : 'text-gray-600'}`} />
            <span className="text-[11px] font-bold uppercase tracking-tight text-gray-300">{f}</span>
          </div>
        ))}
      </div>
      <button 
        onClick={onStart}
        className={`w-full py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all ${highlighted ? 'bg-[#EF216A] text-white hover:bg-white hover:text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}
      >
        {buttonText}
      </button>
    </div>
  );
};

export default LandingPage;
