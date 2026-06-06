import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Mic,
  FileText,
  CheckSquare,
  Clock,
  Send,
  Loader2,
  Archive,
  ArrowLeft,
  Play,
  Square,
  Trash2
} from "lucide-react";

interface InputCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  playHapticSound: (type: "tick" | "complete" | "reset" | "warguerra") => void;
}

type TabType = "nota" | "tarefa" | "audio" | "checklist";

interface BrainDump {
  id: string;
  text: string;
  createdAt: string;
  completed: boolean;
  type: "nota" | "tarefa" | "checklist" | "audio";
  items?: { id: string; text: string; completed: boolean }[];
  voiceUrl?: string;
}

export default function InputCaptureModal({
  isOpen,
  onClose,
  playHapticSound,
}: InputCaptureModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("nota");
  const [content, setContent] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"input" | "registry">("input");
  const [registryFilter, setRegistryFilter] = useState<"todos" | "nota" | "tarefa" | "audio">("todos");
  
  const [checklistItems, setChecklistItems] = useState<{id: string, text: string, completed: boolean}[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [brainDumps, setBrainDumps] = useState<BrainDump[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (isOpen) {
      setViewMode("input");
      const saved = localStorage.getItem("pulse_braindumps");
      if (saved) setBrainDumps(JSON.parse(saved));
      
      // Also fetch latest from server
      fetch("/api/kv")
        .then(r => r.json())
        .then(data => {
          if (data["pulse_braindumps"]) setBrainDumps(data["pulse_braindumps"]);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!content.trim() && activeTab !== "audio" && activeTab !== "checklist") return;
    if (activeTab === "checklist" && checklistItems.length === 0) return;

    playHapticSound("tick");
    setIsSaving(true);

    let textContent = content.trim();
    if (activeTab === "audio") {
       textContent = `[Áudio Gravado] Duração: ${formatTime(recordingTime)} - Registrado em ${new Date().toLocaleTimeString()}`;
    } else if (activeTab === "checklist") {
       textContent = checklistItems.map(i => `${i.completed ? '[x]' : '[ ]'} ${i.text}`).join('\n');
    }

    const newDump: BrainDump = {
      id: "dump-" + Date.now().toString(),
      text: textContent,
      createdAt: new Date().toISOString().split("T")[0],
      completed: false,
      type: activeTab,
      items: activeTab === "checklist" ? checklistItems : undefined,
      voiceUrl: activeTab === "audio" && audioBase64 ? audioBase64 : undefined
    };
    
    const updatedDumps = [newDump, ...brainDumps];
    setBrainDumps(updatedDumps);
    
    localStorage.setItem("pulse_braindumps", JSON.stringify(updatedDumps));
    fetch("/api/kv", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ key: "pulse_braindumps", value: updatedDumps }) 
    }).catch(()=>{});

    setTimeout(() => {
      setIsSaving(false);
      setContent("");
      setChecklistItems([]);
      setRecordingTime(0);
      setIsRecording(false);
      setAudioBase64(null);
      playHapticSound("complete");
      onClose(); // Optional: or we just show a toast and keep open? Let's close as requested originally but state it is saved.
    }, 600);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioBase64(reader.result as string);
        };
        reader.readAsDataURL(blob);
        
        // Stop stream tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      console.error("Erro ao acessar microfone", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const toggleRecord = () => {
    playHapticSound("tick");
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "tween", ease: "circOut", duration: 0.3 }}
          className="fixed inset-0 z-50 bg-zinc-950 flex flex-col" // Full screen
        >
          <div className="px-5 pb-8 pt-8 flex flex-col h-full flex-1">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col">
                <h2 className="text-3xl font-display font-black text-white tracking-tight">
                  Brain Dump
                </h2>
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                  Esvazie sua mente
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    playHapticSound("tick");
                    setViewMode(viewMode === "input" ? "registry" : "input");
                  }}
                  className="p-3 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white transition-all shadow-sm"
                >
                  {viewMode === "input" ? <Archive className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => {
                    playHapticSound("tick");
                    onClose();
                  }}
                  className="p-3 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white transition-all shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {viewMode === "input" ? (
              <div className="flex flex-col flex-1 h-full">
                {/* Tabs */}
                <div className="flex gap-2 p-1 bg-zinc-900/50 rounded-2xl mb-6">
                  {(["nota", "tarefa", "checklist", "audio"] as TabType[]).map(
                    (tab) => {
                      const isActive = activeTab === tab;
                      return (
                        <button
                          key={tab}
                          onClick={() => {
                            playHapticSound("tick");
                            setActiveTab(tab);
                            setContent("");
                            setIsRecording(false);
                          }}
                          className={`flex-1 py-3 rounded-xl flex flex-col items-center gap-1.5 transition-all ${
                            isActive
                              ? "bg-zinc-800 text-white shadow-md border border-white/10"
                              : "text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          {tab === "nota" && <FileText className="w-5 h-5" />}
                          {tab === "tarefa" && <CheckSquare className="w-5 h-5" />}
                          {tab === "checklist" && <CheckSquare className="w-5 h-5" />}
                          {tab === "audio" && <Mic className="w-5 h-5" />}
                          <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
                            {tab}
                          </span>
                        </button>
                      );
                    },
                  )}
                </div>

                {/* Dynamic Content Area */}
                <div className="flex-1 flex flex-col relative min-h-[300px]">
                  <AnimatePresence mode="wait">
                    {/* TEXT BASED INPUT */}
                    {(activeTab === "nota" || activeTab === "tarefa") && (
                      <motion.div
                        key="text-input"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex-1 flex flex-col h-full"
                      >
                        <textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder={
                            activeTab === "nota"
                              ? "Despeje seus pensamentos aqui..."
                              : "O que precisa ser feito?"
                          }
                          className="flex-1 w-full bg-zinc-900/40 rounded-[24px] border border-white/5 p-6 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none text-xl leading-relaxed"
                        />
                      </motion.div>
                    )}

                    {/* CHECKLIST INPUT */}
                    {activeTab === "checklist" && (
                      <motion.div
                        key="checklist-input"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex-1 flex flex-col h-full bg-zinc-900/40 rounded-[24px] border border-white/5 p-5 overflow-hidden"
                      >
                        <div className="flex-1 overflow-y-auto mb-4 space-y-2 pr-2">
                          {checklistItems.map(item => (
                            <div key={item.id} className="flex items-center gap-3 p-3 bg-black/50 border border-white/5 rounded-xl cursor-pointer hover:bg-black/80 transition" onClick={() => {
                                playHapticSound("tick");
                                setChecklistItems(prev => prev.map(i => i.id === item.id ? { ...i, completed: !i.completed } : i));
                              }}>
                              <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${item.completed ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'border-white/20'}`}>
                                {item.completed && <CheckSquare className="w-3.5 h-3.5" />}
                              </div>
                              <span className={`text-sm ${item.completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>{item.text}</span>
                              <button className="ml-auto text-zinc-600 hover:text-red-400 p-1" onClick={(e) => {
                                e.stopPropagation();
                                playHapticSound("tick");
                                setChecklistItems(prev => prev.filter(i => i.id !== item.id));
                              }}><X className="w-4 h-4" /></button>
                            </div>
                          ))}
                          {checklistItems.length === 0 && (
                            <div className="text-center py-10 opacity-50 text-xs font-mono uppercase text-zinc-500 mt-4">
                              Sua lista está vazia
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <input 
                            type="text" 
                            value={newChecklistItem}
                            onChange={e => setNewChecklistItem(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && newChecklistItem.trim()) {
                                setChecklistItems(prev => [...prev, { id: 'cli-'+Date.now(), text: newChecklistItem.trim(), completed: false }]);
                                setNewChecklistItem("");
                                playHapticSound("tick");
                              }
                            }}
                            placeholder="Adicionar novo item..."
                            className="flex-1 bg-black/60 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/20 text-white placeholder-zinc-600 transition"
                          />
                          <button 
                            onClick={() => {
                              if (newChecklistItem.trim()) {
                                setChecklistItems(prev => [...prev, { id: 'cli-'+Date.now(), text: newChecklistItem.trim(), completed: false }]);
                                setNewChecklistItem("");
                                playHapticSound("tick");
                              }
                            }}
                            className="px-5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition flex items-center justify-center active:scale-95"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* AUDIO INPUT */}
                    {activeTab === "audio" && (
                      <motion.div
                        key="audio-input"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex-1 flex flex-col items-center justify-center py-10"
                      >
                        <div className="relative">
                          {isRecording && (
                            <motion.div
                              className="absolute -inset-10 rounded-full bg-red-500/20 blur-xl"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                            />
                          )}
                          <button
                            onClick={toggleRecord}
                            className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                              isRecording
                                ? "bg-red-500/20 border-2 border-red-500 text-red-500"
                                : "bg-zinc-800 border-2 border-transparent text-white hover:bg-zinc-700"
                            }`}
                          >
                            <Mic
                              className={`w-12 h-12 ${isRecording ? "animate-pulse" : ""}`}
                            />
                          </button>
                        </div>

                        <div className="mt-10 text-center">
                          <span className="text-3xl font-mono text-white">
                            {formatTime(recordingTime)}
                          </span>
                          <p className="text-sm text-zinc-500 mt-3 font-mono uppercase tracking-widest">
                            {isRecording
                              ? "Gravando áudio..."
                              : recordingTime > 0 ? "Áudio Capturado!" : "Toque para gravar"}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Fake AI / Context Actions */}
                <div className="mt-4 flex gap-2">
                  <button className="py-3 px-4 rounded-xl bg-zinc-900 border border-white/5 text-[10px] font-mono text-zinc-400 uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-1.5 focus:outline-none">
                    <Clock className="w-4 h-4" />
                    <span>Hoje</span>
                  </button>
                  {activeTab === "audio" && isRecording && (
                    <span className="py-3 px-4 flex-1 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-mono uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                      Gravação em curso...
                    </span>
                  )}
                </div>

                {/* Main Submit Action */}
                <button
                  onClick={handleSave}
                  disabled={
                    isSaving || (!content.trim() && activeTab !== "audio")
                  }
                  className="mt-6 w-full py-5 bg-white hover:bg-zinc-200 text-black font-sans font-bold text-lg uppercase tracking-wider rounded-[20px] transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]"
                >
                  {isSaving ? (
                    <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Salvar em Inbox</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* REGISTRY VIEW */
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex gap-2 mb-4 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1">
                  {(["todos", "nota", "tarefa", "audio"] as const).map(filter => (
                    <button
                      key={filter}
                      onClick={() => { playHapticSound("tick"); setRegistryFilter(filter); }}
                      className={`px-4 py-2 rounded-full text-[10px] font-mono uppercase tracking-widest whitespace-nowrap transition-all ${registryFilter === filter ? "bg-white text-black font-bold" : "bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white"}`}
                    >
                      {filter === "tarefa" ? "Tarefas & Checklists" : filter}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto bg-zinc-900/30 rounded-3xl p-4 border border-white/5">
                  <div className="flex flex-col gap-3">
                    {brainDumps.filter(d => registryFilter === "todos" || d.type === registryFilter || (registryFilter === "tarefa" && d.type === "checklist")).length === 0 ? (
                      <div className="text-center py-10 opacity-50">
                        <Archive className="mx-auto w-8 h-8 mb-3 text-zinc-500" />
                        <p className="text-xs uppercase font-mono tracking-widest text-zinc-400">Nenhum registro encontrado</p>
                      </div>
                    ) : (
                      brainDumps.filter(d => registryFilter === "todos" || d.type === registryFilter || (registryFilter === "tarefa" && d.type === "checklist")).map(dump => {
                        const isExpanded = expandedId === dump.id;
                        
                        // Parse back checklist items if saved as items array, or fallback parsing text
                        const getItems = () => {
                          if (dump.items && dump.items.length > 0) return dump.items;
                          if (dump.type === "checklist" || dump.text.includes("[ ]") || dump.text.includes("[x]")) {
                            return dump.text.split("\n").filter(Boolean).map((line, idx) => {
                              const completed = line.trim().startsWith("[x]");
                              const rawText = line.replace(/^\[[ x]\]/, "").trim();
                              return { id: `item-${idx}`, text: rawText, completed };
                            });
                          }
                          return null;
                        };
                        const listItems = getItems();

                        const handleItemToggle = (itemId: string, e: React.MouseEvent) => {
                          e.stopPropagation();
                          playHapticSound("tick");
                          const currentItems = listItems || [];
                          const updatedItems = currentItems.map(item => item.id === itemId ? { ...item, completed: !item.completed } : item);
                          const allDone = updatedItems.every(i => i.completed);
                          const textPayload = updatedItems.map(i => `${i.completed ? "[x]" : "[ ]"} ${i.text}`).join("\n");
                          
                          setBrainDumps(prev => {
                            const changed = prev.map(d => d.id === dump.id ? { ...d, items: updatedItems, text: textPayload, completed: allDone } : d);
                            localStorage.setItem("pulse_braindumps", JSON.stringify(changed));
                            fetch("/api/kv", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ key: "pulse_braindumps", value: changed })
                            }).catch(() => {});
                            return changed;
                          });
                        };

                        const handleDumpDeleteLocal = (e: React.MouseEvent) => {
                          e.stopPropagation();
                          playHapticSound("reset");
                          setBrainDumps(prev => {
                            const changed = prev.filter(d => d.id !== dump.id);
                            localStorage.setItem("pulse_braindumps", JSON.stringify(changed));
                            fetch("/api/kv", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ key: "pulse_braindumps", value: changed })
                            }).catch(() => {});
                            return changed;
                          });
                        };

                        return (
                          <div 
                            key={dump.id} 
                            onClick={() => { playHapticSound("tick"); setExpandedId(isExpanded ? null : dump.id); }}
                            className="p-4 bg-zinc-900 border border-white/5 rounded-2xl relative cursor-pointer hover:bg-zinc-800 transition-colors"
                          >
                            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-2 flex justify-between items-center bg-black/25 -mx-4 -mt-4 px-4 py-2 rounded-t-2xl border-b border-white/5">
                              <div className="flex gap-2 items-center">
                                <span className="opacity-50">{dump.createdAt}</span>
                                <span className="px-1.5 py-0.5 rounded bg-white/5 text-[8px]">{dump.type || 'nota'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {dump.completed && <span className="text-emerald-500 font-bold">Concluído</span>}
                                <button 
                                  onClick={handleDumpDeleteLocal}
                                  className="text-zinc-600 hover:text-red-400 p-1 rounded hover:bg-white/5 transition"
                                  title="Excluir Registro"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            
                            {listItems ? (
                              /* RENDER PREMIUM CHECKLIST IN CARD */
                              <div className="space-y-2 mt-2">
                                {listItems.map(item => (
                                  <div 
                                    key={item.id} 
                                    onClick={(e) => handleItemToggle(item.id, e)} 
                                    className="flex items-center gap-2 p-1.5 bg-black/30 border border-white/5 rounded-xl hover:bg-black/60 transition"
                                  >
                                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${item.completed ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-zinc-700'}`}>
                                      {item.completed && <CheckSquare className="w-3 h-3" />}
                                    </div>
                                    <span className={`text-[12px] font-medium leading-none ${item.completed ? 'line-through text-zinc-600' : 'text-zinc-200'}`}>
                                      {item.text}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              /* NORMAL TEXT */
                              <div className={`text-sm text-zinc-300 font-medium ${dump.completed ? 'line-through opacity-50' : ''} ${isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-2'}`}>
                                {dump.text}
                              </div>
                            )}

                            {/* VOICE Memo Player rendering */}
                            {dump.type === "audio" && dump.voiceUrl && (
                              <VoicePlayer voiceUrl={dump.voiceUrl} playHapticSound={playHapticSound} />
                            )}

                            {!isExpanded && !listItems && dump.text.length > 80 && (
                               <div className="text-[10px] text-zinc-500 mt-2 font-mono">Toque para expandir</div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function VoicePlayer({ voiceUrl, playHapticSound }: { voiceUrl: string; playHapticSound: any }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    playHapticSound("tick");
    
    if (!audioRef.current) {
      audioRef.current = new Audio(voiceUrl);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        playHapticSound("complete");
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Playback failed", err);
      });
    }
  };

  return (
    <div className="flex items-center gap-3 bg-zinc-800/80 p-3 rounded-xl border border-white/5 mt-3 relative" onClick={e => e.stopPropagation()}>
      <button 
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-emerald-400 border border-emerald-500/10 hover:bg-white/10'}`}
      >
        {isPlaying ? (
          <div className="flex gap-0.5 items-end justify-center h-4 pb-0.5">
            <span className="w-1 bg-current h-2 animate-pulse" />
            <span className="w-1 bg-current h-3 animate-pulse duration-300" style={{ animationDelay: '100ms' }} />
            <span className="w-1 bg-current h-1.5 animate-pulse duration-150" style={{ animationDelay: '200ms' }} />
          </div>
        ) : (
          <Play className="w-4 h-4 translate-x-0.5" />
        )}
      </button>
      <div className="flex-1">
        <span className="text-[9px] uppercase font-mono text-zinc-500 block leading-none mb-1">MÉMÓRIA DE VOZ</span>
        <div className="flex gap-0.5 mt-1.5 items-center h-3">
          {Array.from({ length: 28 }).map((_, i) => (
            <div 
              key={i} 
              className={`flex-1 rounded-sm transition-all duration-300 ${isPlaying ? 'bg-emerald-400/80' : 'bg-zinc-700'}`}
              style={{
                height: `${Math.sin(i * 0.4) * (isPlaying ? 12 : 3) + 5}px`,
                opacity: isPlaying ? 1 : 0.4
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
