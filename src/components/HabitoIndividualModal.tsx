import React, { useState } from "react";
import { Habit, HabitLog } from "../types";
import { 
  X, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Zap,
  Activity,
  Award,
  ChevronRight,
  Target,
  BrainCircuit,
  TrendingDown,
  Edit3
} from "lucide-react";
import { iconMap, colorPresets } from "../data";
import { motion, AnimatePresence } from "motion/react";

interface HabitoIndividualModalProps {
  habit: Habit;
  onClose: () => void;
  onUpdateHabit: (id: string, currentValue: number, completed?: boolean, todayPhoto?: string, fullHabitUpdate?: Partial<Habit>) => void;
  playHapticSound: (type: 'tick' | 'complete' | 'reset' | 'warguerra') => void;
}

export default function HabitoIndividualModal({ 
  habit, 
  onClose, 
  onUpdateHabit, 
  playHapticSound 
}: HabitoIndividualModalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'semana' | 'mes' | 'tendencia' | 'historico'>('semana');

  const IconComponent = iconMap[habit.icon] || Zap;
  const colorKey = habit.color || "blue";
  const colorConfig = colorPresets[colorKey as keyof typeof colorPresets] || colorPresets.blue;

  // Map connections
  const connectedMacro = React.useMemo(() => {
    if (!habit.connectedMacroId) return null;
    try {
      const saved = localStorage.getItem("pulse_goals_v2");
      const goals = saved ? JSON.parse(saved) : [];
      return goals.find((g: any) => g.id === habit.connectedMacroId);
    } catch { return null; }
  }, [habit.connectedMacroId]);

  const connectedTrait = React.useMemo(() => {
    if (!habit.connectedTraitId) return null;
    try {
      const saved = localStorage.getItem("pulse_identity_characteristics_v1");
      const traits = saved ? JSON.parse(saved) : [];
      for (const t of traits) {
        const pair = t.pairs.find((p: any) => p.id === habit.connectedTraitId);
        if (pair) return { charName: t.name, pair };
      }
      return null;
    } catch { return null; }
  }, [habit.connectedTraitId]);

  const [outcomeDraft, setOutcomeDraft] = useState(habit.resultOutcome || "");

  const handleSaveOutcome = () => {
    playHapticSound('tick');
    fetch(`/api/habits/${habit.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resultOutcome: outcomeDraft })
    }).catch(e => console.error(e));
  };
  const logsList = habit.logs || [];
  const completedLogsCount = logsList.filter(l => l.completed).length;
  const totalLogsCount = logsList.length;
  const weeklyAverage = totalLogsCount > 0 ? Math.round((completedLogsCount / totalLogsCount) * 100) : 0;

  const handleProgressChange = (increment: number) => {
    playHapticSound('tick');
    const nextVal = Math.max(0, habit.currentValue + increment);
    const completed = nextVal >= habit.targetValue;
    onUpdateHabit(habit.id, nextVal, completed);
  };

  const handleToggleComplete = () => {
    playHapticSound(habit.completed ? 'reset' : 'complete');
    const completed = !habit.completed;
    const value = completed ? habit.targetValue : 0;
    onUpdateHabit(habit.id, value, completed);
  };

  // Compile last 7 days representation
  const getWeeklyData = () => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const log = logsList.find(l => l.date === dateStr);
      
      let score = 0;
      if (log) {
        score = log.completed ? 100 : Math.round((log.value / habit.targetValue) * 100);
      } else {
        // Real tracking, if there's no log, score is true 0
        score = 0;
      }
      return {
        label: days[d.getDay()],
        score: score,
        completed: score >= 100
      };
    });
  };

  const getHeatmapColor = (score: number) => {
    if (score === 0) return "bg-zinc-950 border-white/5 text-zinc-700";
    if (score < 40) return "bg-rose-950/30 border-rose-900/20 text-rose-400";
    if (score < 80) return "bg-amber-950/30 border-amber-900/20 text-amber-500";
    return "bg-emerald-500 border-transparent text-black font-semibold";
  };
  return (
    <div id="habit-individual-viewport" className="fixed inset-0 z-50 bg-black backdrop-blur-xl flex flex-col justify-end md:justify-center items-center p-0 md:p-4 font-sans select-none overflow-hidden">
      
      {/* Background closer click area (on desktop only) */}
      <div className="absolute inset-0 z-10 hidden md:block select-none" onClick={onClose} />

      {/* iOS Sliding Sheet modified to FULL MOBILE PAGE & Centered Desktop Container */}
      <motion.div
        initial={{ opacity: 0, y: "12%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "12%" }}
        transition={{ type: "spring", damping: 30, stiffness: 240 }}
        className="w-full h-full max-h-screen md:h-auto md:max-h-[92vh] md:max-w-lg bg-[#000000] md:border border-white/10 rounded-none md:rounded-[32px] overflow-hidden flex flex-col justify-between text-white p-5 pt-[calc(env(safe-area-inset-top,0px)+16px)] pb-[calc(env(safe-area-inset-bottom,0px)+16px)] md:p-6 relative z-20 shadow-2xl shadow-black"
      >
        
        {/* iOS Drag Handle (on desktop/modal view only) */}
        <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto mb-4 shrink-0 hidden md:block" />

        {/* Premium Header - Fixed at Top */}
        <div className="flex justify-between items-center shrink-0 border-b border-white/5 pb-4 mb-2">
          <div className="flex items-center gap-3.5 truncate">
            <span className="p-3 rounded-2xl flex items-center justify-center bg-zinc-900 border border-white/10 shrink-0" style={{ color: colorConfig.hex }}>
              <IconComponent className="w-5.5 h-5.5" style={{ color: colorConfig.hex }} />
            </span>
            <div className="truncate text-left">
              <div className="text-[9px] text-zinc-500 font-semibold tracking-wider uppercase">{habit.category}</div>
              <h1 className="text-lg font-bold text-white tracking-tight truncate leading-tight mt-0.5">{habit.name}</h1>
            </div>
          </div>

          <button
            id="close-habit-modal"
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-400 hover:text-white transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SCROLLABLE INNER BODY VIEWPORT */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-0.5 my-2 scrollbar-none">
          
          {/* IMMERSIVE ACTIVITY RING */}
          <div className="shrink-0 flex flex-col items-center justify-center py-4 text-center">
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* Soft Ambient Radial Blur Background */}
              <div 
                className="absolute inset-5 rounded-full blur-2xl opacity-15 transition-all duration-500"
                style={{ backgroundColor: colorConfig.hex }}
              />
              
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="80" cy="80" r="66" fill="transparent" stroke="rgba(255,255,255,0.02)" strokeWidth="7" />
                <circle 
                  cx="80" 
                  cy="80" 
                  r="66" 
                  fill="transparent" 
                  stroke={colorConfig.hex} 
                  strokeWidth="7" 
                  strokeDasharray={`${2 * Math.PI * 66}`}
                  strokeDashoffset={`${2 * Math.PI * 66 * (1 - Math.min(100, (habit.currentValue / habit.targetValue)) / 100)}`}
                  className="transition-all duration-1000 ease-out"
                  style={{ strokeLinecap: 'round' }}
                />
              </svg>

              <div className="text-center relative z-10">
                <div className="text-[2.25rem] font-sans font-black tracking-tighter text-white leading-none">
                  {habit.currentValue}
                </div>
                <div className="text-zinc-500 text-[8px] font-bold tracking-widest uppercase mt-0.5">META: {habit.targetValue}</div>
                <div className="mt-2 text-center">
                  <span className="text-[9px] font-extrabold text-zinc-300 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-full">
                    {Math.round((habit.currentValue / habit.targetValue) * 100)}%
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[9.5px] text-zinc-400 tracking-tight mt-3">
              FREQUÊNCIA: {habit.frequencyType === 'daily' ? 'DIÁRIO' : 'INTERMITENTE'} • CARGA DIÁRIA RECOMENDADA
            </p>
          </div>

          {/* CONNECTIONS BLOCK */}
          <div className="bg-zinc-950 border border-white/5 rounded-2xl p-3 flex flex-col gap-2">
            <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest pl-1 mb-1">Mapeamento Tático</div>
            
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center bg-black border border-white/5 rounded-xl px-3 py-2">
                <span className="text-[9px] text-zinc-400 font-mono uppercase">Exigência Energética</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${habit.exigencia === 'Extremo' ? 'text-red-400' : habit.exigencia === 'Alto' ? 'text-orange-400' : 'text-emerald-400'}`}>
                  {habit.exigencia || 'Normal'}
                </span>
              </div>
              
              <div className="flex justify-between items-center bg-black border border-white/5 rounded-xl px-3 py-2">
                <span className="text-[9px] text-zinc-400 font-mono uppercase">Horário Alvo</span>
                <div className="flex items-center gap-2">
                  {habit.timeOfDay ? (
                    <input 
                      type="time" 
                      value={habit.timeOfDay} 
                      onChange={(e) => {
                        playHapticSound('tick');
                        onUpdateHabit(habit.id, habit.currentValue, habit.completed, habit.todayPhoto, { timeOfDay: e.target.value });
                      }}
                      className="bg-zinc-900 border border-white/10 rounded-md px-2 py-1 text-[10px] text-white focus:outline-none"
                    />
                  ) : null}
                  <button 
                    onClick={() => {
                      playHapticSound('tick');
                      if (habit.timeOfDay) {
                        onUpdateHabit(habit.id, habit.currentValue, habit.completed, habit.todayPhoto, { timeOfDay: "" });
                      } else {
                        onUpdateHabit(habit.id, habit.currentValue, habit.completed, habit.todayPhoto, { timeOfDay: "08:00" });
                      }
                    }}
                    className={`text-[8px] px-2 py-1 uppercase rounded font-bold tracking-wider transition ${habit.timeOfDay ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
                  >
                    {habit.timeOfDay ? "Remover" : "Adicionar Horário"}
                  </button>
                </div>
              </div>
              
              {connectedMacro && (
                 <div className="flex items-center gap-2 bg-black border border-white/5 rounded-xl px-3 py-2">
                   <Target className="w-3.5 h-3.5 text-zinc-400" />
                   <div className="flex flex-col">
                     <span className="text-[8px] text-zinc-500 font-mono uppercase">Macro (Objetivo) Vinculado</span>
                     <span className="text-[10px] font-bold text-white leading-tight">{connectedMacro.title}</span>
                   </div>
                 </div>
              )}

              {connectedTrait && (
                 <div className="flex items-center gap-2 bg-black border border-white/5 rounded-xl px-3 py-2">
                   <BrainCircuit className="w-3.5 h-3.5 text-zinc-400" />
                   <div className="flex flex-col">
                     <span className="text-[8px] text-zinc-500 font-mono uppercase">Identidade (Op/Sab)</span>
                     <span className="text-[10px] font-bold text-white leading-tight">{connectedTrait.charName}</span>
                   </div>
                 </div>
              )}
            </div>
          </div>

          {/* RESULTS LOGGING BLOCK */}
          <div className="bg-zinc-950 border border-white/5 rounded-2xl p-3 flex flex-col gap-1.5">
             <div className="flex justify-between items-center mb-1">
               <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest pl-1">Resultado (O que essa ação gerou hoje?)</div>
             </div>
             <div className="flex gap-2">
               <input 
                 value={outcomeDraft}
                 onChange={(e) => setOutcomeDraft(e.target.value)}
                 onBlur={handleSaveOutcome}
                 placeholder="Digite um resultado ou lição..."
                 className="flex-1 bg-black border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white focus:outline-none focus:border-emerald-500/30 transition"
               />
               <button onClick={handleSaveOutcome} className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl hover:bg-emerald-500/20 transition text-emerald-400 hover:text-emerald-300">
                 <Edit3 className="w-3.5 h-3.5" />
               </button>
             </div>
          </div>

          {/* PERFORMANCE SEGMENT CONTROLS */}
          <div className="bg-zinc-950/60 border border-white/5 rounded-2.5xl p-3 flex flex-col justify-between shrink-0 min-h-[175px]">
            {/* Sub Navigation Bar */}
            <div className="grid grid-cols-4 gap-1 border-b border-white/5 pb-2 mb-3 text-[9px] font-bold tracking-wider">
              {(['semana', 'mes', 'tendencia', 'historico'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { playHapticSound('tick'); setActiveSubTab(tab); }}
                  className={`py-1 rounded-lg text-center cursor-pointer transition uppercase ${
                    activeSubTab === tab ? 'bg-zinc-900 text-white border border-white/10' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Sub Tab Screen viewports */}
            <div className="flex-1 flex flex-col justify-center text-xs leading-relaxed min-h-[105px]">
              {activeSubTab === 'semana' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[9px] text-zinc-400 font-semibold uppercase">
                    <span>Média Semanal: <span className="text-emerald-400 font-bold">{weeklyAverage}%</span></span>
                    <span>Execuções: <span className="text-[#10a6ff] font-bold">{completedLogsCount} Dias</span></span>
                  </div>
                  
                  {/* Custom Elegant iOS Activity Bars */}
                  <div className="grid grid-cols-7 gap-2 items-end h-[50px] pt-1">
                    {getWeeklyData().map((w, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                        <div className="w-full bg-zinc-900/60 h-9 rounded-full relative overflow-hidden flex items-end">
                          <div 
                            className="w-full rounded-full transition-all duration-700"
                            style={{ 
                              height: `${w.score}%`, 
                              backgroundColor: w.completed ? '#10b981' : colorConfig.hex 
                            }}
                          />
                        </div>
                        <span className="text-[8px] text-zinc-500 font-bold font-mono">{w.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSubTab === 'mes' && (
                <div className="space-y-2.5 text-center pb-1">
                  <div className="text-[8.5px] text-zinc-500 tracking-wider uppercase font-bold">Calendário Recente de Aproveitamento</div>
                  
                  {/* 16 days grid heatmap */}
                  <div className="flex flex-wrap gap-1.5 justify-center max-w-[290px] mx-auto">
                    {logsList.slice(0, 16).map((log, lIdx) => {
                      const pct = log.completed ? 100 : Math.round((log.value / habit.targetValue) * 100);
                      return (
                        <div
                          key={lIdx}
                          className={`w-[26px] h-[26px] rounded-md flex flex-col items-center justify-center font-mono text-[7.5px] font-black border transition ${getHeatmapColor(pct)}`}
                          title={`Data: ${log.date} | Progresso: ${log.value}`}
                        >
                          <span className="opacity-40 text-[5.5px] block leading-none">{log.date.split('-')[2]}</span>
                          <span className="block">{pct > 0 ? `${pct}%` : "0%"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeSubTab === 'tendencia' && (
                <div className="grid grid-cols-2 gap-2 text-left p-0.5 text-[10.5px] text-zinc-400">
                  <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-2.5 flex flex-col">
                    <span className="text-[7.5px] text-zinc-500 font-semibold tracking-wider uppercase mb-0.5">ESTABILIDADE</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-white font-bold text-[11px]">{weeklyAverage >= 70 ? 'Consistente' : 'Oscilante'}</span>
                    </div>
                    <span className="text-[8.5px] text-zinc-500 mt-1">{weeklyAverage}% aproveitamento corporal.</span>
                  </div>

                  <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-2.5 flex flex-col">
                    <span className="text-[7.5px] text-zinc-500 font-semibold tracking-wider uppercase mb-0.5">FAIXA PLANO</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-[#10a6ff]" />
                      <span className="text-white font-bold text-[11px]">{habit.timeOfDay || "Sem hora"}</span>
                    </div>
                    <span className="text-[8.5px] text-zinc-500 mt-1">{habit.timeOfDay ? 'Execução fixada' : 'Ação sem horário rígido'}</span>
                  </div>
                </div>
              )}

              {activeSubTab === 'historico' && (
                <div className="max-h-[105px] overflow-y-auto space-y-1 pr-1 font-mono text-[9px] scrollbar-none">
                  {logsList.length === 0 ? (
                    <div className="text-center text-zinc-600 text-[9px] pt-4">Nenhum histórico arquivado.</div>
                  ) : (
                    logsList.map((log, index) => (
                      <div 
                        key={index}
                        className="flex justify-between items-center bg-zinc-900/30 border border-white/5 rounded-lg px-2.5 py-1.5"
                      >
                        <span className="text-zinc-500">{log.date}</span>
                        <span className={log.completed ? "text-emerald-400 font-bold" : "text-zinc-300"}>
                          {log.value} / {habit.targetValue} {log.completed ? "(ok)" : ""}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* BOTTOM EXECUTION COMPLETED BUTTONS - Fixed at Bottom */}
        <div className="shrink-0 pt-3 border-t border-white/5">
          {habit.type === 'check' ? (
            <button
              id="modal-quick-toggle"
              onClick={handleToggleComplete}
              className={`w-full py-3 font-bold tracking-wider uppercase text-xs rounded-xl cursor-pointer transition-all duration-150 ${
                habit.completed 
                  ? 'bg-rose-950/25 text-rose-400 border border-rose-900/40 hover:bg-rose-950/40 active:scale-98' 
                  : 'bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-black shadow-lg shadow-emerald-500/10'
              }`}
            >
              {habit.completed ? 'Marcar como Pendente' : 'Marcar como Concluído'}
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                {habit.id === "h-mensagens" ? (
                  <>
                    <button
                      onClick={() => handleProgressChange(-10)}
                      className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-lg text-xs cursor-pointer active:scale-95 transition"
                    >
                      -10
                    </button>
                    <button
                      onClick={() => handleProgressChange(10)}
                      className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-lg text-xs cursor-pointer active:scale-95 transition"
                    >
                      +10
                    </button>
                    <button
                      onClick={() => handleProgressChange(50)}
                      className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-lg text-xs cursor-pointer active:scale-95 transition"
                    >
                      +50
                    </button>
                  </>
                ) : habit.id === "h-ligacoes" || habit.id === "h-remarketing" ? (
                  <>
                    <button
                      onClick={() => handleProgressChange(-1)}
                      className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-lg text-xs cursor-pointer active:scale-95 transition"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => handleProgressChange(1)}
                      className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-lg text-xs cursor-pointer active:scale-95 transition"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleProgressChange(10)}
                      className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-lg text-xs cursor-pointer active:scale-95 transition"
                    >
                      +10
                    </button>
                  </>
                ) : habit.id === "h-agua" ? (
                  <>
                    <button
                      onClick={() => handleProgressChange(-0.3)}
                      className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-lg text-xs cursor-pointer active:scale-95 transition"
                    >
                      -300ml
                    </button>
                    <button
                      onClick={() => handleProgressChange(0.3)}
                      className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-lg text-xs cursor-pointer active:scale-95 transition"
                    >
                      +300ml
                    </button>
                    <button
                      onClick={() => handleProgressChange(0.5)}
                      className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-lg text-xs cursor-pointer active:scale-95 transition"
                    >
                      +500ml
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleProgressChange(-1)}
                      className="flex-1 py-2 bg-zinc-900 border border-white/10 rounded-lg text-xs hover:bg-zinc-800 active:scale-95 transition cursor-pointer"
                    >
                      Reduzir -1
                    </button>
                    <button
                      onClick={() => handleProgressChange(1)}
                      className="flex-1 py-2 bg-zinc-900 border border-white/10 rounded-lg text-xs hover:bg-zinc-800 active:scale-95 transition cursor-pointer"
                    >
                      Adicionar +1
                    </button>
                  </>
                )}
              </div>

              <button
                id="btn-individual-instant-complete"
                onClick={handleToggleComplete}
                className="w-full py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-semibold border border-white/5 rounded-lg text-[10px] cursor-pointer tracking-wider"
              >
                {habit.completed ? "Zerar Progresso de Hoje" : "Marcar Meta Batida (Instantâneo)"}
              </button>
            </div>
          )}
        </div>

      </motion.div>
    </div>
  );
}
