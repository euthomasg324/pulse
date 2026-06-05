import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Mic,
  FileText,
  CheckSquare,
  Clock,
  Send,
  Loader2,
} from "lucide-react";

interface InputCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  playHapticSound: (type: "tick" | "complete" | "reset" | "warguerra") => void;
}

type TabType = "nota" | "tarefa" | "audio" | "checklist";

export default function InputCaptureModal({
  isOpen,
  onClose,
  playHapticSound,
}: InputCaptureModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("nota");
  const [content, setContent] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    if (!content.trim() && activeTab !== "audio") return;

    playHapticSound("tick");
    setIsSaving(true);

    // Fake save delay
    setTimeout(() => {
      setIsSaving(false);
      setContent("");
      playHapticSound("complete");
      onClose();
    }, 600);
  };

  const toggleRecord = () => {
    playHapticSound("tick");
    setIsRecording(!isRecording);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-zinc-950 border-t border-white/10 rounded-t-[32px] flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.8)] max-h-[90dvh]"
          >
            {/* Handle Bar */}
            <div
              className="w-full flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
              onClick={onClose}
            >
              <div className="w-12 h-1.5 bg-zinc-800 rounded-full" />
            </div>

            <div className="px-5 pb-8 pt-2 flex flex-col h-full max-h-[85vh]">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                  <h2 className="text-2xl font-display font-black text-white tracking-tight">
                    Brain Dump
                  </h2>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                    Esvazie sua mente
                  </span>
                </div>
                <button
                  onClick={() => {
                    playHapticSound("tick");
                    onClose();
                  }}
                  className="p-2 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white transition-all shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

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
                        className={`flex-1 py-2.5 rounded-xl flex flex-col items-center gap-1 transition-all ${
                          isActive
                            ? "bg-zinc-800 text-white shadow-md"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {tab === "nota" && <FileText className="w-4 h-4" />}
                        {tab === "tarefa" && (
                          <CheckSquare className="w-4 h-4" />
                        )}
                        {tab === "checklist" && (
                          <CheckSquare className="w-4 h-4" />
                        )}
                        {tab === "audio" && <Mic className="w-4 h-4" />}
                        <span className="text-[9px] font-mono uppercase tracking-widest font-bold hidden sm:block">
                          {tab}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>

              {/* Dynamic Content Area */}
              <div className="flex-1 flex flex-col overflow-hidden relative">
                <AnimatePresence mode="wait">
                  {/* TEXT BASED INPUT (Notas, Tarefa, Checklist) */}
                  {(activeTab === "nota" ||
                    activeTab === "tarefa" ||
                    activeTab === "checklist") && (
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
                            : activeTab === "tarefa"
                              ? "O que precisa ser feito?"
                              : "Item 1...\nItem 2...\nItem 3..."
                        }
                        className="flex-1 w-full bg-zinc-900/40 rounded-2xl border border-white/5 p-4 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all resize-none text-base"
                      />
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
                            className="absolute -inset-8 rounded-full bg-red-500/20 blur-xl"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          />
                        )}
                        <button
                          onClick={toggleRecord}
                          className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                            isRecording
                              ? "bg-red-500/20 border-2 border-red-500 text-red-500"
                              : "bg-zinc-800 border-2 border-transparent text-white hover:bg-zinc-700"
                          }`}
                        >
                          <Mic
                            className={`w-10 h-10 ${isRecording ? "animate-pulse" : ""}`}
                          />
                        </button>
                      </div>

                      <div className="mt-8 text-center">
                        <span className="text-xl font-mono text-white">
                          {isRecording ? "00:03" : "00:00"}
                        </span>
                        <p className="text-xs text-zinc-500 mt-2 font-mono uppercase tracking-widest">
                          {isRecording
                            ? "Gravando áudio..."
                            : "Toque para gravar"}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Fake AI / Context Actions */}
              <div className="mt-4 flex gap-2">
                <button className="py-2 px-3 rounded-lg bg-zinc-900 border border-white/5 text-[10px] font-mono text-zinc-400 uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-1.5 focus:outline-none">
                  <Clock className="w-3 h-3" />
                  <span>Hoje</span>
                </button>
                {activeTab === "audio" && isRecording && (
                  <span className="py-2 px-3 flex-1 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-[10px] font-mono uppercase tracking-widest flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
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
                className="mt-6 w-full py-4 bg-white hover:bg-zinc-200 text-black font-sans font-bold text-sm uppercase tracking-wider rounded-2xl transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Salvar em Inbox</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
