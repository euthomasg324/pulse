import React, { useState, useEffect, useRef } from "react";
import { Habit } from "../types";
import {
  Zap,
  Check,
  MoreVertical,
  CheckCircle2,
  LayoutGrid,
  Maximize2,
  ChevronDown,
  Activity,
  ArrowRight,
  Plus,
  Camera,
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { iconMap, colorPresets } from "../data";
import { motion, AnimatePresence } from "motion/react";
import InputCaptureModal from "./InputCaptureModal";

interface HojeTabProps {
  habits: Habit[];
  onUpdateHabit: (
    id: string,
    currentValue: number,
    completed?: boolean,
    todayPhoto?: string,
    fullHabitUpdate?: Partial<Habit>
  ) => void;
  onSelectHabit: (habit: Habit) => void;
  playHapticSound: (type: "tick" | "complete" | "reset" | "warguerra") => void;
}

export default function HojeTab({
  habits,
  onUpdateHabit,
  onSelectHabit,
  playHapticSound,
}: HojeTabProps) {
  const [activeHoldMenu, setActiveHoldMenu] = useState<string | null>(null);
  
  const handlePhotoUpload = (habitId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          
          const habit = habits.find(h => h.id === habitId);
          if (habit) {
            onUpdateHabit(habitId, habit.currentValue, habit.completed, compressedBase64);
            playHapticSound("complete");
          }
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };
  const [viewMode, setViewMode] = useState<"grid" | "focus">("focus");
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const touchTimer = useRef<any>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [isMantraOpen, setIsMantraOpen] = useState(false);
  const [mantraCompleted, setMantraCompleted] = useState(false);

  const MANTRA_LINES = [
    "Minha mente é clara.",
    "Meu corpo é forte.",
    "Minha presença gera valor.",
    "Eu atraio oportunidades porque eu ajo sobre elas.",
    "Dinheiro circula para quem resolve problemas — e eu resolvo problemas.",
    "Todos os dias eu me torno mais disciplinado, estratégico e poderoso.",
    "Eu não opero na escassez.",
    "Eu penso grande, ajo rápido e aprendo mais rápido ainda.",
    "As pessoas certas me encontram porque eu me movimento.",
    "Minha vida está entrando em expansão.",
    "Eu aceito abundância sem culpa.",
    "Eu transformo ideias em riqueza.",
    "Eu construo algo grande.",
    "Eu termino o que começo.",
    "Hoje eu avanço."
  ];

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`pulse_mantra_completed_${todayStr}`);
    if (saved) setMantraCompleted(true);
  }, []);

  useEffect(() => {
    if (isMantraOpen && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [isMantraOpen]);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    
    const scrollStep = (time: number) => {
      if (isMantraOpen && scrollContainerRef.current) {
        const elapsed = time - lastTime;
        lastTime = time;
        if (elapsed > 0) {
          // Adjust scroll speed so that it scrolls elegantly (~32 pixels per second)
          scrollContainerRef.current.scrollTop += 0.032 * elapsed;
        }
        animationFrameId = requestAnimationFrame(scrollStep);
      }
    };
    
    if (isMantraOpen) {
      animationFrameId = requestAnimationFrame(scrollStep);
    }
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isMantraOpen]);

  const [funnels, setFunnels] = useState<{
    [habitId: string]: {
      respostas: number;
      interessados: number;
      fechamentos: number;
      faturamento: number;
    };
  }>(() => {
    const saved = localStorage.getItem("pulse_sales_funnels");
    if (saved) return JSON.parse(saved);
    return {
      "h-mensagens": {
        respostas: 18,
        interessados: 4,
        fechamentos: 1,
        faturamento: 1200,
      },
      "h-ligacoes": {
        respostas: 15,
        interessados: 3,
        fechamentos: 1,
        faturamento: 2500,
      },
      "h-remarketing": {
        respostas: 12,
        interessados: 4,
        fechamentos: 2,
        faturamento: 1500,
      },
    };
  });

  const [isFunnelOpen, setIsFunnelOpen] = useState<{
    [habitId: string]: boolean;
  }>({});

  const updateFunnel = (
    habitId: string,
    field: "respostas" | "interessados" | "fechamentos" | "faturamento",
    increment: number,
  ) => {
    setFunnels((prev) => {
      const current = prev[habitId] || {
        respostas: 0,
        interessados: 0,
        fechamentos: 0,
        faturamento: 0,
      };
      const updatedValue = Math.max(0, current[field] + increment);
      const updated = {
        ...prev,
        [habitId]: {
          ...current,
          [field]: updatedValue,
        },
      };
      localStorage.setItem("pulse_sales_funnels", JSON.stringify(updated));
      return updated;
    });
    playHapticSound("tick");
  };

  const [meditationTimeRemaining, setMeditationTimeRemaining] =
    useState<number>(20 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const medHabit = habits.find((h) => h.id === "h-meditar");

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setMeditationTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            clearInterval(interval);
            if (medHabit) {
              onUpdateHabit(medHabit.id, 20, true);
              playHapticSound("complete");
            }
            return 20 * 60;
          }
          const currentProgressSecs = 20 * 60 - (prev - 1);
          if (currentProgressSecs % 60 === 0 && medHabit) {
            const currentMins = Math.floor(currentProgressSecs / 60);
            onUpdateHabit(medHabit.id, currentMins, currentMins >= 20);
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, medHabit]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  const totalCount = habits.length;
  const completedCount = habits.filter((h) => h.completed).length;
  const todayScore =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getSortedHabits = () => {
    return [...habits].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      const timeA = a.timeOfDay;
      const timeB = b.timeOfDay;
      if (timeA && timeB) {
        return timeA.localeCompare(timeB);
      }
      if (timeA) return -1;
      if (timeB) return 1;

      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const priorityDiff =
        priorityWeight[b.priority] - priorityWeight[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.name.localeCompare(b.name);
    });
  };

  const sortedHabits = getSortedHabits();

  const renderHabitControls = (habit: Habit, isFocusMode: boolean) => {
    const isCheck = habit.type === "check";
    const colorKey = habit.color || "blue";
    const colorConfig =
      colorPresets[colorKey as keyof typeof colorPresets] || colorPresets.blue;
    const showFunnelToggle =
      habit.id === "h-mensagens" ||
      habit.id === "h-ligacoes" ||
      habit.id === "h-remarketing";

    return (
      <div className="flex flex-col w-full h-full justify-end">
        {/* Progress Bar or Status */}
        <div className="mb-3">
          {!isCheck && habit.id !== "h-meditar" ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-end">
                <span
                  className={`${isFocusMode ? "text-3xl" : "text-lg"} font-display font-black text-white leading-none tracking-tight`}
                >
                  {habit.currentValue}
                  <span
                    className={`${isFocusMode ? "text-sm" : "text-[10px]"} text-zinc-500 font-mono ml-1`}
                  >
                    / {habit.targetValue}
                  </span>
                </span>
                {habit.completed && (
                  <span
                    className={`${isFocusMode ? "text-xs" : "text-[10px]"} text-emerald-400 font-bold uppercase tracking-widest`}
                  >
                    Concluído
                  </span>
                )}
              </div>
              <div
                className={`w-full bg-black/40 ${isFocusMode ? "h-2" : "h-1.5"} rounded-full overflow-hidden border border-white/5`}
              >
                <div
                  className="h-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.min(100, (habit.currentValue / habit.targetValue) * 100)}%`,
                    backgroundColor: colorConfig.hex,
                    boxShadow: `0 0 12px ${colorConfig.hex}`,
                  }}
                />
              </div>
            </div>
          ) : habit.id === "h-meditar" ? (
            <div className="flex flex-col gap-2">
              <div
                className={`${isFocusMode ? "text-5xl text-center mb-1" : "text-xl"} font-bold font-mono text-white select-none tracking-tight`}
              >
                {formatTimer(meditationTimeRemaining)}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playHapticSound("tick");
                  setIsTimerRunning(!isTimerRunning);
                }}
                className={`w-full ${isFocusMode ? "py-2.5 text-xs" : "py-1.5 text-[10px]"} font-mono tracking-widest rounded-xl transition font-bold uppercase ${
                  isTimerRunning
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : `bg-white text-black hover:bg-zinc-200`
                }`}
              >
                {isTimerRunning ? "PAUSAR" : "INICIAR SESSÃO"}
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const nextComp = !habit.completed;
                playHapticSound(nextComp ? "complete" : "reset");
                onUpdateHabit(
                  habit.id,
                  nextComp ? habit.targetValue : 0,
                  nextComp,
                );
              }}
              className={`w-full flex items-center justify-center gap-2 transition-all ${
                isFocusMode
                  ? "py-2.5 rounded-xl text-xs"
                  : "py-1.5 rounded-lg text-[10px]"
              } font-bold uppercase tracking-widest font-mono border ${
                habit.completed
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-white text-black hover:bg-zinc-200 border-transparent"
              }`}
            >
              <Check
                className={isFocusMode ? "w-4 h-4" : "w-3.5 h-3.5"}
                strokeWidth={3}
              />
              {habit.completed ? "Desfazer Operação" : "Completar Operação"}
            </button>
          )}
        </div>

        {/* Sales Funnel for Traction Habits */}
        {showFunnelToggle && (
          <div
            className="mt-1 mb-2 px-1 relative z-25"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                playHapticSound("tick");
                setIsFunnelOpen((prev) => ({
                  ...prev,
                  [habit.id]: !prev[habit.id],
                }));
              }}
              className="w-full py-1 px-3 bg-zinc-900 border border-white/5 hover:border-white/10 rounded-xl text-[9px] font-mono uppercase tracking-wider text-zinc-400 flex justify-between items-center transition cursor-pointer"
            >
              <span>
                {isFunnelOpen[habit.id]
                  ? "Fechar Funil de Vendas"
                  : "Abrir Funil de Vendas"}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-300 ${isFunnelOpen[habit.id] ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {isFunnelOpen[habit.id] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-1.5 p-2 rounded-2xl bg-[#030303] border border-white/5 space-y-2 text-left text-xs font-mono"
                >
                  {/* Respostas row */}
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-zinc-500 uppercase">
                      Respostas:{" "}
                      <span className="text-white font-bold">
                        {funnels[habit.id]?.respostas || 0}
                      </span>
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateFunnel(habit.id, "respostas", -1)}
                        className="w-5 h-5 rounded bg-zinc-900 hover:bg-white/5 border border-white/5 text-[9px] flex items-center justify-center font-bold font-mono font-sans"
                      >
                        -
                      </button>
                      <button
                        onClick={() => updateFunnel(habit.id, "respostas", 1)}
                        className="w-5 h-5 rounded bg-zinc-900 hover:bg-white/5 border border-white/5 text-[9px] flex items-center justify-center font-bold font-mono font-sans"
                      >
                        +
                      </button>
                      <button
                        onClick={() => updateFunnel(habit.id, "respostas", 5)}
                        className="px-1.5 h-5 rounded bg-white text-black text-[9px] flex items-center justify-center font-bold font-mono font-sans"
                      >
                        +5
                      </button>
                    </div>
                  </div>

                  {/* Interessados row */}
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-zinc-500 uppercase">
                      Interessados:{" "}
                      <span className="text-white font-bold">
                        {funnels[habit.id]?.interessados || 0}
                      </span>
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          updateFunnel(habit.id, "interessados", -1)
                        }
                        className="w-5 h-5 rounded bg-zinc-900 hover:bg-white/5 border border-white/5 text-[9px] flex items-center justify-center font-bold font-mono font-sans"
                      >
                        -
                      </button>
                      <button
                        onClick={() =>
                          updateFunnel(habit.id, "interessados", 1)
                        }
                        className="w-5 h-5 rounded bg-zinc-900 hover:bg-white/5 border border-white/5 text-[9px] flex items-center justify-center font-bold font-mono font-sans"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Fechamentos row */}
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-zinc-500 uppercase font-bold text-zinc-300">
                      Fechamentos:{" "}
                      <span className="text-emerald-400 font-bold">
                        {funnels[habit.id]?.fechamentos || 0}
                      </span>
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          updateFunnel(habit.id, "fechamentos", -1)
                        }
                        className="w-5 h-5 rounded bg-zinc-900 hover:bg-white/5 border border-white/5 text-[9px] flex items-center justify-center font-bold font-mono font-sans"
                      >
                        -
                      </button>
                      <button
                        onClick={() => updateFunnel(habit.id, "fechamentos", 1)}
                        className="w-5 h-5 rounded bg-zinc-900 hover:bg-white/5 border border-white/5 text-[9px] flex items-center justify-center font-bold font-mono font-sans"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Faturamento row */}
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-zinc-500 uppercase text-emerald-400">
                      Faturamento:{" "}
                      <span className="text-emerald-400 font-bold">
                        R$ {funnels[habit.id]?.faturamento || 0}
                      </span>
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          updateFunnel(habit.id, "faturamento", -500)
                        }
                        className="px-1 h-5 rounded bg-zinc-900 border border-white/5 text-[8px] font-bold font-mono"
                      >
                        -500
                      </button>
                      <button
                        onClick={() =>
                          updateFunnel(habit.id, "faturamento", 500)
                        }
                        className="px-1 h-5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold font-mono"
                      >
                        +500
                      </button>
                      <button
                        onClick={() =>
                          updateFunnel(habit.id, "faturamento", 2000)
                        }
                        className="px-1 h-5 rounded bg-emerald-500 text-black text-[8px] font-bold font-mono"
                      >
                        +2k
                      </button>
                    </div>
                  </div>

                  {/* Operational Metrics Calculation Badges */}
                  <div className="pt-1.5 border-t border-white/5 grid grid-cols-2 gap-1 text-[8px] text-zinc-500 font-mono">
                    <div className="bg-white/[0.02] p-1 rounded-md text-left">
                      TAXA DIN.:{" "}
                      <span className="text-zinc-300 font-bold">
                        {(
                          ((funnels[habit.id]?.respostas || 0) /
                            Math.max(1, habit.currentValue)) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="bg-white/[0.02] p-1 rounded-md text-left">
                      FECHOS/RESP:{" "}
                      <span className="text-zinc-300 font-bold">
                        {(
                          ((funnels[habit.id]?.fechamentos || 0) /
                            Math.max(1, funnels[habit.id]?.respostas || 1)) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="col-span-2 bg-emerald-500/5 text-emerald-400 p-1 rounded-md text-center font-bold border border-emerald-500/10">
                      CADA CLIQUE VALE: R${" "}
                      {(
                        (funnels[habit.id]?.faturamento || 0) /
                        Math.max(1, habit.currentValue)
                      ).toFixed(2)}{" "}
                      / contato
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Increment Actions */}
        {!isCheck && habit.id !== "h-meditar" && (
          <div
            className={`grid grid-cols-3 gap-2 shrink-0 ${isFocusMode ? "pt-1" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            {habit.id === "h-mensagens" ? (
              <>
                <button
                  onClick={() => {
                    const val = Math.max(0, habit.currentValue - 10);
                    onUpdateHabit(habit.id, val, val >= habit.targetValue);
                  }}
                  className={`bg-black/40 ${isFocusMode ? "py-2.5 text-xs" : "text-[10px] py-1.5"} text-white font-sans font-bold hover:bg-white/10 border border-white/5 rounded-xl transition cursor-pointer`}
                >
                  -10
                </button>
                <button
                  onClick={() => {
                    const val = Math.min(300, habit.currentValue + 10);
                    onUpdateHabit(habit.id, val, val >= habit.targetValue);
                  }}
                  className={`bg-white/10 ${isFocusMode ? "py-2.5 text-xs" : "text-[10px] py-1.5"} text-white font-sans font-bold hover:bg-white/20 border border-white/10 rounded-xl transition cursor-pointer`}
                >
                  +10
                </button>
                <button
                  onClick={() => {
                    const val = Math.min(300, habit.currentValue + 50);
                    onUpdateHabit(habit.id, val, val >= habit.targetValue);
                  }}
                  className={`bg-white text-black ${isFocusMode ? "py-2.5 text-xs" : "text-[10px] py-1.5"} font-sans font-bold hover:bg-zinc-200 border border-transparent rounded-xl transition cursor-pointer`}
                >
                  +50
                </button>
              </>
            ) : habit.id === "h-ligacoes" || habit.id === "h-remarketing" ? (
              <>
                <button
                  onClick={() => {
                    const val = Math.max(0, habit.currentValue - 1);
                    onUpdateHabit(habit.id, val, val >= habit.targetValue);
                  }}
                  className={`bg-black/40 ${isFocusMode ? "py-2.5 text-xs" : "text-[10px] py-1.5"} text-white font-sans font-bold hover:bg-white/10 border border-white/5 rounded-xl transition cursor-pointer`}
                >
                  -1
                </button>
                <button
                  onClick={() => {
                    const val = Math.min(50, habit.currentValue + 1);
                    onUpdateHabit(habit.id, val, val >= habit.targetValue);
                  }}
                  className={`bg-white/10 ${isFocusMode ? "py-2.5 text-xs" : "text-[10px] py-1.5"} text-white font-sans font-bold hover:bg-white/20 border border-white/10 rounded-xl transition cursor-pointer`}
                >
                  +1
                </button>
                <button
                  onClick={() => {
                    const val = Math.min(50, habit.currentValue + 10);
                    onUpdateHabit(habit.id, val, val >= habit.targetValue);
                  }}
                  className={`bg-white text-black ${isFocusMode ? "py-2.5 text-xs" : "text-[10px] py-1.5"} font-sans font-bold hover:bg-zinc-200 border border-transparent rounded-xl transition cursor-pointer`}
                >
                  +10
                </button>
              </>
            ) : habit.id === "h-agua" ? (
              <>
                <button
                  onClick={() => {
                    const val = Number(
                      Math.min(3, habit.currentValue + 0.3).toFixed(2),
                    );
                    onUpdateHabit(habit.id, val, val >= habit.targetValue);
                  }}
                  className={`bg-blue-500/10 ${isFocusMode ? "py-2.5 text-xs" : "text-[10px] py-1.5"} text-blue-400 font-sans font-bold hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition cursor-pointer`}
                >
                  +300ml
                </button>
                <button
                  onClick={() => {
                    const val = Number(
                      Math.min(3, habit.currentValue + 0.5).toFixed(2),
                    );
                    onUpdateHabit(habit.id, val, val >= habit.targetValue);
                  }}
                  className={`bg-blue-500/20 ${isFocusMode ? "py-2.5 text-xs" : "text-[10px] py-1.5"} text-blue-400 font-sans font-bold hover:bg-blue-500/30 border border-blue-500/30 rounded-xl transition cursor-pointer`}
                >
                  +500ml
                </button>
                <button
                  onClick={() => {
                    const val = Number(
                      Math.min(3, habit.currentValue + 1.0).toFixed(2),
                    );
                    onUpdateHabit(habit.id, val, val >= habit.targetValue);
                  }}
                  className={`bg-blue-500 text-black ${isFocusMode ? "py-2.5 text-xs" : "text-[10px] py-1.5"} font-sans font-bold hover:bg-blue-400 border border-transparent rounded-xl transition cursor-pointer`}
                >
                  +1L
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    const val = Math.max(0, habit.currentValue - 1);
                    onUpdateHabit(habit.id, val, val >= habit.targetValue);
                  }}
                  className={`bg-black/40 ${isFocusMode ? "py-2.5 text-xs" : "text-[10px] py-1.5"} text-white font-sans font-bold hover:bg-white/10 border border-white/5 rounded-xl transition cursor-pointer`}
                >
                  -1
                </button>
                <button
                  onClick={() => {
                    const val = Math.min(
                      habit.targetValue,
                      habit.currentValue + 1,
                    );
                    onUpdateHabit(habit.id, val, val >= habit.targetValue);
                  }}
                  className={`col-span-2 bg-white text-black ${isFocusMode ? "py-2.5 text-xs" : "text-[10px] py-1.5"} font-sans font-bold hover:bg-zinc-200 rounded-xl transition cursor-pointer`}
                >
                  AVANÇAR
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden justify-between select-none p-1 text-white relative">
      {/* Dynamic Header */}
      <div className="transition-all duration-500 flex justify-between items-center bg-transparent px-3 relative z-20 shrink-0 pt-2 pb-2">
        <div className="flex flex-col">
          <div className="text-[10px] uppercase text-zinc-500 font-display font-medium tracking-widest leading-none mb-1">
            Visão Global
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-black text-white tracking-tight leading-tight">
              Hoje
            </h1>
            {/* View Mode Toggle */}
            <div className="flex bg-zinc-900/80 p-0.5 rounded-full border border-white/10">
              <button
                onClick={() => {
                  playHapticSound("tick");
                  setViewMode("grid");
                }}
                className={`p-1.5 rounded-full transition ${viewMode === "grid" ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  playHapticSound("tick");
                  setViewMode("focus");
                }}
                className={`p-1.5 rounded-full transition ${viewMode === "focus" ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playHapticSound("tick");
              setIsInputModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold text-[10px] tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] active:scale-95 border border-blue-400/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Input</span>
          </button>

          <div className="flex items-center gap-3 bg-zinc-900/80 backdrop-blur-md border border-white/10 py-1.5 px-3 rounded-full relative overflow-hidden">
            <div className="text-right hidden md:block">
              <div className="text-[8px] text-zinc-400 leading-none uppercase font-mono">
                Score
              </div>
              <div className="text-sm font-display font-bold text-white leading-none mt-1">
                {todayScore}%
              </div>
            </div>
            <div className="text-[9px] font-display font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
              {completedCount}/{totalCount}
            </div>
          </div>
        </div>
      </div>

      {/* GLOWING AMBER DAILY MANTRA ACTION STRIP */}
      <div className="px-3 md:px-4 mb-3 shrink-0">
        <motion.div 
          onClick={() => { 
            playHapticSound("tick"); 
            setIsMantraOpen(true); 
          }}
          whileHover={{ scale: 1.01, borderColor: "rgba(245, 158, 11, 0.4)" }}
          whileTap={{ scale: 0.99 }}
          className={`cursor-pointer p-4 rounded-3xl border flex items-center justify-between transition-all duration-300 relative overflow-hidden backdrop-blur-3xl ${
            mantraCompleted 
              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
              : 'bg-amber-500/5 border-amber-900/30 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.05)]'
          }`}
        >
          {/* Subtle radiating glowing circles */}
          <div className="absolute -inset-10 opacity-20 bg-[radial-gradient(circle_at_center,var(--color-amber-500)_0%,transparent_50%)] pointer-events-none" />
          <div className="flex items-center gap-3.5 relative z-10">
            <span className={`text-xl transition-transform duration-300 ${mantraCompleted ? '' : 'animate-bounce'}`}>🔮</span>
            <div>
              <div className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 font-bold leading-none mb-1">REPROGRAMAÇÃO DIÁRIA</div>
              <div className="text-sm font-semibold leading-none text-zinc-100 tracking-tight">
                {mantraCompleted ? "Mantra Recitado. Presença forte e poder puro." : "Recitar Mantra do Dia (Teleprompter)"}
              </div>
            </div>
          </div>
          <span className={`text-[9px] font-mono font-black px-2.5 py-1 rounded-xl border uppercase shrink-0 transition-all ${
            mantraCompleted 
              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300 animate-pulse'
          }`}>
            {mantraCompleted ? "Alinhado" : "Falar"}
          </span>
        </motion.div>
      </div>

      {viewMode === "grid" ? (
        /* GRID VIEW: Clean, modern, bento-style */
        <div className="flex-1 grid grid-cols-2 gap-3 min-h-0 overflow-y-auto px-1 pb-4 content-start">
          {sortedHabits.map((habit) => {
            const IconComponent = iconMap[habit.icon] || Zap;
            const colorKey = habit.color || "blue";
            let colorConfig =
              colorPresets[colorKey as keyof typeof colorPresets] ||
              colorPresets.blue;

            return (
              <div
                key={habit.id}
                onClick={() => onSelectHabit(habit)}
                className={`relative flex flex-col justify-between transition-all duration-300 rounded-3xl p-4 cursor-pointer overflow-hidden border ${
                  habit.completed
                    ? "bg-zinc-900 border-transparent opacity-50"
                    : "bg-zinc-900/60 hover:bg-zinc-800 border-white/5 hover:border-white/20"
                }`}
                style={{ minHeight: "180px" }}
              >
                {/* Visual Cover Layer if Photo is present */}
                {habit.todayPhoto && (
                  <div className="absolute inset-0 z-0 select-none pointer-events-none">
                    <img 
                      src={habit.todayPhoto} 
                      alt="" 
                      className="w-full h-full object-cover opacity-20" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
                  </div>
                )}

                <div className="flex justify-between items-start z-10">
                  <div
                    className="p-2 rounded-xl backdrop-blur-md"
                    style={{
                      backgroundColor: colorConfig.bg,
                      color: colorConfig.hex,
                    }}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>

                  {/* Camera icon button for easy uploads */}
                  <div onClick={(e) => e.stopPropagation()} className="relative">
                    <label className={`p-1.5 rounded-lg border cursor-pointer flex items-center justify-center transition-all hover:scale-105 active:scale-95 group ${habit.todayPhoto ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'}`}>
                      <Camera className="w-3.5 h-3.5" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handlePhotoUpload(habit.id, e)} 
                      />
                    </label>
                  </div>
                </div>
                <div className="mt-4 mb-2 z-10">
                  <h3 className="font-display font-bold text-sm tracking-tight text-white leading-tight mb-1">
                    {habit.name}
                  </h3>
                  <p className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">
                    {habit.category} {habit.timeOfDay && <span className="ml-1 px-1 bg-white/10 rounded">@ {habit.timeOfDay}</span>}
                  </p>
                </div>
                <div className="z-10 mt-auto">
                  {renderHabitControls(habit, false)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* FOCUS VIEW: Reels-Like Full Screen Experience */
        <div
          className="flex-1 w-full relative -mx-1 px-1 overflow-hidden"
          style={{
            scrollSnapType: "y mandatory",
            scrollBehavior: "smooth",
            overflowY: "scroll",
          }}
        >
          {sortedHabits.map((habit, index) => {
            const IconComponent = iconMap[habit.icon] || Zap;
            const colorKey = habit.color || "blue";
            let colorConfig =
              colorPresets[colorKey as keyof typeof colorPresets] ||
              colorPresets.blue;
            const nextHabit = sortedHabits[index + 1];

            return (
              <div
                key={habit.id}
                className="w-full h-full snap-start snap-always flex flex-col justify-between pt-1 pb-3 relative items-center px-1"
              >
                {/* The Huge Focus Card */}
                <div
                  className={`relative w-full flex-1 mb-3 rounded-[36px] overflow-hidden flex flex-col p-5 shadow-2xl transition-all duration-300 border ${habit.completed ? "border-emerald-500/30" : "border-white/10"}`}
                >
                  {/* Generative Visual Representation Layer */}
                  <div className="absolute inset-0 bg-zinc-950 overflow-hidden flex items-center justify-center">
                    {habit.todayPhoto ? (
                      <img 
                        src={habit.todayPhoto} 
                        alt={habit.name} 
                        className="w-full h-full object-cover opacity-35 transition-opacity duration-500" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <>
                        {/* Giant blurred background icon instead of random photo */}
                        <IconComponent
                          className="w-[150%] h-[150%] absolute opacity-5 blur-2xl"
                          style={{ color: colorConfig.hex }}
                        />
                        <IconComponent
                          className="w-64 h-64 absolute opacity-[0.03] -right-10 -bottom-10"
                          style={{ color: colorConfig.hex }}
                        />
                      </>
                    )}

                    {/* Dark gradients for text readability */}
                    <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent z-10" />
                    <div className="absolute inset-0 bg-black/20 z-0" />

                    {/* Glowing Accent */}
                    <div
                      className="absolute top-0 right-0 w-full h-1/2 opacity-30 z-0 mix-blend-screen"
                      style={{
                        background: `radial-gradient(circle at 80% 20%, ${colorConfig.hex}, transparent 60%)`,
                      }}
                    />
                  </div>

                  {/* Header Content */}
                  <div className="relative z-20 flex-1 pt-2 w-full">
                    <div className="flex items-center justify-between gap-3 mb-6 w-full">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg">
                          <IconComponent
                            className="w-7 h-7"
                            style={{ color: colorConfig.hex }}
                          />
                        </div>
                        <div>
                          <div className="text-[9px] text-zinc-400 font-mono tracking-widest uppercase mb-1">
                            {habit.category} {habit.timeOfDay && <span className="ml-1 px-1.5 py-0.5 bg-white/10 rounded-md">@ {habit.timeOfDay}</span>}
                          </div>
                          <h2
                            className={`text-3xl font-display font-black tracking-tight leading-none ${habit.completed ? "text-zinc-600 line-through" : "text-white"}`}
                          >
                            {habit.name}
                          </h2>
                        </div>
                      </div>

                      {/* Camera Upload Controls floating top right */}
                      <div className="relative flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {habit.todayPhoto ? (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => {
                                playHapticSound("reset");
                                onUpdateHabit(habit.id, habit.currentValue, habit.completed, "");
                              }}
                              className="p-3 rounded-2xl bg-red-400/10 hover:bg-red-400/25 border border-red-500/20 shadow-lg cursor-pointer flex items-center justify-center transition-all hover:scale-105 active:scale-95 group"
                              title="Remover Foto"
                            >
                              <X className="w-5 h-5 text-red-400 group-hover:text-red-300 transition-colors" />
                            </button>
                            <label className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-lg cursor-pointer flex items-center justify-center transition-all hover:scale-105 active:scale-95 group relative overflow-hidden w-11 h-11">
                              <img src={habit.todayPhoto} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                              <Camera className="w-5 h-5 text-white z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handlePhotoUpload(habit.id, e)} 
                              />
                            </label>
                          </div>
                        ) : (
                          <label className="p-3 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 shadow-lg cursor-pointer flex items-center justify-center transition-all hover:scale-105 active:scale-95 group">
                            <Camera className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => handlePhotoUpload(habit.id, e)} 
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Interative Controls inside Focus Card */}
                  <div className="relative z-20 mt-auto w-full">
                    <div className="bg-black/40 backdrop-blur-3xl border border-white/5 rounded-3xl p-3 w-full shadow-2xl">
                      {renderHabitControls(habit, true)}
                    </div>
                  </div>
                </div>

                {/* Elegant Next Indicator */}
                <div className="h-[28px] w-full flex items-center justify-center shrink-0">
                  {nextHabit ? (
                    <div className="opacity-80 flex flex-col items-center justify-center">
                      <div className="bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-1.5 rounded-full flex items-center gap-3 shadow-lg">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">
                          Próximo
                        </span>
                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-3 h-3 text-zinc-300" />
                          <span className="text-[11px] font-bold text-zinc-200 tracking-tight">
                            {nextHabit.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}

          <style>{`
            /* Subtly hide scrollbars to mimic Reels */
            div[style*="scrollSnapType"]::-webkit-scrollbar {
              display: none;
            }
            div[style*="scrollSnapType"] {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
        </div>
      )}

      {/* IMMERSIVE MANTRA TELEPROMPTER OVERLAY */}
      <AnimatePresence>
        {isMantraOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden animate-none"
          >
            {/* Minimal Close (X) button ONLY */}
            <button
              onClick={() => {
                playHapticSound("tick");
                setIsMantraOpen(false);
              }}
              className="fixed top-6 right-6 p-4 bg-zinc-900/80 border border-white/10 rounded-full text-zinc-300 hover:text-white transition z-50 hover:scale-105 active:scale-95 shadow-xl"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Immersive Scroll Viewport */}
            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto no-scrollbar scroll-smooth px-6 py-12 relative"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* Top Breathing Space */}
              <div className="h-[40vh] shrink-0" />

              {/* Mantra text blocks: Bold, pure white, clean and highly visible */}
              <div className="space-y-16 max-w-2xl mx-auto text-center">
                {MANTRA_LINES.map((line, idx) => (
                  <motion.p
                    key={idx}
                    initial={{ opacity: 0.15, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: false, margin: "-20% 0px -20% 0px" }}
                    transition={{ duration: 0.5 }}
                    className="text-white font-sans font-black text-2xl md:text-4xl leading-relaxed tracking-wide select-none drop-shadow-[0_2px_15px_rgba(0,0,0,0.8)]"
                  >
                    {line}
                  </motion.p>
                ))}
              </div>

              {/* Bottom Complete / Call to Action */}
              <div className="h-[25vh] shrink-0" />

              <div className="flex justify-center pb-24 relative z-20">
                <button
                  onClick={() => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    localStorage.setItem(`pulse_mantra_completed_${todayStr}`, "true");
                    setMantraCompleted(true);
                    setIsMantraOpen(false);
                    playHapticSound("complete");

                    // Register in BrainDump list to validate the user
                    const savedDumps = localStorage.getItem("pulse_braindumps");
                    let dumps = savedDumps ? JSON.parse(savedDumps) : [];
                    dumps.unshift({
                      id: "mantra-" + Date.now().toString(),
                      text: "🔮 MANTRA DIÁRIO RECITADO: \n[x] Minha mente é clara.\n[x] Meu corpo é forte.\n[x] Minha presença gera valor.\n[x] Eu atraio oportunidades porque eu ajo sobre elas.\n[x] Dinheiro circula para quem resolve problemas — e eu resolvo problemas.\n[x] Todos os dias eu me torno mais disciplinado, estratégico e poderoso.\n[x] Eu não opero na escassez.\n[x] Eu penso grande, ajo rápido e aprendo mais rápido ainda.\n[x] As pessoas certas me encontram porque eu me movimento.\n[x] Minha vida está entrando em expansão.\n[x] Eu aceito abundância sem culpa.\n[x] Eu transformo ideias em riqueza.\n[x] Eu construo algo grande.\n[x] Eu termino o que começo.\n[x] Hoje eu avanço.",
                      createdAt: todayStr,
                      completed: true,
                      type: "checklist"
                    });
                    localStorage.setItem("pulse_braindumps", JSON.stringify(dumps));
                    fetch("/api/kv", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ key: "pulse_braindumps", value: dumps })
                    }).catch(()=>{});
                  }}
                  className="w-full max-w-sm py-5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-black font-sans font-black text-base uppercase tracking-widest rounded-2xl shadow-[0_0_35px_rgba(245,158,11,0.35)] transition duration-300 active:scale-[0.98] flex items-center justify-center gap-2 text-center"
                >
                  <Check className="w-5 h-5 stroke-[3px]" />
                  <span>Hoje Eu Avanço</span>
                </button>
              </div>

              {/* Additional padding container bottom */}
              <div className="h-[15vh] shrink-0" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL INPUT BRAIN DUMP */}
      <InputCaptureModal
        isOpen={isInputModalOpen}
        onClose={() => setIsInputModalOpen(false)}
        playHapticSound={playHapticSound}
      />
    </div>
  );
}
