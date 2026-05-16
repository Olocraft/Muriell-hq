
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  BookOpen, 
  Monitor, 
  CheckSquare,
  User,
  LogOut,
  Loader2,
  AlertTriangle,
  BellRing,
  Settings,
  Crown,
  Star,
  Sparkles,
  Zap
} from 'lucide-react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from './services/firebase';
import { taskService } from './services/taskService';
import { billing } from './services/billingService';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import StudyCompanion from './components/StudyCompanion';
import InternetMonitor from './components/InternetMonitor';
import HabitBuilder from './components/HabitBuilder';
import MonthlyPlanner from './components/MonthlyPlanner';
import MuriellGhost from './components/MuriellGhost';
import Paywall from './components/Paywall';
import ProTutor from './components/ProTutor';
import Onboarding from './components/Onboarding';
import Profile from './components/Profile';
import Logo from './components/Logo';
import { UserStats, Task, MuriellMood, HabitSection, Habit } from './types';
import { speakWithMuriell } from './services/audioService';

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'study' | 'routine' | 'monitor' | 'habits' | 'tutor' | 'profile'>('dashboard');
  const [snoozeCount, setSnoozeCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showTaskAddedPopup, setShowTaskAddedPopup] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleSignOut = async () => {
    await signOut(auth);
    localStorage.removeItem('muriell_stats');
    localStorage.removeItem('muriell_routine');
    localStorage.removeItem('muriell_tasks');
    localStorage.removeItem('muriell_habits');
    localStorage.removeItem('muriell_last_refresh');
    
    setStats({
      xp: 0,
      level: 1,
      streak: 0,
      rageMeter: 0,
      shamePoints: 0,
      disciplineScore: 100,
      consistencyScore: 100,
      roastIntensity: 'Standard'
    });
    setRoutine(null);
    setTasks([]);
    setHabitSections([
      {
        id: 'body',
        title: 'Fitness & Health',
        icon: 'Dumbbell',
        habits: [
          { id: 'h1', title: 'Wake Up Early', completed: false, streak: 0, time: '06:00' },
          { id: 'h2', title: 'Exercise', completed: false, streak: 0, time: '07:30' },
        ]
      }
    ]);
  };
  
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('muriell_stats');
    return saved ? JSON.parse(saved) : {
      xp: 450,
      level: 4,
      streak: 7,
      rageMeter: 35,
      shamePoints: 120,
      disciplineScore: 82,
      roastIntensity: 'Standard'
    };
  });

  const [routine, setRoutine] = useState<string | null>(() => {
    return localStorage.getItem('muriell_routine');
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('muriell_tasks');
    return saved ? JSON.parse(saved) : [
      {
        id: '1',
        title: 'Study: OS Architecture',
        description: 'Review Module 4 and diagrams.',
        type: 'focus',
        status: 'pending',
        stakeAmount: 20,
        deadline: new Date(Date.now() + 3600000).toISOString(),
        outcome: 'Active'
      }
    ];
  });

  const [habitSections, setHabitSections] = useState<HabitSection[]>(() => {
    const saved = localStorage.getItem('muriell_habits');
    const today = new Date().toISOString().split('T')[0];
    
    if (saved) {
      const parsed: HabitSection[] = JSON.parse(saved);
      return parsed.map(section => ({
        ...section,
        habits: section.habits.map(habit => {
          if (habit.lastCompleted !== today) {
            return { ...habit, completed: false, alarmTriggered: false };
          }
          return habit;
        })
      }));
    }

    return [
      {
        id: 'body',
        title: 'Fitness & Health',
        icon: 'Dumbbell',
        habits: [
          { id: 'h1', title: 'Wake Up Early', completed: false, streak: 0, time: '06:00' },
          { id: 'h2', title: 'Exercise', completed: false, streak: 0, time: '07:30' },
        ]
      }
    ];
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await billing.initialize(firebaseUser.uid);
        const proStatus = await billing.checkProEntitlement();
        setIsPro(proStatus);

        // Load user data from Firestore
        const userData = await taskService.getUserData(firebaseUser.uid);
        if (userData) {
          const updatedStats = {
            ...stats,
            ...(userData.stats || {}),
            photoURL: userData.photoURL || stats.photoURL,
            readingHistory: userData.readingHistory || stats.readingHistory,
            consistencyHistory: userData.consistencyHistory || stats.consistencyHistory
          };
          setStats(updatedStats);
          
          if (userData.tasks) {
            const { tasks: refreshedTasks, habits: refreshedHabits } = await taskService.checkDailyRefresh(firebaseUser.uid, userData.tasks, userData.habitSections || habitSections);
            setTasks(refreshedTasks);
            setHabitSections(refreshedHabits);
            localStorage.setItem('muriell_last_refresh', new Date().toISOString().split('T')[0]);
          }
          if (userData.routine) setRoutine(userData.routine);
        } else {
          // New user or missing data - initialize
          const initialStats: UserStats = {
            xp: 0,
            level: 1,
            streak: 0,
            rageMeter: 0,
            shamePoints: 0,
            disciplineScore: 100,
            consistencyScore: 100,
            roastIntensity: 'Standard',
            readingHistory: [],
            consistencyHistory: Array.from({ length: 7 }, (_, i) => ({
              date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
              score: 100
            }))
          };
          
          const initialHabits: HabitSection[] = [
            {
              id: 'body',
              title: 'Fitness & Health',
              icon: 'Dumbbell',
              habits: [
                { id: 'h1', title: 'Wake Up Early', completed: false, streak: 0, time: '06:00' },
                { id: 'h2', title: 'Exercise', completed: false, streak: 0, time: '07:30' },
              ]
            }
          ];

          await taskService.syncUserData(firebaseUser.uid, { 
            stats: initialStats,
            tasks: [],
            habitSections: initialHabits,
            routine: null,
            readingHistory: [],
            consistencyHistory: initialStats.consistencyHistory
          });
          
          setStats(initialStats);
          setTasks([]);
          setHabitSections(initialHabits);
          setRoutine(null);
          setShowOnboarding(true);
        }

        // Request notification permission
        if (Notification.permission === 'default') {
          Notification.requestPermission();
        }
      } else {
        // User logged out, clear local storage and state
        localStorage.removeItem('muriell_stats');
        localStorage.removeItem('muriell_routine');
        localStorage.removeItem('muriell_tasks');
        localStorage.removeItem('muriell_habits');
        localStorage.removeItem('muriell_last_refresh');
        
        setStats({
          xp: 0,
          level: 1,
          streak: 0,
          rageMeter: 0,
          shamePoints: 0,
          disciplineScore: 100,
          consistencyScore: 100,
          roastIntensity: 'Standard'
        });
        setRoutine(null);
        setTasks([]);
        setHabitSections([
          {
            id: 'body',
            title: 'Fitness & Health',
            icon: 'Dumbbell',
            habits: [
              { id: 'h1', title: 'Wake Up Early', completed: false, streak: 0, time: '06:00' },
              { id: 'h2', title: 'Exercise', completed: false, streak: 0, time: '07:30' },
            ]
          }
        ]);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('muriell_stats', JSON.stringify(stats));
    if (user) {
      taskService.syncUserData(user.uid, { 
        stats,
        photoURL: stats.photoURL,
        readingHistory: stats.readingHistory,
        consistencyHistory: stats.consistencyHistory
      });
    }
  }, [stats, user]);

  useEffect(() => {
    if (routine) {
      localStorage.setItem('muriell_routine', routine);
    } else {
      localStorage.removeItem('muriell_routine');
    }
    if (user) {
      taskService.syncUserData(user.uid, { routine });
    }
  }, [routine, user]);

  useEffect(() => {
    localStorage.setItem('muriell_tasks', JSON.stringify(tasks));
    if (user) {
      taskService.syncUserData(user.uid, { tasks });
    }
  }, [tasks, user]);

  useEffect(() => {
    localStorage.setItem('muriell_habits', JSON.stringify(habitSections));
    if (user) {
      taskService.syncUserData(user.uid, { habitSections });
    }
  }, [habitSections, user]);

  useEffect(() => {
    if (!user || !user.emailVerified) return;

    const checkRealtimeAccountability = async () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // Check for daily refresh if day changed
      const lastRefresh = localStorage.getItem('muriell_last_refresh');
      if (lastRefresh !== today && user) {
        const { tasks: refreshedTasks, habits: refreshedHabits } = await taskService.checkDailyRefresh(user.uid, tasks, habitSections);
        setTasks(refreshedTasks);
        setHabitSections(refreshedHabits);
        localStorage.setItem('muriell_last_refresh', today);
      }

      const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      let updatedHabits = false;
      let updatedTasks = false;
      let penaltyApplied = false;

      const newHabitSections = habitSections.map(section => ({
        ...section,
        habits: (section.habits || []).map(habit => {
          if (!habit) return habit;
          if (!habit.completed && habit.time === nowHHMM && !habit.alarmTriggered) {
            updatedHabits = true;
            if (Notification.permission === 'granted') {
              new Notification("RITUAL ALARM", {
                body: `Protocol scheduled: ${habit.title || 'Unknown'}. Respond immediately.`,
                requireInteraction: true
              });
            }
            speakWithMuriell(`It is ${habit.time}. Start your ${habit.title || 'ritual'} protocol now. Do not make me wait.`);
            
            // Play alarm beep
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const oscillator = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              oscillator.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              oscillator.type = 'sine';
              oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
              gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
              oscillator.start();
              oscillator.stop(audioCtx.currentTime + 0.5);
            } catch (e) {
              console.error("Audio alarm failed", e);
            }

            return { ...habit, alarmTriggered: true };
          }
          
          // Habit Violation (After 15 minute grace period)
          if (habit.time && !habit.completed && habit.alarmTriggered) {
            const [h, m] = habit.time.split(':').map(Number);
            const scheduledTime = new Date();
            scheduledTime.setHours(h, m, 0, 0);
            const diffMinutes = (now.getTime() - scheduledTime.getTime()) / 60000;
            if (diffMinutes > 15) {
              penaltyApplied = true;
              if (Notification.permission === 'granted') {
                new Notification("RITUAL VIOLATION", {
                  body: `Ritual ${habit.title} ignored. Penalty applied.`,
                  requireInteraction: true
                });
              }
              return { ...habit, alarmTriggered: false, completed: false };
            }
          }
          return habit;
        })
      }));

      const newTasks = tasks.map(task => {
        if (!task) return task;
        const deadline = new Date(task.deadline);
        const diffMinutes = (now.getTime() - deadline.getTime()) / 60000;
        
        // 1. Near Deadline (5 minutes before)
        if (task.status === 'pending' && !task.alarmTriggered && diffMinutes > -5 && diffMinutes <= 0) {
          updatedTasks = true;
          if (Notification.permission === 'granted') {
            new Notification("DEADLINE APPROACHING", {
              body: `Protocol execution required for: ${task.title}. 5 minutes remaining.`,
              requireInteraction: true
            });
          }
          speakWithMuriell(`Warning. The deadline for ${task.title} is approaching. Do not fail me.`);
          return { ...task, alarmTriggered: true };
        }

        // 2. Deadline Passed (Exactly at or just after deadline)
        if (task.status === 'pending' && diffMinutes > 0 && diffMinutes < 1 && !task.deadlinePassedTriggered) {
          updatedTasks = true;
          if (Notification.permission === 'granted') {
            new Notification("DEADLINE EXPIRED", {
              body: `Protocol ${task.title} has passed its deadline. Grace period active.`,
              requireInteraction: true
            });
          }
          speakWithMuriell(`The deadline for ${task.title} has expired. You are now in the grace period. Execute immediately.`);
          return { ...task, deadlinePassedTriggered: true };
        }

        // 3. Violation (After 10 minute grace period)
        if (task.status === 'pending' && diffMinutes > 10) {
          penaltyApplied = true;
          if (Notification.permission === 'granted') {
            new Notification("VIOLATION DETECTED", {
              body: `Protocol ${task.title} failed. Penalty applied. Rage increasing.`,
              requireInteraction: true
            });
          }
          return { ...task, status: 'missed' as const, alarmTriggered: false, deadlinePassedTriggered: false };
        }
        return task;
      });

      if (penaltyApplied) {
        setStats(prev => ({
          ...prev,
          rageMeter: Math.min(100, prev.rageMeter + 15),
          disciplineScore: Math.max(0, prev.disciplineScore - 8)
        }));
        speakWithMuriell("Forfeit detected. Your clinical performance is declining. Rage level increased.");
      }

      if (updatedHabits) setHabitSections(newHabitSections);
      if (updatedTasks) setTasks(newTasks);
    };

    const interval = setInterval(checkRealtimeAccountability, 30000);
    return () => clearInterval(interval);
  }, [user, tasks, habitSections, snoozeCount]);

  // Offline Notifications for Rituals and Tasks
  useEffect(() => {
    if (!user || !user.emailVerified || Notification.permission !== 'granted' || !('serviceWorker' in navigator)) return;
    
    const scheduleOfflineNotifications = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (!('showTrigger' in Notification.prototype)) {
          console.log("Offline scheduled notifications not supported (requires Chromium Notification Triggers API)");
          return;
        }

        const now = new Date();

        tasks.forEach(task => {
          if (task.status === 'pending' && task.deadline && !task.alarmTriggered) {
            const warningTime = new Date(new Date(task.deadline).getTime() - 5 * 60000);
            if (warningTime > now) {
              // @ts-ignore
              registration.showNotification("DEADLINE APPROACHING", {
                tag: `task-${task.id}`,
                body: `Wait... ${task.title} is due soon. 5 minutes remaining. Get offline and work.`,
                icon: '/logo.png',
                // @ts-ignore
                showTrigger: new (window as any).TimestampTrigger(warningTime.getTime())
              }).catch(e => console.error("SW notification error", e));
            }
          }
        });

        habitSections.forEach(section => {
          section.habits.forEach(habit => {
            if (!habit.completed && habit.time && !habit.alarmTriggered) {
              const [h, m] = habit.time.split(':').map(Number);
              const habTime = new Date();
              habTime.setHours(h, m, 0, 0);
              if (habTime > now) {
                // @ts-ignore
                registration.showNotification("RITUAL ALARM", {
                  tag: `habit-${habit.id}`,
                  body: `Protocol scheduled: ${habit.title || 'Unknown'}. Respond immediately.`,
                  icon: '/logo.png',
                  // @ts-ignore
                  showTrigger: new (window as any).TimestampTrigger(habTime.getTime())
                }).catch(e => console.error("SW notification error", e));
              }
            }
          });
        });
      } catch (err) {
        console.error("Failed to schedule offline notifications:", err);
      }
    };

    scheduleOfflineNotifications();
  }, [tasks, habitSections, user]);

  const handleSnoozeAlarm = () => {
    setSnoozeCount(prev => prev + 1);
    setStats(prev => ({
      ...prev,
      rageMeter: Math.min(100, prev.rageMeter + 10),
      disciplineScore: Math.max(0, prev.disciplineScore - 5)
    }));
    speakWithMuriell("Snoozing is for the weak. I have increased my rage parameters accordingly.");
  };

  const handleCompleteTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'completed' as const, alarmTriggered: false, deadlinePassedTriggered: false } : t));
    setStats(prev => ({
      ...prev,
      xp: prev.xp + 50,
      disciplineScore: Math.min(100, prev.disciplineScore + 2),
      rageMeter: Math.max(0, prev.rageMeter - 5)
    }));
    setSnoozeCount(0);
  };

  const handleToggleHabit = (sectionId: string, habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    let wasCompleted = false;
    setHabitSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        habits: section.habits.map(habit => {
          if (habit.id !== habitId) return habit;
          const newCompleted = !habit.completed;
          wasCompleted = newCompleted;
          return {
            ...habit,
            completed: newCompleted,
            lastCompleted: newCompleted ? today : habit.lastCompleted,
            streak: newCompleted ? habit.streak + 1 : Math.max(0, habit.streak - 1),
            alarmTriggered: false
          };
        })
      };
    }));
    setStats(prev => ({
      ...prev,
      xp: prev.xp + (wasCompleted ? 25 : -10),
      disciplineScore: Math.min(100, Math.max(0, prev.disciplineScore + (wasCompleted ? 1 : -1))),
      rageMeter: Math.max(0, prev.rageMeter + (wasCompleted ? -2 : 1))
    }));
  };

  const handleAddHabit = (sectionId: string, title: string, time?: string) => {
    setHabitSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      const newHabit: Habit = {
        id: Date.now().toString(),
        title,
        completed: false,
        streak: 0,
        frequency: 'daily',
        time: time || undefined
      };
      return { ...section, habits: [...section.habits, newHabit] };
    }));
  };

  const handleEditHabitTime = (sectionId: string, habitId: string, time: string) => {
    setHabitSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        habits: section.habits.map(habit => {
          if (habit.id !== habitId) return habit;
          return { ...habit, time, alarmTriggered: false };
        })
      };
    }));
  };

  const handleAddHabitSection = (title: string) => {
    const newSection: HabitSection = { id: Date.now().toString(), title, icon: 'Target', habits: [] };
    setHabitSections(prev => [...prev, newSection]);
  };

  const handleAddTask = (newTask: Omit<Task, 'id' | 'status' | 'deadline' | 'outcome'>, customDeadline?: string) => {
    const task: Task = {
      ...newTask,
      id: Date.now().toString(),
      status: 'pending',
      deadline: customDeadline || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      outcome: 'Protocol Active'
    };
    setTasks(prev => [task, ...prev]);
    setShowTaskAddedPopup(task.title);
    setTimeout(() => setShowTaskAddedPopup(null), 4000);
    speakWithMuriell(`Protocol ${task.title} has been logged. Do not disappoint me.`);
  };

  const handleViolation = () => {
    setStats(prev => ({
      ...prev,
      rageMeter: Math.min(100, prev.rageMeter + 15),
      shamePoints: prev.shamePoints + 10,
      disciplineScore: Math.max(0, prev.disciplineScore - 5)
    }));
    if (Notification.permission === 'granted') {
      new Notification("VIOLATION", { body: "Unproductive activity recognized. Rage increasing." });
    }
  };

  const handleStudyComplete = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    setStats(prev => ({
      ...prev,
      xp: prev.xp + (percentage > 70 ? 100 : 30),
      disciplineScore: Math.min(100, prev.disciplineScore + (percentage > 70 ? 5 : 1)),
      rageMeter: Math.max(0, prev.rageMeter - (percentage > 70 ? 10 : 2)),
      readingHistory: [
        { title: `Study Session: ${new Date().toLocaleTimeString()}`, timestamp: new Date().toISOString() },
        ...(prev.readingHistory || []).slice(0, 9)
      ]
    }));
  };

  const getMood = () => {
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const missedTasks = tasks.filter(t => t.status === 'missed').length;
    const totalProcessed = completedTasks + missedTasks;
    const consistency = totalProcessed > 0 ? (completedTasks / totalProcessed) * 100 : 100;

    if (stats.rageMeter > 80 || consistency < 30) return MuriellMood.RAGE;
    if (stats.rageMeter > 40 || consistency < 60) return MuriellMood.ANNOYED;
    if (stats.disciplineScore > 90 && consistency > 90) return MuriellMood.PROUD;
    return MuriellMood.CALM;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#EF216A] animate-spin" />
      </div>
    );
  }

  if (!user || (user && !user.emailVerified)) {
    return <LandingPage initialUser={user} />;
  }

  const isAlarming = tasks.some(t => t.status === 'pending' && t.alarmTriggered) || 
                     habitSections.flatMap(s => s.habits).some(h => !h.completed && h.alarmTriggered);

  return (
    <div className={`min-h-screen bg-[#0A0A0A] text-white flex flex-col md:flex-row font-sans relative overflow-x-hidden ${isPro ? 'neural-aura' : ''}`}>
      {/* Neural Aura Styling for Pro */}
      {isPro && (
        <style>{`
          .neural-aura::before {
            content: '';
            position: fixed;
            inset: 0;
            background: radial-gradient(circle at 50% 50%, rgba(239, 33, 106, 0.05) 0%, transparent 70%);
            pointer-events: none;
            z-index: 1;
          }
          .neural-aura .glass {
            border-color: rgba(239, 33, 106, 0.2);
            box-shadow: 0 0 30px rgba(239, 33, 106, 0.05);
          }
        `}</style>
      )}

      {showPaywall && (
        <Paywall 
          onClose={() => setShowPaywall(false)} 
          onSuccess={() => { setIsPro(true); setShowPaywall(false); }} 
        />
      )}

      <nav className="w-full md:w-28 md:min-h-screen glass flex md:flex-col items-center py-3 md:py-12 justify-around md:justify-start gap-2 md:gap-12 z-50 sticky bottom-0 md:top-0 border-t md:border-t-0 md:border-r border-white/5 bg-[#0A0A0A]/95 backdrop-blur-3xl px-1 md:px-0 safe-area-bottom">
        <div className="hidden md:flex mb-8 items-center justify-center relative">
          <Logo className="w-12 h-12" />
          {isPro && (
            <div className="absolute -top-2 -right-2 p-1 bg-[#EF216A] rounded-full shadow-[0_0_10px_#EF216A] animate-pulse">
              <Star className="w-3 h-3 text-white fill-current" />
            </div>
          )}
        </div>
        
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="Home" />
        <NavButton active={activeTab === 'habits'} onClick={() => setActiveTab('habits')} icon={<CheckSquare />} label="Daily" />
        <NavButton active={activeTab === 'tutor'} onClick={() => setActiveTab('tutor')} icon={<Sparkles />} label="Pro Tutor" />
        <NavButton active={activeTab === 'routine'} onClick={() => setActiveTab('routine')} icon={<Calendar />} label="Plan" />
        <NavButton active={activeTab === 'study'} onClick={() => setActiveTab('study')} icon={<BookOpen />} label="Study" />
        <NavButton active={activeTab === 'monitor'} onClick={() => setActiveTab('monitor')} icon={<Monitor />} label="Watch" />
        <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User className="w-6 h-6" />} label="Profile" />
        
        <div className="md:mt-auto hidden md:block">
          <button onClick={() => setShowSettings(!showSettings)} className="p-3 text-gray-500 hover:text-white transition-all"><Settings className="w-6 h-6" /></button>
          <button onClick={handleSignOut} className="flex flex-col items-center gap-2 group transition-all text-gray-600 hover:text-red-500 mt-4">
            <div className="p-3 rounded-2xl glass group-hover:bg-red-500/10"><LogOut className="w-6 h-6" /></div>
            <span className="text-[8px] uppercase font-black tracking-[0.2em]">Exit</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto pb-24 md:pb-12 relative z-10 w-full">
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="glass p-10 rounded-[3rem] w-full max-w-md border-[#EF216A]/20">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-8">System Settings</h2>
              
              <div className="space-y-8">
                {/* Subscription Section */}
                <div className="p-6 glass rounded-2xl border-white/5">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <Crown className={`w-4 h-4 ${isPro ? 'text-amber-500' : 'text-gray-500'}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">Muriell {isPro ? 'Pro' : 'Free'}</span>
                    </div>
                    {isPro ? (
                      <span className="text-[8px] font-black uppercase tracking-widest text-green-500">ACTIVE</span>
                    ) : (
                      <button onClick={() => setShowPaywall(true)} className="text-[8px] font-black uppercase tracking-widest text-[#EF216A] hover:underline">UPGRADE</button>
                    )}
                  </div>
                  {isPro && (
                    <button 
                      onClick={() => billing.openCustomerCenter()} 
                      className="w-full py-2 glass border-white/10 rounded-xl text-[8px] font-black uppercase tracking-widest text-gray-400 hover:text-white"
                    >
                      Manage Subscription
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-600 tracking-widest block mb-3 ml-2">Roast Intensity</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Mild', 'Standard', 'Aggressive'].map(level => (
                      <button 
                        key={level}
                        onClick={() => setStats({...stats, roastIntensity: level as any})}
                        className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${stats.roastIntensity === level ? 'bg-[#EF216A] border-[#EF216A] text-white' : 'glass border-white/5 text-gray-500'}`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full mt-10 py-4 bg-white text-black font-black uppercase rounded-2xl tracking-widest text-[10px]">Close Settings</button>
            </div>
          </div>
        )}

        <header className="px-4 py-4 md:px-10 md:py-8 border-b border-white/5 flex justify-between items-center sticky top-0 bg-[#0A0A0A]/90 backdrop-blur-3xl z-40">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase italic leading-none text-white">Muriell</h1>
            {isPro && (
              <span className="px-2 py-0.5 bg-amber-500 text-black text-[7px] font-black uppercase tracking-widest rounded-md">PRO</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isAlarming && (
              <div className="p-2 bg-red-600/20 border border-red-600/40 rounded-full animate-pulse"><AlertTriangle className="w-4 h-4 text-red-500" /></div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-full border-white/10">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22C55E]"></span>
              <span className="text-[10px] font-black uppercase text-gray-300 tracking-wider">{stats.streak}d</span>
            </div>
          </div>
        </header>

        <div className="w-full animate-in fade-in duration-500">
          {activeTab === 'dashboard' && (
            <Dashboard 
              stats={stats} 
              tasks={tasks} 
              habits={habitSections} 
              onCompleteTask={handleCompleteTask} 
              onSnooze={handleSnoozeAlarm}
              isAlarming={isAlarming}
            />
          )}
          {activeTab === 'habits' && (
            <HabitBuilder 
              sections={habitSections}
              onToggleHabit={handleToggleHabit}
              onAddHabit={handleAddHabit}
              onEditHabitTime={handleEditHabitTime}
              onAddSection={handleAddHabitSection}
              onAddTask={handleAddTask} 
              onProgressUpdate={() => {}} 
            />
          )}
          {activeTab === 'study' && <StudyCompanion isPro={isPro} onUpgrade={() => setShowPaywall(true)} onStudyComplete={handleStudyComplete} />}
          {activeTab === 'tutor' && <ProTutor isPro={isPro} onUpgrade={() => setShowPaywall(true)} />}
          {activeTab === 'monitor' && <InternetMonitor onViolation={handleViolation} />}
          {activeTab === 'routine' && <MonthlyPlanner routine={routine} onRoutineGenerated={setRoutine} />}
          {activeTab === 'profile' && <Profile stats={stats} onUpdateStats={setStats} />}
        </div>
      </main>

      <MuriellGhost 
        mood={getMood()} 
        rageLevel={stats.rageMeter} 
        disciplineScore={stats.disciplineScore}
        onAddTask={handleAddTask} 
        roastIntensity={stats.roastIntensity} 
        isPro={isPro}
      />

      {showTaskAddedPopup && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-10 duration-500">
          <div className="glass-pink px-8 py-6 rounded-[2.5rem] border-[#EF216A]/40 shadow-[0_0_50px_rgba(239,33,106,0.3)] flex items-center gap-6">
            <div className="p-4 bg-[#EF216A] rounded-2xl shadow-lg animate-bounce">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-xl font-black italic uppercase tracking-tighter text-white">Protocol Logged</h4>
              <p className="text-[9px] text-pink-500 font-black uppercase tracking-[0.2em]">{showTaskAddedPopup}</p>
            </div>
          </div>
        </div>
      )}

      {showOnboarding && (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  );
};

const NavButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 group transition-all flex-1 md:flex-none ${active ? 'text-[#EF216A]' : 'text-gray-500 hover:text-white'}`}
  >
    <div className={`p-2 md:p-3.5 rounded-xl md:rounded-2xl transition-all duration-300 ${active ? 'bg-[#EF216A]/10 border border-[#EF216A]/20 shadow-[0_0_20px_rgba(239,33,106,0.1)] scale-105' : 'glass'}`}>
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5 md:w-6 md:h-6' }) : icon}
    </div>
    <span className={`text-[7px] md:text-[9px] uppercase font-black tracking-[0.1em] md:tracking-[0.15em] transition-all ${active ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'}`}>{label}</span>
  </button>
);

export default App;
