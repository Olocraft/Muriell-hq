
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  BookOpen, 
  Monitor, 
  CheckSquare,
  LogOut,
  Loader2
} from 'lucide-react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from './services/firebase';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import StudyCompanion from './components/StudyCompanion';
import InternetMonitor from './components/InternetMonitor';
import HabitBuilder from './components/HabitBuilder';
import MonthlyPlanner from './components/MonthlyPlanner';
import MuriellGhost from './components/MuriellGhost';
import Logo from './components/Logo';
import { UserStats, Task, MuriellMood } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'study' | 'routine' | 'monitor' | 'habits'>('dashboard');
  
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('muriell_stats');
    return saved ? JSON.parse(saved) : {
      xp: 450,
      level: 4,
      streak: 7,
      rageMeter: 35,
      shamePoints: 120,
      disciplineScore: 82
    };
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('muriell_tasks');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        title: 'Study: OS Architecture',
        description: 'Review Module 4 and draw diagrams.',
        type: 'focus',
        status: 'pending',
        stakeAmount: 20,
        deadline: new Date().toISOString(),
        outcome: 'Active'
      }
    ];
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('muriell_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('muriell_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!user || !user.emailVerified) return;

    const accountabilityInterval = setInterval(() => {
      const pendingCount = tasks.filter(t => t.status === 'pending').length;
      if (pendingCount > 0 && Notification.permission === 'granted') {
        const messages = [
          "Still here? Good. Now finish your work.",
          "You're getting distracted. Get back to it.",
          "I see those unfinished tasks. They won't do themselves.",
          "Stop making excuses and start working."
        ];
        new Notification("MURIELL CHECK-IN", {
          body: messages[Math.floor(Math.random() * messages.length)],
        });
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(accountabilityInterval);
  }, [user, tasks]);

  const handleCompleteTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'completed' as const } : t));
    setStats(prev => ({
      ...prev,
      xp: prev.xp + 50,
      disciplineScore: Math.min(100, prev.disciplineScore + 2),
      rageMeter: Math.max(0, prev.rageMeter - 5)
    }));
  };

  const handleAddTask = (newTask: Omit<Task, 'id' | 'status' | 'deadline' | 'outcome'>) => {
    const task: Task = {
      ...newTask,
      id: Date.now().toString(),
      status: 'pending',
      deadline: new Date().toISOString(),
      outcome: 'Added to your list'
    };
    setTasks(prev => [task, ...prev]);
  };

  const handleViolation = () => {
    setStats(prev => ({
      ...prev,
      rageMeter: Math.min(100, prev.rageMeter + 15),
      shamePoints: prev.shamePoints + 10,
      disciplineScore: Math.max(0, prev.disciplineScore - 5)
    }));
    if (Notification.permission === 'granted') {
      new Notification("MURIELL WARNING", {
        body: "Wasting time detected. Focus on your goals.",
      });
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const getMood = () => {
    if (stats.disciplineScore > 90 && stats.rageMeter < 20) return MuriellMood.PROUD;
    if (stats.rageMeter > 80) return MuriellMood.RAGE;
    if (stats.rageMeter > 40) return MuriellMood.ANNOYED;
    return MuriellMood.CALM;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
           <Logo className="w-20 h-20 animate-pulse" />
           <Loader2 className="w-8 h-8 text-[#EF216A] animate-spin" />
        </div>
      </div>
    );
  }

  if (!user || (user && !user.emailVerified)) {
    return <LandingPage initialUser={user} />;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col md:flex-row font-sans relative">
      <nav className="w-full md:w-32 md:min-h-screen glass flex md:flex-col items-center py-4 md:py-12 justify-around md:justify-start gap-12 z-50 sticky bottom-0 md:top-0 border-t md:border-t-0 md:border-r border-white/5 bg-[#0A0A0A]/95 backdrop-blur-3xl">
        <div className="hidden md:flex mb-8 items-center justify-center">
          <Logo className="w-16 h-16 drop-shadow-[0_0_20px_rgba(239,33,106,0.3)]" />
        </div>
        
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="Home" />
        <NavButton active={activeTab === 'habits'} onClick={() => setActiveTab('habits')} icon={<CheckSquare />} label="Daily" />
        <NavButton active={activeTab === 'routine'} onClick={() => setActiveTab('routine')} icon={<Calendar />} label="Plan" />
        <NavButton active={activeTab === 'study'} onClick={() => setActiveTab('study')} icon={<BookOpen />} label="Study" />
        <NavButton active={activeTab === 'monitor'} onClick={() => setActiveTab('monitor')} icon={<Monitor />} label="Watch" />
        
        <div className="md:mt-auto">
          <button 
            onClick={handleLogout}
            className="flex flex-col items-center gap-2 group transition-all text-gray-600 hover:text-red-500"
          >
            <div className="p-4 rounded-3xl transition-all duration-500 glass group-hover:bg-red-500/10">
              <LogOut className="w-7 h-7" />
            </div>
            <span className="text-[9px] uppercase font-black tracking-[0.3em]">Logout</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto pb-24 md:pb-12 relative z-10">
        <header className="p-6 md:p-10 border-b border-white/5 flex justify-between items-center sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-3xl z-40">
          <h1 className="text-2xl font-black tracking-tighter uppercase italic leading-none">Muriell Assistant</h1>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-6 py-2 glass rounded-full border-white/10">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_#22C55E]"></span>
              <span className="text-[11px] font-black uppercase text-gray-300 tracking-widest">{stats.streak} Day Streak</span>
            </div>
          </div>
        </header>

        <div className="w-full animate-in fade-in duration-700">
          {activeTab === 'dashboard' && <Dashboard stats={stats} tasks={tasks} onCompleteTask={handleCompleteTask} />}
          {activeTab === 'habits' && <HabitBuilder onAddTask={handleAddTask} onProgressUpdate={() => {}} />}
          {activeTab === 'study' && <StudyCompanion />}
          {activeTab === 'monitor' && <InternetMonitor onViolation={handleViolation} />}
          {activeTab === 'routine' && <MonthlyPlanner />}
        </div>
      </main>

      <MuriellGhost mood={getMood()} rageLevel={stats.rageMeter} onAddTask={handleAddTask} />
    </div>
  );
};

const NavButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-2 group transition-all ${active ? 'text-[#EF216A]' : 'text-gray-600 hover:text-white'}`}
  >
    <div className={`p-4 rounded-3xl transition-all duration-500 ${active ? 'bg-[#EF216A]/10 border border-[#EF216A]/30 shadow-[0_0_30px_rgba(239,33,106,0.15)] scale-110' : 'glass group-hover:bg-white/10'}`}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: 'w-7 h-7' }) : icon}
    </div>
    <span className={`text-[9px] uppercase font-black tracking-[0.3em] transition-all ${active ? 'opacity-100' : 'opacity-0'}`}>{label}</span>
  </button>
);

export default App;
