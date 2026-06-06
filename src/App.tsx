import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Habit, TimelineItem, ServerState } from "./types";
import {
  auth,
  initAuth,
  loginWithGoogle,
  logout
} from "./firebase";
import { User } from "firebase/auth";
import { 
  Zap, 
  Calendar, 
  BarChart2, 
  Settings, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  Flame, 
  CheckCircle,
  TrendingUp,
  Award,
  Sparkles,
  Compass,
  LogOut
} from "lucide-react";
import Splash from "./components/Splash";
import HojeTab from "./components/HojeTab";
import BussolaTab from "./components/BussolaTab";
import HabitosTab from "./components/HabitosTab";
import AnalyticsTab from "./components/AnalyticsTab";
import AjustesTab from "./components/AjustesTab";
import HabitoIndividualModal from "./components/HabitoIndividualModal";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user chose to bypass Google authentication (e.g. on custom domain like Railway)
    const isBypassed = localStorage.getItem("pulse_legacy_bypass_auth") === "true";
    if (isBypassed) {
      setUser({
        uid: "local-guest",
        displayName: "Acesso Local",
        email: "local@pulse"
      } as any);
      setIsAuthLoading(false);
      return;
    }

    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
        setIsAuthLoading(false);
      },
      () => {
        setUser(null);
        setIsAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const [activeTab, setActiveTab] = useState<'hoje' | 'bussola' | 'habitos' | 'analytics' | 'ajustes'>('hoje');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [dynamicPhrase, setDynamicPhrase] = useState("Você ainda não venceu o dia.");
  const [dismissedCongrats, setDismissedCongrats] = useState(false);

  // Standard Web Audio API synthesize engine for direct militaristic feedback sounds
  const playHapticSound = (type: 'tick' | 'complete' | 'reset' | 'warguerra') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (type === 'tick') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(580, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'complete') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();
        
        osc1.frequency.setValueAtTime(440, ctx.currentTime); // A4
        osc2.frequency.setValueAtTime(554.37, ctx.currentTime + 0.07); // C#5
        
        gain1.gain.setValueAtTime(0.08, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        gain2.gain.setValueAtTime(0.08, ctx.currentTime + 0.07);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        
        osc1.connect(gain1);
        osc2.connect(gain2);
        gain1.connect(ctx.destination);
        gain2.connect(ctx.destination);
        
        osc1.start();
        osc2.start(ctx.currentTime + 0.07);
        osc1.stop(ctx.currentTime + 0.25);
        osc2.stop(ctx.currentTime + 0.35);
      } else if (type === 'reset') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'warguerra') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.frequency.setValueAtTime(95, ctx.currentTime);
        osc2.frequency.setValueAtTime(97, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.55);
        osc2.stop(ctx.currentTime + 0.55);
      }
    } catch (e) {
      console.log("Audio failure:", e);
    }
  };

  // Load app state
  const loadState = async () => {
    try {
      const response = await fetch("/api/state");
      const data: ServerState = await response.json();
      setHabits(data.habits || []);
    } catch (err) {
      console.error("Failed loading state:", err);
    }
  };

  // Load dynamic stoc phrases and quotes from insights
  const loadInsights = async () => {
    try {
      const response = await fetch("/api/insights");
      const data = await response.json();
      if (data.dynamicPhrase) {
        setDynamicPhrase(data.dynamicPhrase);
      }
    } catch (e) {
      console.error("Insights load err:", e);
    }
  };

  useEffect(() => {
    loadState();
    loadInsights();
  }, []);

  // Update single habit values directly
  const handleUpdateHabit = async (id: string, currentValue: number, completed = false, todayPhoto?: string) => {
    // Keep reference to previous habits for optimistic rollback in case of network failures
    const previousHabits = [...habits];

    try {
      if (completed) {
        playHapticSound('complete');
      } else {
        playHapticSound('tick');
      }

      // Optimistically update the primary habit list state instantly
      setHabits(prev => prev.map(h => {
        if (h.id === id) {
          const updated = { ...h, currentValue, completed };
          if (todayPhoto !== undefined) {
            updated.todayPhoto = todayPhoto;
          }
          return updated;
        }
        return h;
      }));

      // If active overlay/modal is open, sync details instantly too
      if (selectedHabit && selectedHabit.id === id) {
        setSelectedHabit(prev => prev ? { ...prev, currentValue, completed, todayPhoto: todayPhoto !== undefined ? todayPhoto : prev.todayPhoto } : null);
      }

      const response = await fetch(`/api/habits/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentValue, completed, todayPhoto })
      });
      
      const data = await response.json();
      if (data.success && data.habit) {
        // Sync with exact server-side model containing log aggregations
        setHabits(prev => prev.map(h => h.id === id ? data.habit : h));
        if (selectedHabit && selectedHabit.id === id) {
          setSelectedHabit(data.habit);
        }
      } else if (!data.success) {
        // Rollback state if server returns failure
        setHabits(previousHabits);
      }
    } catch (err) {
      console.error("Error updating habit, rolling back:", err);
      // Rollback state if network request fails
      setHabits(previousHabits);
    }
  };

  // Add new habit wizard onboard
  const handleCreateHabit = async (habitData: Partial<Habit>) => {
    try {
      const response = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(habitData)
      });
      const data = await response.json();
      if (data.success) {
        setHabits(prev => [...prev, data.habit]);
        loadInsights();
      }
    } catch (err) {
      console.error("Error creating habit:", err);
    }
  };

  // Delete habit
  const handleDeleteHabit = async (id: string) => {
    try {
      const response = await fetch(`/api/habits/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        setHabits(prev => prev.filter(h => h.id !== id));
        loadInsights();
      }
    } catch (err) {
      console.error("Error deleting habit:", err);
    }
  };

  // Reset current cycle day
  const handleResetDay = async () => {
    try {
      const response = await fetch("/api/reset-day", { method: "POST" });
      const data = await response.json();
      if (data.success) {
        setHabits(data.habits || []);
        setDismissedCongrats(false);
        loadInsights();
      }
    } catch (err) {
      console.error("Error resetting day:", err);
    }
  };

  // Factory Restore default 10 habits
  const handleResetDatabase = async () => {
    try {
      const response = await fetch("/api/reset-db", { method: "POST" });
      const data = await response.json();
      if (data.success) {
        setHabits(data.habits || []);
        setDismissedCongrats(false);
        loadInsights();
      }
    } catch (err) {
      console.error("Error restoring database defaults:", err);
    }
  };

  // Compute live scores
  const totalCount = habits.length;
  const completedCount = habits.filter(h => h.completed).length;
  const todayScore = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Track if 100% completed and modal wasn't dismissed
  const showCongratsScreen = todayScore === 100 && totalCount > 0 && !dismissedCongrats;

  if (isAuthLoading) {
    return <Splash phrase="Conectando aos servidores..." onComplete={() => {}} />;
  }

  const handleLogin = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const res = await loginWithGoogle();
      if (res && res.user) {
        setUser(res.user);
      }
    } catch (e: any) {
      console.error("Firebase dynamic sign in error details:", e);
      let errorMsg = e?.message || "Ocorreu um erro ao conectar ao Google.";
      if (e?.code === "auth/unauthorized-domain") {
        errorMsg = "Este domínio não está autorizado no Console do Firebase. Você precisa acessar seu Firebase Console (Authentication -> Settings -> Authorized Domains) e autorizar o domínio de produção da Railway.";
      } else if (e?.code === "auth/popup-closed-by-user") {
        errorMsg = "A janela de autenticação foi fechada por você antes de ser concluída.";
      } else if (e?.code === "auth/popup-blocked") {
        errorMsg = "O navegador bloqueou a janela de autenticação. Por favor, libere popups para este site.";
      }
      setAuthError(errorMsg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleBypassLogin = () => {
    localStorage.setItem("pulse_legacy_bypass_auth", "true");
    setUser({
      uid: "local-guest",
      displayName: "Acesso Local",
      email: "local@pulse"
    } as any);
  };

  const handleLogout = async () => {
    localStorage.removeItem("pulse_legacy_bypass_auth");
    try {
      await logout();
    } catch (e) {
      console.error("Logout err:", e);
    }
    setUser(null);
  };

  // Se o usuário não estiver logado, exibe a tela de login
  if (!user) {
    return (
      <div className="w-full h-[100dvh] flex flex-col relative items-center justify-center bg-[#000000] p-6 text-center text-white select-none">
        <div className="max-w-sm w-full space-y-10 z-10">
          <div className="space-y-4">
            <h1 className="text-4xl font-display font-black tracking-tightglow-blue">PULSE</h1>
            <p className="text-zinc-400 font-mono text-[10px] uppercase tracking-widest leading-relaxed">
              O tempo não para. Proteja sua cadência operacional na nuvem.
            </p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center gap-3 py-4 bg-white hover:bg-zinc-200 text-black font-sans font-bold text-sm tracking-wide rounded-2xl transition cursor-pointer"
            >
              <Zap className="w-5 h-5 text-zinc-900" />
              <span>Autenticar com Google</span>
            </button>

            <button
              onClick={handleBypassLogin}
              className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-sans font-medium text-xs tracking-wider rounded-xl border border-white/5 transition cursor-pointer"
            >
              <span>Acessar sem Google Auth (Modo Local/Postgres)</span>
            </button>
          </div>

          {authError && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/20 text-left space-y-2">
              <span className="text-[9px] font-mono font-bold text-red-400 uppercase tracking-widest block">DIAGNÓSTICO DE CONEXÃO</span>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans">{authError}</p>
              <div className="pt-2 border-t border-white/10 flex flex-col gap-1 text-[10px] text-zinc-400">
                <p>💡 <strong className="text-white">Solução recomendada:</strong> Use o botão de login sem Google Auth acima para acessar imediatamente via PostgreSQL.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div id="applet-viewport" className="w-full h-[100dvh] min-h-[100dvh] pt-[calc(env(safe-area-inset-top,0px))] bg-[#000000] text-white flex flex-col justify-between overflow-hidden relative font-sans">
      
      {/* 1. Splash Screen Initial Animation Overlay */}
      <AnimatePresence mode="wait">
        {showSplash && (
          <Splash 
            phrase={dynamicPhrase} 
            onComplete={() => {
              setShowSplash(false);
              playHapticSound('complete');
            }} 
          />
        )}
      </AnimatePresence>

      {/* 2. Full screen Congrats 100% finished overlay */}
      <AnimatePresence>
        {showCongratsScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-center select-none"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="max-w-md bg-zinc-950 border border-white/10 rounded-[32px] p-8 flex flex-col items-center space-y-5 shadow-2xl relative"
            >
              {/* Special green pulsing medal */}
              <div className="w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center animate-bounce shadow-lg shadow-emerald-500/10">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">CONQUISTA ALCANÇADA</span>
                <h2 className="text-2xl font-display font-black text-white tracking-tight uppercase">O dia foi vencido!</h2>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed font-mono uppercase">
                "Você manteve a cadência operacional inabalável hoje. O volume que você imprimiu cria inevitabilidade absoluta do seu sucesso."
              </p>

              <button
                id="btn-dismiss-congrats"
                onClick={() => {
                  playHapticSound('tick');
                  setDismissedCongrats(true);
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-black font-mono font-bold text-xs uppercase tracking-widest rounded-xl transition cursor-pointer"
              >
                Continuar Operação
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Individual Habit detailed Overlay/Modal */}
      <AnimatePresence>
        {selectedHabit && (
          <HabitoIndividualModal
            habit={selectedHabit}
            onClose={() => setSelectedHabit(null)}
            onUpdateHabit={handleUpdateHabit}
            playHapticSound={playHapticSound}
          />
        )}
      </AnimatePresence>

      {/* 4. MAIN CENTRAL CANVAS (TABS DISPLAY MECHANISM) */}
      <main id="app-viewport-layer" className="flex-1 overflow-hidden p-3 md:p-5 max-w-5xl w-full mx-auto flex flex-col justify-between">
        <div id="tab-canvas-container" className="flex-1 overflow-hidden">
          {activeTab === 'hoje' && (
            <HojeTab 
              habits={habits}
              onUpdateHabit={handleUpdateHabit}
              onSelectHabit={(habit) => setSelectedHabit(habit)}
              playHapticSound={playHapticSound}
            />
          )}

          {activeTab === 'bussola' && (
            <BussolaTab 
              playHapticSound={playHapticSound}
            />
          )}

          {activeTab === 'habitos' && (
            <HabitosTab
              habits={habits}
              onCreateHabit={handleCreateHabit}
              onDeleteHabit={handleDeleteHabit}
              playHapticSound={playHapticSound}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsTab
              playHapticSound={playHapticSound}
            />
          )}

          {activeTab === 'ajustes' && (
            <AjustesTab
              onResetDatabase={handleResetDatabase}
              onResetDay={handleResetDay}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled(!soundEnabled)}
              onLogout={handleLogout}
              playHapticSound={playHapticSound}
            />
          )}
        </div>
      </main>

      {/* 5. FIXED BOTTOM HORIZONTAL NAVIGATION FOOTER MENU */}
      <footer id="app-footer" className="w-full shrink-0 bg-[#000000] border-t border-white/5 pt-2 pb-safe-bottom px-4 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-lg mx-auto flex justify-around items-center h-12 uppercase font-mono text-[9px] font-bold">
          {/* Tabs item array */}
          {(['hoje', 'bussola', 'habitos', 'analytics', 'ajustes'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                id={`nav-tab-btn-${tab}`}
                key={tab}
                onClick={() => {
                  playHapticSound('tick');
                  setActiveTab(tab);
                }}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-all duration-300 py-1.5 px-3.5 rounded-xl ${
                  isActive 
                    ? 'text-white bg-zinc-900 border border-white/10 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab === 'hoje' && <Calendar className="w-4 h-4" />}
                {tab === 'bussola' && <Compass className="w-4 h-4" />}
                {tab === 'habitos' && <Zap className="w-4 h-4" />}
                {tab === 'analytics' && <BarChart2 className="w-4 h-4" />}
                {tab === 'ajustes' && <Settings className="w-4 h-4" />}
                <span className="text-[9px] tracking-wide font-sans block mt-0.5">{tab === 'hoje' ? 'Hoje' : tab === 'bussola' ? 'Bússola' : tab === 'habitos' ? 'Hábitos' : tab === 'analytics' ? 'Analytics' : 'Ajustes'}</span>
              </button>
            );
          })}
        </div>
      </footer>

    </div>
  );
}
