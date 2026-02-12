
import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Flame, 
  Dumbbell, 
  Brain, 
  Zap, 
  ShieldCheck, 
  Plus, 
  PlusCircle,
  Clock,
  Coins
} from 'lucide-react';
import { HabitSection, Task } from '../types';

interface HabitBuilderProps {
  onProgressUpdate: (completedCount: number, totalCount: number) => void;
  onAddTask: (task: Omit<Task, 'id' | 'status' | 'deadline' | 'outcome'>) => void;
}

const HabitBuilder: React.FC<HabitBuilderProps> = ({ onProgressUpdate, onAddTask }) => {
  const [sections, setSections] = useState<HabitSection[]>([
    {
      id: 'body',
      title: 'Fitness & Health',
      icon: 'Dumbbell',
      habits: [
        { id: 'h1', title: 'Wake Up Early', completed: false, streak: 12 },
        { id: 'h2', title: 'Exercise', completed: true, streak: 5 },
      ]
    },
    {
      id: 'mind',
      title: 'Mental Focus',
      icon: 'Brain',
      habits: [
        { id: 'h4', title: 'Meditation', completed: false, streak: 3 },
      ]
    }
  ]);

  const [newTask, setNewTask] = useState({ title: '', description: '', stake: 10 });

  const toggleHabit = (sectionId: string, habitId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        habits: section.habits.map(habit => {
          if (habit.id !== habitId) return habit;
          const newCompleted = !habit.completed;
          return {
            ...habit,
            completed: newCompleted,
            streak: newCompleted ? habit.streak + 1 : Math.max(0, habit.streak - 1)
          };
        })
      };
    }));
  };

  const handleAddTask = () => {
    if (!newTask.title.trim()) return;
    onAddTask({
      title: newTask.title,
      description: newTask.description || "Daily work goal.",
      type: 'focus',
      stakeAmount: newTask.stake
    });
    setNewTask({ title: '', description: '', stake: 10 });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10 pb-32 animate-in fade-in duration-700">
      {/* 1. Protocol Entry (Daily Task Addition) */}
      <section className="glass p-8 md:p-12 rounded-[3.5rem] border-white/5 bg-gradient-to-br from-[#EF216A]/5 to-transparent shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <PlusCircle className="w-8 h-8 text-[#EF216A]" />
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Add a Task</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-6">
            <input 
              value={newTask.title}
              onChange={e => setNewTask({...newTask, title: e.target.value})}
              placeholder="What do you need to do? (e.g. Finish homework)"
              className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-4 text-lg focus:border-[#EF216A] outline-none"
            />
          </div>
          <div className="md:col-span-3">
             <div className="flex items-center gap-3 px-6 py-4 bg-black/40 border-2 border-white/5 rounded-2xl">
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-gray-500">$</span>
                <input 
                  type="number"
                  value={newTask.stake}
                  onChange={e => setNewTask({...newTask, stake: parseInt(e.target.value)})}
                  className="w-full bg-transparent outline-none font-bold text-amber-500"
                />
             </div>
          </div>
          <div className="md:col-span-3">
            <button 
              onClick={handleAddTask}
              className="w-full py-4 bg-white text-black font-black uppercase rounded-2xl hover:bg-[#EF216A] hover:text-white transition-all shadow-xl"
            >
              Add Goal
            </button>
          </div>
        </div>
      </section>

      {/* 2. Habits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sections.map((section) => (
          <div key={section.id} className="space-y-6">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-gray-500 px-4">{section.title}</h3>
            <div className="space-y-4">
              {section.habits.map((habit) => (
                <div 
                  key={habit.id}
                  onClick={() => toggleHabit(section.id, habit.id)}
                  className={`glass p-6 rounded-[2rem] border-white/5 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] ${habit.completed ? 'bg-[#EF216A]/10 border-[#EF216A]/30' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    {habit.completed ? <CheckCircle2 className="w-6 h-6 text-[#EF216A]" /> : <Circle className="w-6 h-6 text-gray-600" />}
                    <span className={`font-bold transition-all ${habit.completed ? 'text-white' : 'text-gray-500'}`}>{habit.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Flame className={`w-3 h-3 ${habit.streak > 5 ? 'text-orange-500' : 'text-gray-800'}`} />
                    <span className="text-[10px] font-black text-gray-700">{habit.streak}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HabitBuilder;
