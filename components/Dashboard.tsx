import React, { useState } from 'react';
import { 
  CheckCircle, 
  ShieldCheck,
  Target,
  Activity,
  ShieldAlert,
  BellRing,
  AlertTriangle,
  Clock,
  Zap,
  ChevronDown,
  ChevronUp,
  Info,
  RefreshCcw
} from 'lucide-react';
import { UserStats, Task, HabitSection, MuriellMood } from '../types';
import Logo from './Logo';

interface DashboardProps {
  stats: UserStats;
  tasks: Task[];
  habits: HabitSection[];
  onCompleteTask: (id: string) => void;
  onSnooze?: () => void;
  isAlarming?: boolean;
  onSyncGoogleTasks?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, tasks, habits, onCompleteTask, onSnooze, isAlarming, onSyncGoogleTasks }) => {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [activeStatDetail, setActiveStatDetail] = useState<string | null>(null);

  const pendingTasks = tasks.filter(t => t && t.status === 'pending');
  const missedTasks = tasks.filter(t => t && t.status === 'missed');
  const allHabits = habits.flatMap(s => s.habits || []);
  const completedHabits = allHabits.filter(h => h && h.completed).length;
  const habitPercentage = allHabits.length > 0 ? Math.round((completedHabits / allHabits.length) * 100) : 100;

  const getMood = () => {
    if (stats.disciplineScore > 90 && stats.rageMeter < 20) return MuriellMood.PROUD;
    if (stats.rageMeter > 80) return MuriellMood.RAGE;
    if (stats.rageMeter > 40) return MuriellMood.ANNOYED;
    return MuriellMood.CALM;
  };

  const mood = getMood();

  const formatDeadline = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-10 animate-in fade-in duration-500">
      {/* 1. Alarm Section */}
      {isAlarming && (
        <div className="glass-pink p-5 md:p-8 rounded-[2.5rem] md:rounded-[3.5rem] border-red-600/40 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden bg-red-600/5 animate-pulse">
          <div className="flex items-center gap-4 md:gap-6 relative z-10 w-full md:w-auto">
            <div className="p-4 bg-red-600 rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.4)]">
              <BellRing className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-white">Active Protocol Alarm</h2>
              <p className="text-[9px] text-red-400 font-black uppercase tracking-[0.2em]">Execution is mandatory. Forfeit window is closing.</p>
            </div>
          </div>
          <div className="flex gap-3 relative z-10 w-full md:w-auto">
            <button 
              onClick={onSnooze}
              className="flex-1 md:flex-none px-6 py-4 glass border border-red-600/30 text-red-500 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-red-600/10 transition-all hover-lift"
            >
              Snooze
            </button>
            <button 
              onClick={() => document.getElementById('task-list')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex-1 md:flex-none px-6 py-4 bg-zinc-900 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] shadow-lg hover-lift"
            >
              Resolve
            </button>
          </div>
        </div>
      )}

      {/* 2. Visual Mood & Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6">
          <MiniStat 
            label="Integrity" 
            value={`${stats.disciplineScore}%`} 
            color="pink" 
            isActive={activeStatDetail === 'Integrity'}
            onClick={() => setActiveStatDetail(activeStatDetail === 'Integrity' ? null : 'Integrity')}
            detail="Your overall compliance with protocols. Drops when you miss deadlines or rituals."
          />
          <MiniStat 
            label="Streak" 
            value={stats.streak} 
            color="amber" 
            isActive={activeStatDetail === 'Streak'}
            onClick={() => setActiveStatDetail(activeStatDetail === 'Streak' ? null : 'Streak')}
            detail="Consecutive days of perfect protocol execution. Resets on any failure."
          />
          <MiniStat 
            label="XP" 
            value={stats.xp} 
            color="blue" 
            isActive={activeStatDetail === 'XP'}
            onClick={() => setActiveStatDetail(activeStatDetail === 'XP' ? null : 'XP')}
            detail="Experience points earned through discipline. Unlocks higher level neural aura."
          />
          <MiniStat 
            label="Shame" 
            value={stats.shamePoints} 
            color="purple" 
            isActive={activeStatDetail === 'Shame'}
            onClick={() => setActiveStatDetail(activeStatDetail === 'Shame' ? null : 'Shame')}
            detail="Accumulated through mediocrity. Muriell's disappointment quantified."
          />
        </div>
        
        <div className={`lg:col-span-4 glass rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 border-l-4 transition-all duration-700 flex items-center gap-4 md:gap-8 hover-scale ${
          mood === MuriellMood.RAGE ? 'border-red-600 bg-red-600/10' : 
          mood === MuriellMood.PROUD ? 'border-green-500 bg-green-500/10' : 
          'border-[#EF216A] bg-white/5'
        }`}>
          <div className="relative shrink-0">
            <Logo 
              className="w-16 h-16 md:w-20 md:h-20 relative z-10" 
              expression={
                mood === MuriellMood.RAGE ? 'angry' : 
                mood === MuriellMood.PROUD ? 'proud' : 
                mood === MuriellMood.ANNOYED ? 'annoyed' : 'neutral'
              } 
            />
          </div>
          <div className="flex-1">
            <h4 className="text-[8px] font-black uppercase tracking-[0.3em] text-gray-500 mb-1">AI STATE</h4>
            <div className={`text-xl md:text-2xl font-black italic uppercase tracking-tighter ${
              mood === MuriellMood.RAGE ? 'text-red-500' : 
              mood === MuriellMood.PROUD ? 'text-green-500' : 'text-white'
            }`}>
              {mood}
            </div>
            <div className="mt-3 w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${
                  stats.rageMeter > 70 ? 'bg-red-500 shadow-[0_0_10px_#EF4444]' : 'bg-[#EF216A]'
                }`}
                style={{ width: `${stats.rageMeter}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
        <div id="task-list" className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#EF216A]" /> Active Protocols
              </h2>
              {onSyncGoogleTasks && (
                <button 
                  onClick={onSyncGoogleTasks}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-[#EF216A]/20 text-[#EF216A] text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors border border-white/5 hover:border-[#EF216A]/50"
                >
                  <RefreshCcw className="w-3 h-3" /> Sync Tasks
                </button>
              )}
            </div>
            <span className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em] bg-white/5 px-3 py-1.5 rounded-full">
              {pendingTasks.length} Active
            </span>
          </div>

          <div className="space-y-4">
            {pendingTasks.length === 0 && missedTasks.length === 0 ? (
              <div className="glass p-12 md:p-16 rounded-[2.5rem] md:rounded-[4rem] text-center border-dashed border-white/10">
                <ShieldCheck className="w-10 h-10 text-gray-800 mx-auto mb-3" />
                <p className="text-gray-500 font-black uppercase tracking-[0.2em] text-[9px]">System Efficient. No Tasks.</p>
              </div>
            ) : (
              <>
                {pendingTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className={`glass p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border-white/5 transition-all group relative overflow-hidden hover-scale ${task.alarmTriggered ? 'border-[#EF216A]/50 bg-[#EF216A]/5' : ''}`}
                  >
                    <div className="flex justify-between items-center relative z-10 gap-4">
                      <div className="flex-1 cursor-pointer" onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-[#EF216A]/20 text-[#EF216A] uppercase tracking-widest">{task.type}</span>
                          <h3 className="text-base md:text-xl font-black text-white italic truncate max-w-[150px] md:max-w-none">{task.title}</h3>
                          {expandedTask === task.id ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-gray-500 text-[10px] md:text-sm font-medium">
                          <p className="truncate max-w-[120px] md:max-w-none">{task.description}</p>
                          <div className="flex items-center gap-2">
                            <span className={`font-black uppercase text-[8px] flex items-center gap-1 ${new Date(task.deadline) < new Date() ? 'text-red-500 animate-pulse' : 'text-[#EF216A]'}`}>
                              <Clock className="w-3 h-3" /> {formatDeadline(task.deadline)}
                            </span>
                          </div>
                        </div>
                        
                        {expandedTask === task.id && (
                          <div className="mt-6 pt-6 border-t border-white/5 space-y-4 animate-in slide-in-from-top-4 duration-300">
                            <div>
                              <div className="text-[8px] font-black uppercase tracking-widest text-gray-600 mb-2">Protocol Details</div>
                              <p className="text-xs text-gray-400 leading-relaxed">{task.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="glass p-3 rounded-xl border-white/5">
                                <div className="text-[7px] font-black uppercase text-gray-600 mb-1">Expected Outcome</div>
                                <div className="text-[10px] text-white font-bold">{task.outcome || 'Success'}</div>
                              </div>
                              <div className="glass p-3 rounded-xl border-white/5">
                                <div className="text-[7px] font-black uppercase text-gray-600 mb-1">Penalty Stake</div>
                                <div className="text-[10px] text-amber-500 font-black">${task.stakeAmount}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end">
                          <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Stake</span>
                          <span className="text-xs font-black text-white">${task.stakeAmount}</span>
                        </div>
                        <button 
                          onClick={() => onCompleteTask(task.id)}
                          className="p-3 md:p-4 bg-zinc-900 text-white rounded-xl md:rounded-2xl hover:bg-[#EF216A] hover:text-white transition-all shadow-lg active:scale-90 hover-lift"
                        >
                          <CheckCircle className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {missedTasks.map((task) => (
                  <div key={task.id} className="glass p-5 md:p-8 rounded-[2rem] opacity-50 border-red-500/20 bg-red-500/5 relative overflow-hidden grayscale">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <h3 className="text-base font-black text-red-500 italic line-through">{task.title}</h3>
                        <p className="text-[9px] font-black uppercase text-red-500/60">FORFEITED - DISCIPLINE LOSS</p>
                      </div>
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border-white/10 relative overflow-hidden hover-scale transition-all duration-300">
            <h3 className="text-sm font-black italic uppercase tracking-tight flex items-center gap-2 mb-6 text-gray-400">
              <ShieldAlert className="w-4 h-4 text-[#EF216A]" /> Clinical Audit
            </h3>
            <div className="space-y-6 relative z-10">
              <p className="text-base italic text-pink-50 leading-relaxed font-serif">
                "{stats.disciplineScore > 75 ? 'Efficiency acceptable. Alarms must be cleared.' : 'System compromised. Mediocrity detected.'}"
              </p>
              
              <div className="space-y-4">
                <ProgressItem label="Ritual Sync" value={habitPercentage} color="bg-green-500" />
                <ProgressItem label="Compliance" value={tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0} color="bg-[#EF216A]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MiniStat: React.FC<{ 
  label: string, 
  value: string | number, 
  color: string,
  detail?: string,
  isActive?: boolean,
  onClick?: () => void
}> = ({ label, value, detail, isActive, onClick }) => (
  <div 
    onClick={onClick}
    className={`glass p-3 md:p-6 rounded-2xl md:rounded-[2.5rem] border-white/5 text-center group hover-lift cursor-pointer transition-all relative overflow-hidden ${isActive ? 'border-[#EF216A]/40 bg-[#EF216A]/5' : ''}`}
  >
    <div className="text-[7px] md:text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 mb-1">{label}</div>
    <div className="text-lg md:text-3xl font-black italic tracking-tighter text-white group-hover:text-[#EF216A] transition-colors">{value}</div>
    
    {isActive && detail && (
      <div className="mt-4 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2">
        <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 leading-relaxed">{detail}</p>
      </div>
    )}
    
    {!isActive && (
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Info className="w-3 h-3 text-gray-700" />
      </div>
    )}
  </div>
);

const ProgressItem: React.FC<{ label: string, value: number, color: string }> = ({ label, value, color }) => (
  <div>
    <div className="flex justify-between text-[8px] font-black uppercase mb-1.5 tracking-widest">
      <span className="text-gray-500">{label}</span>
      <span className="text-white">{value}%</span>
    </div>
    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
       <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

export default Dashboard;