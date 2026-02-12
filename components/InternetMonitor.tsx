
import React, { useState, useEffect, useRef } from 'react';
import { 
  Monitor, 
  TrendingDown, 
  Skull, 
  CheckCircle, 
  Activity,
  ShieldCheck,
  Zap,
  Globe,
  Loader2,
  Eye,
  EyeOff,
  AlertOctagon,
  Download,
  Link,
  Settings,
  Terminal,
  Layers,
  Search,
  Scan,
  Compass,
  Cpu
} from 'lucide-react';
import { DomainUsage } from '../types';
import { analyzeScreen } from '../services/geminiService';
import { speakWithMuriell } from '../services/audioService';

interface InternetMonitorProps {
  onViolation: () => void;
}

const InternetMonitor: React.FC<InternetMonitorProps> = ({ onViolation }) => {
  const [usage, setUsage] = useState<DomainUsage[]>(() => {
    const saved = localStorage.getItem('muriell_usage_log');
    return saved ? JSON.parse(saved) : [
      { domain: 'github.com', minutes: 125, category: 'productive' },
      { domain: 'youtube.com', minutes: 210, category: 'wasted' },
    ];
  });

  const [isWatching, setIsWatching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extensionStatus, setExtensionStatus] = useState<'searching' | 'linked' | 'missing'>(() => {
    return localStorage.getItem('muriell_protocol_active') === 'true' ? 'linked' : 'missing';
  });
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [activeTabs, setActiveTabs] = useState<string[]>([]);
  const [handshakeProgress, setHandshakeProgress] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    localStorage.setItem('muriell_usage_log', JSON.stringify(usage));
  }, [usage]);

  useEffect(() => {
    let interval: any;
    if (extensionStatus === 'linked') {
      const tabPool = [
        'youtube.com/watch?v=laziness', 
        'github.com/muriell/discipline', 
        'notion.so/performance-audit', 
        'reddit.com/r/productivity',
        'x.com/messages/1234',
        'stackoverflow.com/questions/efficiency'
      ];
      interval = setInterval(() => {
        const randomTab = tabPool[Math.floor(Math.random() * tabPool.length)];
        setActiveTabs(prev => {
          const newList = [randomTab, ...prev.slice(0, 4)];
          return Array.from(new Set(newList));
        });
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [extensionStatus]);

  const handleInitializeExtension = () => {
    setShowSyncModal(true);
    setHandshakeProgress(0);
    speakWithMuriell("Connecting to your browser. I'll be watching what you're doing.");
    
    const timer = setInterval(() => {
      setHandshakeProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const startVisualWatcher = async () => {
    if (extensionStatus !== 'linked') {
      handleInitializeExtension();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as any,
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsWatching(true);
      speakWithMuriell("Screen connected. I'm watching now.");

      stream.getTracks()[0].onended = () => stopVisualWatcher();
    } catch (err) {
      console.error("Link Failed:", err);
    }
  };

  const stopVisualWatcher = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setIsWatching(false);
  };

  const performAnalysis = async () => {
    if (!videoRef.current || !canvasRef.current || !isWatching || isAnalyzing) return;
    setIsAnalyzing(true);
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (video.videoWidth === 0) { setIsAnalyzing(false); return; }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL('image/jpeg', 0.6);

    try {
      const result = await analyzeScreen(base64Image);
      if (result.status === 'wasted') {
        onViolation();
        speakWithMuriell(result.roast);
      }
      setUsage(prev => {
        const domain = result.site || 'unknown';
        const exists = prev.find(u => u.domain === domain);
        if (exists) return prev.map(u => u.domain === domain ? { ...u, minutes: u.minutes + 1 } : u);
        return [...prev, { domain, minutes: 1, category: result.status }];
      });
    } catch (e) { console.error(e); } finally { setIsAnalyzing(false); }
  };

  useEffect(() => {
    let interval: any;
    if (isWatching) {
      interval = setInterval(performAnalysis, 25000); 
    }
    return () => clearInterval(interval);
  }, [isWatching]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10 pb-32">
      <canvas ref={canvasRef} className="hidden" />

      {showSyncModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="glass p-8 md:p-16 rounded-[4rem] max-w-2xl w-full border-[#EF216A]/40 shadow-2xl text-center relative overflow-hidden bg-black">
            <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
              <div className="h-full bg-[#EF216A] transition-all duration-300" style={{ width: `${handshakeProgress}%` }}></div>
            </div>
            
            <Cpu className="w-16 h-16 text-[#EF216A] mx-auto mb-8 animate-pulse" />
            <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white mb-6">Link Browser</h2>
            
            <div className="space-y-4 mb-10 text-left px-4">
              <div className={`flex items-center gap-4 transition-opacity ${handshakeProgress > 20 ? 'opacity-100' : 'opacity-20'}`}>
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Setting up tracker...</span>
              </div>
              <div className={`flex items-center gap-4 transition-opacity ${handshakeProgress > 80 ? 'opacity-100' : 'opacity-20'}`}>
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Finalizing connection...</span>
              </div>
            </div>

            {handshakeProgress === 100 ? (
              <button 
                onClick={() => {
                  localStorage.setItem('muriell_protocol_active', 'true');
                  setExtensionStatus('linked');
                  setShowSyncModal(false);
                  speakWithMuriell("Browser linked. Don't go on distracting sites.");
                }}
                className="w-full py-6 bg-[#EF216A] text-white font-black rounded-3xl shadow-xl hover:scale-105 transition-all text-xs uppercase tracking-[0.5em] flex items-center justify-center gap-4"
              >
                <Zap className="w-6 h-6" /> START TRACKING
              </button>
            ) : (
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#EF216A] animate-pulse">
                Connecting... {handshakeProgress}%
              </div>
            )}
          </div>
        </div>
      )}

      <div className="glass p-8 md:p-12 rounded-[4rem] border-[#EF216A]/40 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden bg-gradient-to-br from-white/5 to-transparent shadow-2xl">
        <div className="flex items-center gap-8 relative z-10">
          <div className={`p-6 rounded-[2.5rem] transition-all duration-1000 border-2 ${extensionStatus === 'linked' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-[#EF216A]/10 text-[#EF216A] border-[#EF216A]/20 animate-pulse'}`}>
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Focus Tracker</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className={`w-3 h-3 rounded-full ${extensionStatus === 'linked' ? 'bg-green-500 shadow-[0_0_10px_#22C55E]' : 'bg-red-500 animate-pulse'}`}></span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
                {extensionStatus === 'linked' ? 'CONNECTED' : 'NOT CONNECTED'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 relative z-10">
          {extensionStatus !== 'linked' ? (
            <button onClick={handleInitializeExtension} className="px-10 py-5 bg-white text-black rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all">Link Now</button>
          ) : (
            <button onClick={isWatching ? stopVisualWatcher : startVisualWatcher} className={`px-10 py-5 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-105 transition-all ${isWatching ? 'bg-black text-red-500 border border-red-500/30' : 'bg-[#EF216A] text-white'}`}>
              {isWatching ? <><EyeOff className="w-4 h-4 inline mr-2" /> Stop Watch</> : <><Eye className="w-4 h-4 inline mr-2" /> Start Watch</>}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="glass rounded-[4rem] border-white/10 overflow-hidden bg-black flex flex-col min-h-[500px] shadow-2xl relative">
             <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[length:100%_2px,3px_100%]"></div>
            
            <div className="flex items-center justify-between p-8 border-b border-white/5 relative z-30">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${isWatching ? 'bg-red-600 animate-pulse' : 'bg-gray-800'}`}></div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-600">
                  {isWatching ? 'WATCHING SCREEN' : 'SCREEN OFF'}
                </span>
              </div>
              {isAnalyzing && <Loader2 className="w-5 h-5 text-[#EF216A] animate-spin" />}
            </div>
            
            <div className="flex-1 relative flex items-center justify-center">
              <video ref={videoRef} autoPlay muted playsInline className={`w-full h-full object-contain transition-opacity duration-1000 ${isWatching ? 'opacity-100' : 'opacity-0'}`} />
              {!isWatching && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center space-y-6">
                  <Monitor className="w-16 h-16 text-gray-900" />
                  <p className="text-[10px] text-gray-700 font-black uppercase tracking-widest max-w-[200px]">Start the watch to track your focus.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="glass p-8 rounded-[4rem] border-white/10 shadow-xl bg-gradient-to-br from-white/5 to-transparent">
            <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-4 mb-8">
              <Activity className="w-6 h-6 text-[#EF216A]" /> Site History
            </h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {usage.map((u, i) => (
                <div key={i} className="flex justify-between items-center p-5 glass rounded-[2rem] border-white/5 hover:border-[#EF216A]/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full ${u.category === 'productive' ? 'bg-green-500' : 'bg-[#EF216A]'}`}></div>
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-tight">{u.domain}</span>
                  </div>
                  <span className="text-lg font-black italic text-gray-500">{u.minutes}m</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternetMonitor;
