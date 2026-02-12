
import React from 'react';
import { 
  Trophy, 
  Flame, 
  Zap, 
  Clock, 
  CheckCircle, 
  ShieldCheck,
  TrendingUp,
  Coins,
  ArrowRight
} from 'lucide-react';
import { UserStats, Task } from '../types';

interface DashboardProps {
  stats: UserStats;
  tasks: Task[];
  onCompleteTask: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, tasks, onCompleteTask }) => {
  const pendingTasks = tasks.filter(t => t.status === 'pending');

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-1000">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <MiniStat label="Discipline" value={stats.disciplineScore} color="pink" />
        <MiniStat label="Streak" value={stats.streak} color="amber" />
        <MiniStat label="Rage" value={stats.rageMeter} color="red" />
        <MiniStat label="Total XP" value={stats.xp} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Active Protocols Feed */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-4">
              <Clock className="w-8 h-8 text-[#EF216A]" /> Tasks to do
            </h2>
            <span className="text-[10px] font-black uppercase text-gray-600 tracking-widest bg-white/5 px-4 py-2 rounded-full">
              {pendingTasks.length} left
            </span>
          </div>

          <div className="space-y-4">
            {pendingTasks.length === 0 ? (
              <div className="glass p-20 rounded-[4rem] text-center border-dashed border-white/5">
                <ShieldCheck className="w-16 h-16 text-gray-800 mx-auto mb-4" />
                <p className="text-gray-600 font-black uppercase tracking-[0.3em] text-[10px]">All done. You're safe for now.</p>
              </div>
            ) : (
              pendingTasks.map((task) => (
                <div key={task.id} className="glass p-8 rounded-[3rem] border-white/5 hover:border-[#EF216A]/30 transition-all group relative overflow-hidden">
                  <div className="flex justify-between items-center relative z-10">
                    <div>
                      <h3 className="text-2xl font-black text-white italic">{task.title}</h3>
                      <p className="text-gray-500 text-sm font-medium mt-1">{task.description}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-amber-500 font-black flex items-center gap-2 bg-amber-500/5 px-4 py-2 rounded-2xl border border-amber-500/10">
                        <Coins className="w-4 h-4" /> ${task.stakeAmount}
                      </div>
                      <button 
                        onClick={() => onCompleteTask(task.id)}
                        className="p-5 bg-white text-black rounded-3xl hover:bg-[#EF216A] hover:text-white transition-all shadow-xl"
                      >
                        <CheckCircle className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Analytics */}
        <div className="lg:col-span-4 space-y-8">
          <div className="glass p-8 rounded-[4rem] border-white/10 bg-gradient-to-br from-white/5 to-transparent">
            <h3 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-4 mb-8 text-gray-400">
              <TrendingUp className="w-6 h-6 text-green-500" /> Focus Level
            </h3>
            <div className="space-y-8">
              <div>
                <div className="flex justify-between text-[10px] font-black uppercase mb-3">
                  <span className="text-gray-600">Daily Progress</span>
                  <span className="text-white">82%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-green-500 shadow-[0_0_15px_#22C55E]" style={{ width: '82%' }}></div>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 italic leading-relaxed">
                "You're doing okay today. Don't ruin it by slacking off now."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MiniStat: React.FC<{ label: string, value: number, color: string }> = ({ label, value, color }) => (
  <div className="glass p-8 rounded-[3rem] border-white/5 text-center transition-all hover:-translate-y-2">
    <div className="text-4xl font-black italic tracking-tighter text-white mb-1">{value}</div>
    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">{label}</div>
  </div>
);

export default Dashboard;
