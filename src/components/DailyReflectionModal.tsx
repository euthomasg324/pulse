import React, { useState, useEffect } from "react";
import { X, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Habit } from "../types";

interface DailyReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  playHapticSound: (type: 'light' | 'medium' | 'heavy' | 'tick' | 'complete' | 'reset') => void;
  onReflectionSubmit: () => void; // Trigger data refresh
}

export function DailyReflectionModal({
  isOpen,
  onClose,
  habits,
  playHapticSound,
  onReflectionSubmit
}: DailyReflectionModalProps) {
  const [loading, setLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [reflectionState, setReflectionState] = useState<'initial' | 'reviewing' | 'feedback'>('initial');
  
  // Computed incomplete habits for today
  const incompleteHabits = React.useMemo(() => {
    return habits.filter(h => {
      // Exclude simple checklists or extremely trivial habits if needed, 
      // but for now let's just use .completed for today.
      return !h.completed;
    });
  }, [habits]);

  const [reasons, setReasons] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setReflectionState('initial');
      setAiFeedback(null);
      setLoading(false);
      setReasons({});
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    playHapticSound('medium');

    const date = new Date().toISOString().split('T')[0];
    const missedHabitsList = incompleteHabits.map(h => ({
      habitId: h.id,
      name: h.name,
      reason: reasons[h.id] || "Sem justificativa"
    }));

    try {
      const res = await fetch("/api/reflection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, missedHabits: missedHabitsList })
      });
      const data = await res.json();
      if (data.success) {
        setReflectionState('feedback');
        setAiFeedback(data.aiFeedback);
        onReflectionSubmit();
        playHapticSound('complete');
      } else {
        alert(data.error || "Erro ao salvar reflexão.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar dados da reflexão.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/98 backdrop-blur-xl flex flex-col items-center justify-start p-4 sm:p-6 overflow-y-auto"
      >
        <div className="w-full max-w-lg mt-10 relative">
          <button
            onClick={() => {
              playHapticSound('light');
              onClose();
            }}
            className="absolute -top-12 right-0 p-2 text-zinc-500 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>

          {reflectionState === 'initial' && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-display font-black tracking-tight text-white">Fechamento do Dia</h2>
                <p className="text-sm font-mono text-zinc-400">Hora de assumir a responsabilidade.</p>
              </div>

              {incompleteHabits.length === 0 ? (
                <div className="bg-emerald-950/30 border border-emerald-900/50 p-8 rounded-3xl text-center space-y-4">
                  <Sparkles className="w-12 h-12 text-emerald-400 mx-auto" />
                  <h3 className="text-xl font-bold text-emerald-400">Dia Impecável</h3>
                  <p className="text-sm text-zinc-300">Você concluiu todos os seus compromissos. O sistema não tem falhas listadas hoje.</p>
                  <button
                    onClick={handleSubmit}
                    className="mt-4 bg-emerald-500 text-black font-bold py-3 px-8 rounded-xl w-full hover:bg-emerald-400 transition"
                  >
                    Encerrar Dia com Excelência
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-rose-950/20 border border-rose-900/30 p-4 rounded-2xl flex gap-4 items-start">
                    <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0 mt-1" />
                    <div>
                      <h4 className="text-rose-400 font-bold">Faltou executar</h4>
                      <p className="text-xs text-rose-300/70 font-mono mt-1">A IA do sistema exige uma justificativa para cada item não concluído. Registre o motivo abaixo.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {incompleteHabits.map(h => (
                      <div key={h.id} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 space-y-3">
                        <div className="text-sm font-bold text-white">{h.name}</div>
                        <textarea
                          placeholder="Por que não foi feito?"
                          className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors h-20 resize-none font-mono"
                          value={reasons[h.id] || ''}
                          onChange={(e) => setReasons(prev => ({ ...prev, [h.id]: e.target.value }))}
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-white flex items-center justify-center text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Gravar Análise e Encerrar o Dia"}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {reflectionState === 'feedback' && (
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6">
              <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl text-center space-y-6">
                <Sparkles className="w-12 h-12 text-indigo-400 mx-auto" />
                <h3 className="text-xl font-bold text-white uppercase tracking-wider font-display">Insight da Inteligência</h3>
                <div className="text-zinc-300 font-mono text-sm leading-relaxed whitespace-pre-wrap text-left p-4 bg-black/50 rounded-xl border border-white/5">
                  {aiFeedback}
                </div>
                <button
                  onClick={() => {
                    playHapticSound('light');
                    onClose();
                  }}
                  className="bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl w-full hover:bg-indigo-400 transition"
                >
                  Confirmar e Fechar
                </button>
              </div>
            </motion.div>
          )}

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
