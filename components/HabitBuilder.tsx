
import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Flame, 
  Zap, 
  Plus, 
  PlusCircle,
  Coins,
  ShieldAlert,
  Target,
  ArrowRight,
  FolderPlus,
  X,
  Clock
} from 'lucide-react';
import { HabitSection, Task } from '../types';

interface HabitBuilderProps {
  sections: HabitSection[];
  onToggleHabit: (sectionId: string, habitId: string) => void;
  onAddHabit: (sectionId: string, title: string, time?: string) => void;
  onEditHabitTime: (sectionId: string, habitId: string, time: string) => void;
  onAddSection: (title: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'status' | 'deadline' | 'outcome'>, customDeadline?: string) => void;
  onProgressUpdate: (completedCount: number, totalCount: number) => void;
}

const HabitBuilder: React.FC<HabitBuilderProps> = ({ sections, onToggleHabit, onAddHabit, onEditHabitTime, onAddSection, onAddTask }) => {
  const [newTask, setNewTask] = useState({ title: '', description: '', stake: 10, deadline: '' });
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [addingHabitTo, setAddingHabitTo] = useState<string | null>(null);
  const [newHabit, setNewHabit] = useState({ title: '', time: '' });
  const [editingHabit, setEditingHabit] = useState<{ sectionId: string, habitId: string, time: string } | null>(null);
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);

  const handleAddTask = () => {
    if (!newTask.title.trim()) return;
    const deadlineISO = newTask.deadline ? new Date(newTask.deadline).toISOString() : undefined;
    onAddTask({
      title: newTask.title,
      description: newTask.description || "Active goal.",
      type: 'focus',
      stakeAmount: newTask.stake
    }, deadlineISO);
    setNewTask({ title: '', description: '', stake: 10, deadline: '' });
  };

  const handleAddSection = () => {
    if (!newSectionTitle.trim()) return;
    onAddSection(newSectionTitle);
    setNewSectionTitle('');
    setShowAddSection(false);
  };

  const handleAddHabit = (sectionId: string) => {
    if (!newHabit.title.trim()) return;
    onAddHabit(sectionId, newHabit.title, newHabit.time);
    setNewHabit({ title: '', time: '' });
    setAddingHabitTo(null);
  };

  const completedCount = sections.flatMap(s => s.habits).filter(h => h.completed).length;
  const totalCount = sections.flatMap(s => s.habits).length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 md:space-y-10 pb-32 animate-in fade-in duration-500">
      {/* 1. Protocol Entry */}
      <section className="glass p-6 md:p-12 rounded-[2rem] md:rounded-[3.5rem] border-white/10 bg-gradient-to-br from-[#EF216A]/5 to-transparent shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#EF216A]/10 rounded-xl">
              <PlusCircle className="w-5 h-5 text-[#EF216A]" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter">Commit Target</h2>
              <p className="text-[8px] text-gray-500 font-black uppercase tracking-[0.2em]">High-stakes goal entry</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAddSection(true)}
            className="w-full sm:w-auto px-4 py-2.5 glass border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all flex items-center justify-center gap-2"
          >
            <FolderPlus className="w-4 h-4 text-[#EF216A]" /> New Sector
          </button>
        </div>

        <div className="space-y-3 relative z-10">
          <div className="flex flex-col md:flex-row gap-3">
            <input 
              value={newTask.title}
              onChange={e => setNewTask({...newTask, title: e.target.value})}
              placeholder="What must be finished?"
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-sm focus:border-[#EF216A] outline-none placeholder:text-gray-800"
            />
            <div className="flex gap-3">
              <div className="w-24 flex items-center gap-2 px-4 py-4 bg-black/40 border border-white/10 rounded-xl">
                <span className="text-amber-500 font-black text-xs">$</span>
                <input 
                  type="number"
                  value={newTask.stake}
                  onChange={e => setNewTask({...newTask, stake: parseInt(e.target.value) || 0})}
                  className="w-full bg-transparent outline-none font-black text-amber-500 text-sm"
                />
              </div>
              <input 
                type="datetime-local"
                value={newTask.deadline}
                onChange={e => setNewTask({...newTask, deadline: e.target.value})}
                className="bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-[10px] font-black uppercase text-gray-400 focus:border-[#EF216A] outline-none"
              />
              <button 
                onClick={handleAddTask}
                className="flex-1 md:w-32 py-4 bg-zinc-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg flex items-center justify-center gap-2"
              >
                Sync <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. New Section Modal */}
      {showAddSection && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="glass p-8 rounded-[2rem] w-full max-w-sm border-[#EF216A]/20 relative">
            <button onClick={() => setShowAddSection(false)} className="absolute top-5 right-5 p-2 text-gray-500 hover:text-white"><X className="w-5 h-5"/></button>
            <h3 className="text-lg font-black italic uppercase tracking-tighter mb-5">Initialize Sector</h3>
            <input 
              value={newSectionTitle}
              onChange={e => setNewSectionTitle(e.target.value)}
              placeholder="Sector Name..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 mb-5 text-sm outline-none focus:border-[#EF216A]"
            />
            <button 
              onClick={handleAddSection}
              className="w-full py-4 bg-[#EF216A] text-white font-black uppercase rounded-xl tracking-widest text-[9px]"
            >
              Create Sector
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-2 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-none">Daily Rituals</h2>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[8px] mt-1">Systems define results.</p>
        </div>
        <div className="flex items-center gap-3 glass px-4 py-2 rounded-2xl border-white/5">
          <div className="text-right">
            <div className="text-[7px] font-black uppercase tracking-widest text-[#EF216A]">Compliance</div>
            <div className="text-lg font-black text-white italic leading-none">{completedCount}/{totalCount}</div>
          </div>
          <Zap className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* 4. Ritual Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <div key={section.id} className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-black uppercase italic tracking-tighter text-gray-500">{section.title || 'Untitled Section'}</span>
              <button onClick={() => setAddingHabitTo(section.id)} className="p-1.5 hover:bg-white/5 rounded-lg transition-all text-[#EF216A]">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              {addingHabitTo === section.id && (
                <div className="glass p-4 rounded-xl border-[#EF216A]/30 animate-in slide-in-from-top-1">
                  <input 
                    autoFocus
                    value={newHabit.title}
                    onChange={e => setNewHabit({...newHabit, title: e.target.value})}
                    placeholder="Ritual name..."
                    className="w-full bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest mb-3 text-white"
                  />
                  <div className="flex items-center gap-2 mb-3 px-2 py-2 bg-white/5 rounded-lg">
                    <Clock className="w-3 h-3 text-gray-500" />
                    <input 
                      type="time" 
                      value={newHabit.time}
                      onChange={e => setNewHabit({...newHabit, time: e.target.value})}
                      className="bg-transparent border-none outline-none text-[10px] font-black text-gray-400 w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAddHabit(section.id)} className="flex-1 py-1.5 bg-[#EF216A] text-white text-[7px] font-black uppercase rounded-lg">Add Ritual</button>
                    <button onClick={() => setAddingHabitTo(null)} className="flex-1 py-1.5 glass text-gray-500 text-[7px] font-black uppercase rounded-lg">Cancel</button>
                  </div>
                </div>
              )}

              {(section.habits || []).map((habit) => (
                <div 
                  key={habit.id}
                  className={`glass p-4 rounded-2xl border-white/5 flex flex-col transition-all active:scale-[0.98] ${habit.completed ? 'bg-green-500/5 border-green-500/20' : ''}`}
                >
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedHabit(expandedHabit === habit.id ? null : habit.id)}>
                    <div className="flex items-center gap-3 flex-1" onClick={(e) => { e.stopPropagation(); onToggleHabit(section.id, habit.id); }}>
                      <div className={`p-2 rounded-lg transition-all ${habit.completed ? 'bg-green-500 text-white' : 'bg-white/5 text-gray-600'}`}>
                        {habit.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      </div>
                      <div>
                        <span className={`font-black uppercase tracking-widest text-[9px] ${habit.completed ? 'text-white' : 'text-gray-500'}`}>{habit.title || 'Untitled Habit'}</span>
                        <div className="flex items-center gap-2 mt-1">
                          {habit.time && (
                             <span className={`text-[8px] font-black uppercase ${habit.alarmTriggered && !habit.completed ? 'text-red-500 animate-pulse' : 'text-[#EF216A]'}`}>
                               {habit.time}
                             </span>
                          )}
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                               <div key={i} className={`w-2 h-0.5 rounded-full ${i < (habit.streak % 5) ? 'bg-[#EF216A]' : 'bg-white/5'}`}></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingHabit({ sectionId: section.id, habitId: habit.id, time: habit.time || '' });
                        }}
                        className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all"
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </button>
                      <div className="text-center px-1">
                        <Flame className={`w-3.5 h-3.5 mx-auto ${habit.streak > 7 ? 'text-orange-500' : (habit.completed ? 'text-[#EF216A]' : 'text-gray-800')}`} />
                        <span className="text-[8px] font-black text-white">{habit.streak}d</span>
                      </div>
                    </div>
                  </div>

                  {expandedHabit === habit.id && (
                    <div className="mt-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-2 space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="glass p-2 rounded-xl text-center">
                          <div className="text-[6px] font-black uppercase text-gray-600">Total Streak</div>
                          <div className="text-xs font-black text-white">{habit.streak} Days</div>
                        </div>
                        <div className="glass p-2 rounded-xl text-center">
                          <div className="text-[6px] font-black uppercase text-gray-600">Status</div>
                          <div className="text-xs font-black text-[#EF216A]">{habit.completed ? 'SYNCED' : 'PENDING'}</div>
                        </div>
                      </div>
                      <p className="text-[8px] text-gray-500 font-medium uppercase tracking-tighter text-center italic">
                        "Consistency is the only metric that matters. Muriell is watching."
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Time Modal */}
      {editingHabit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="glass p-8 rounded-[2rem] w-full max-w-sm border-[#EF216A]/20 relative">
            <button onClick={() => setEditingHabit(null)} className="absolute top-5 right-5 p-2 text-gray-500 hover:text-white"><X className="w-5 h-5"/></button>
            <h3 className="text-lg font-black italic uppercase tracking-tighter mb-5">Set Ritual Time</h3>
            <div className="flex items-center gap-3 p-4 bg-black/40 border border-white/10 rounded-xl mb-6">
              <Clock className="w-5 h-5 text-[#EF216A]" />
              <input 
                type="time" 
                value={editingHabit.time}
                onChange={e => setEditingHabit({...editingHabit, time: e.target.value})}
                className="bg-transparent border-none outline-none text-xl font-black text-white w-full"
              />
            </div>
            <button 
              onClick={() => {
                onEditHabitTime(editingHabit.sectionId, editingHabit.habitId, editingHabit.time);
                setEditingHabit(null);
              }}
              className="w-full py-4 bg-[#EF216A] text-white font-black uppercase rounded-xl tracking-widest text-[9px]"
            >
              Sync Schedule
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitBuilder;
