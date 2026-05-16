
import React, { useState, useRef } from 'react';
import { 
  User, 
  Camera, 
  History, 
  TrendingUp, 
  LogOut, 
  Shield, 
  Mail, 
  Calendar,
  Award,
  Clock,
  ChevronRight
} from 'lucide-react';
import { UserStats } from '../types';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { taskService } from '../services/taskService';
import { motion } from 'motion/react';

interface ProfileProps {
  stats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
}

const Profile: React.FC<ProfileProps> = ({ stats, onUpdateStats }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    // In a real app, we'd upload to Firebase Storage. 
    // For this demo, we'll use a local base64 preview.
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      const newStats = { ...stats, photoURL: base64 };
      onUpdateStats(newStats);
      if (auth.currentUser) {
        await taskService.syncUserData(auth.currentUser.uid, { photoURL: base64 });
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-4 md:p-10 max-w-5xl mx-auto space-y-10 pb-32">
      {/* Header / Identity */}
      <section className="glass p-8 md:p-12 rounded-[3rem] border-white/5 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#EF216A]/10 via-transparent to-transparent pointer-events-none"></div>
        
        <div className="relative group">
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-[3rem] overflow-hidden border-4 border-white/10 shadow-2xl bg-zinc-900 flex items-center justify-center">
            {stats.photoURL ? (
              <img src={stats.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-16 h-16 text-gray-700" />
            )}
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-2 right-2 p-4 bg-[#EF216A] text-white rounded-2xl shadow-xl hover:scale-110 transition-all active:scale-95"
          >
            <Camera className="w-5 h-5" />
          </button>
          <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
          {isUploading && (
            <div className="absolute inset-0 bg-black/60 rounded-[3rem] flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="space-y-1">
            <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
              {auth.currentUser?.displayName || 'Protocol User'}
            </h2>
            <div className="flex items-center justify-center md:justify-start gap-3 text-gray-500 font-bold uppercase tracking-widest text-[10px]">
              <Mail className="w-3 h-3" />
              {auth.currentUser?.email}
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <div className="px-4 py-2 glass rounded-xl border-white/5 flex items-center gap-2">
              <Shield className="w-3 h-3 text-[#EF216A]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Level {stats.level}</span>
            </div>
            <div className="px-4 py-2 glass rounded-xl border-white/5 flex items-center gap-2">
              <Award className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">{stats.xp} XP</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => signOut(auth)}
          className="p-6 glass border-red-500/20 text-red-500 rounded-3xl hover:bg-red-500/10 transition-all group"
        >
          <LogOut className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Reading History */}
        <section className="glass p-8 rounded-[3rem] border-white/5 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-[#EF216A]" />
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Reading History</h3>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Recent Activity</span>
          </div>

          <div className="space-y-3">
            {stats.readingHistory && stats.readingHistory.length > 0 ? (
              stats.readingHistory.map((item, i) => (
                <div key={i} className="p-4 glass rounded-2xl border-white/5 flex items-center justify-between group hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/5 rounded-lg">
                      <Clock className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-[#EF216A] transition-colors">{item.title}</p>
                      <p className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">{new Date(item.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-800 group-hover:text-white transition-colors" />
                </div>
              ))
            ) : (
              <div className="py-10 text-center space-y-3 opacity-30">
                <History className="w-10 h-10 mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-widest">No history recorded</p>
              </div>
            )}
          </div>
        </section>

        {/* Consistency History */}
        <section className="glass p-8 rounded-[3rem] border-white/5 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Consistency</h3>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Last 7 Days</span>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 px-2">
            {stats.consistencyHistory && stats.consistencyHistory.length > 0 ? (
              stats.consistencyHistory.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                  <div className="relative w-full">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${item.score}%` }}
                      className={`w-full rounded-t-xl transition-all group-hover:brightness-125 ${item.score > 80 ? 'bg-green-500/40' : item.score > 50 ? 'bg-blue-500/40' : 'bg-[#EF216A]/40'}`}
                    />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black text-white">
                      {item.score}%
                    </div>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">
                    {new Date(item.date).toLocaleDateString(undefined, { weekday: 'short' })}
                  </span>
                </div>
              ))
            ) : (
              <div className="w-full py-10 text-center space-y-3 opacity-30">
                <TrendingUp className="w-10 h-10 mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-widest">No data available</p>
              </div>
            )}
          </div>

          <div className="p-6 glass rounded-2xl border-white/5 bg-blue-500/5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Current Streak</p>
                <p className="text-2xl font-black italic text-white">{stats.streak} Days</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Profile;
