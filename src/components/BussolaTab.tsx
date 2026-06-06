import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Compass,
  Sparkles,
  CheckCircle,
  Trash2,
  Plus,
  Check,
  BrainCircuit,
  Target,
  X,
  UserRound,
  Camera
} from "lucide-react";

interface VisionItem {
  id: string;
  text: string;
  description?: string;
  category: "paraiso" | "inferno";
  timeframe: "3_meses" | "6_meses" | "1_ano" | "2_anos" | "5_anos";
  image?: string;
}

interface BehaviorPair {
  id: string;
  goodBehavior: string;
  badBehavior: string;
  balance: number; // 0 to 100
}

interface IdentityCharacteristic {
  id: string;
  name: string;
  pairs: BehaviorPair[];
}

interface Milestone {
  id: string;
  text: string;
  completed: boolean;
}

interface TargetGoal {
  id: string;
  title: string;
  category: string;
  milestones: Milestone[];
  connectedTo: string;
}

interface BrainDump {
  id: string;
  text: string;
  createdAt: string;
  completed: boolean;
  type?: "nota" | "tarefa" | "checklist" | "audio";
}

export default function BussolaTab({
  playHapticSound,
}: {
  playHapticSound: (type: "tick" | "complete" | "reset" | "warguerra") => void;
}) {
  const [bussolaSubTab, setBussolaSubTab] = useState<"visao" | "identidade" | "alvos">("visao");

  const [visions, setVisions] = useState<VisionItem[]>(() => {
    const saved = localStorage.getItem("pulse_visions_v4");
    if (saved) return JSON.parse(saved);
    return [
      { id: "v-p5-1", text: "Paz Financeira", category: "paraiso", timeframe: "5_anos" },
      { id: "v-p5-2", text: "Família Estruturada", category: "paraiso", timeframe: "5_anos" },
      { id: "v-i5-1", text: "Zero Reais na Conta", category: "inferno", timeframe: "5_anos" },
      { id: "v-p2-1", text: "Carro Próprio & Imagem", category: "paraiso", timeframe: "2_anos" },
      { id: "v-p2-2", text: "Amparo Frequente ao Filho", category: "paraiso", timeframe: "2_anos" },
      { id: "v-i2-1", text: "Distância Fixa da Criança", category: "inferno", timeframe: "2_anos" },
      { id: "v-p1-1", text: "R$ 50k Mensais Fixos", category: "paraiso", timeframe: "1_ano" },
      { id: "v-p1-2", text: "Físico e Inglês na Régua", category: "paraiso", timeframe: "1_ano" },
      { id: "v-i1-1", text: "Desleixo e Dúvida Geral", category: "inferno", timeframe: "1_ano" },
      { id: "v-p8-1", text: "Bater 30k Correntes", category: "paraiso", timeframe: "6_meses" },
      { id: "v-i8-1", text: "Estagnação", category: "inferno", timeframe: "6_meses" },
      { id: "v-p3-1", text: "Noivado Garantido", category: "paraiso", timeframe: "3_meses" },
      { id: "v-p3-2", text: "Consistência de Treino 100%", category: "paraiso", timeframe: "3_meses" },
      { id: "v-i3-1", text: "Voltar a Estaca Zero no Banco", category: "inferno", timeframe: "3_meses" },
    ] as VisionItem[];
  });

  const [characteristics, setCharacteristics] = useState<IdentityCharacteristic[]>(() => {
    const saved = localStorage.getItem("pulse_identity_characteristics_v1");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "c-1",
        name: "Finanças & Foco",
        pairs: [
          { id: "p-1", goodBehavior: "Constância nos 50K e alocação segura", badBehavior: "Foge do planejamento e gasta à toa", balance: 50 },
          { id: "p-1b", goodBehavior: "Analisa o painel financeiro frio", badBehavior: "Esconde a cabeça por medo de ver o saldo", balance: 50 }
        ]
      },
      {
        id: "c-2",
        name: "Pilar Familiar",
        pairs: [
          { id: "p-2", goodBehavior: "Comunica os passos, protege a relação", badBehavior: "Fica distante para esconder falhas", balance: 50 },
          { id: "p-2b", goodBehavior: "Tem presença genuína com o filho", badBehavior: "Vê o filho rápido por falta de tempo livre", balance: 50 }
        ]
      },
      {
        id: "c-3",
        name: "Físico & Mente",
        pairs: [
          { id: "p-3", goodBehavior: "Vai pra academia religiosamente", badBehavior: "Adia treino porque acordou cansado", balance: 50 },
          { id: "p-3b", goodBehavior: "Inglês 30 min sem falhar", badBehavior: "Inventa desculpa que amanhã estuda", balance: 50 }
        ]
      }
    ];
  });

  const [goals, setGoals] = useState<TargetGoal[]>(() => {
    const saved = localStorage.getItem("pulse_goals_v2");
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "g-1",
        title: "Operação Constância R$ 50k",
        category: "Finanças",
        connectedTo: "Fazer R$ 50k Mensais Constantes",
        milestones: [
          { id: "m-1", text: "Criar painel claro de despesas", completed: true },
          { id: "m-2", text: "Alocar R$ 5k para segurança", completed: false },
        ],
      },
      {
        id: "g-2",
        title: "Evolução Pessoal",
        category: "Desenvolvimento",
        connectedTo: "Shape na Régua & Fluência",
        milestones: [
          { id: "m-4", text: "Estudos diários em inglês (30 min)", completed: false },
        ],
      },
    ];
  });

  const [brainDumps, setBrainDumps] = useState<BrainDump[]>(() => {
    const saved = localStorage.getItem("pulse_braindumps");
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [activeCharId, setActiveCharId] = useState<string>(characteristics[0]?.id || "");

  const [showAddVisionModal, setShowAddVisionModal] = useState(false);
  const [newVisionCategory, setNewVisionCategory] = useState<"paraiso" | "inferno">("paraiso");
  const [newVisionTimeframe, setNewVisionTimeframe] = useState<"3_meses" | "6_meses" | "1_ano" | "2_anos" | "5_anos">("3_meses");
  const [newVisionText, setNewVisionText] = useState("");

  const [showAddPairModal, setShowAddPairModal] = useState(false);
  const [newPairGood, setNewPairGood] = useState("");
  const [newPairBad, setNewPairBad] = useState("");

  const [newBrainDumpText, setNewBrainDumpText] = useState("");

  // We still provide default initial state, but we fetch from server to override it immediately on load.
  useEffect(() => {
    fetch("/api/kv").then(r => r.json()).then(data => {
      if (data["pulse_visions_v4"]) setVisions(data["pulse_visions_v4"]);
      if (data["pulse_identity_characteristics_v1"]) setCharacteristics(data["pulse_identity_characteristics_v1"]);
      if (data["pulse_goals_v2"]) setGoals(data["pulse_goals_v2"]);
      if (data["pulse_braindumps"]) setBrainDumps(data["pulse_braindumps"]);
    }).catch(e => console.error("Failed to fetch kv settings", e));
  }, []);

  useEffect(() => { 
    localStorage.setItem("pulse_visions_v4", JSON.stringify(visions));
    fetch("/api/kv", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "pulse_visions_v4", value: visions }) }).catch(()=>{});
  }, [visions]);
  
  useEffect(() => { 
    localStorage.setItem("pulse_identity_characteristics_v1", JSON.stringify(characteristics));
    fetch("/api/kv", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "pulse_identity_characteristics_v1", value: characteristics }) }).catch(()=>{});
  }, [characteristics]);
  
  useEffect(() => { 
    localStorage.setItem("pulse_goals_v2", JSON.stringify(goals));
    fetch("/api/kv", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "pulse_goals_v2", value: goals }) }).catch(()=>{});
  }, [goals]);
  
  useEffect(() => { 
    localStorage.setItem("pulse_braindumps", JSON.stringify(brainDumps));
    fetch("/api/kv", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "pulse_braindumps", value: brainDumps }) }).catch(()=>{});
  }, [brainDumps]);

  const balance = React.useMemo(() => {
    if (characteristics.length === 0) return 50;
    let totalPairs = 0;
    let totalScore = 0;
    characteristics.forEach(c => {
      c.pairs.forEach(p => {
        totalPairs++;
        totalScore += p.balance;
      });
    });
    if (totalPairs === 0) return 50;
    return Math.max(5, Math.min(95, Math.round(totalScore / totalPairs))); // Between 5% and 95% visually
  }, [characteristics]);

  const activeChar = characteristics.find(c => c.id === activeCharId);

  const handleAddVision = () => {
    if (!newVisionText.trim()) return;
    const item: VisionItem = {
      id: `v-${Date.now()}`,
      text: newVisionText,
      category: newVisionCategory,
      timeframe: newVisionTimeframe,
    };
    setVisions((prev) => [...prev, item]);
    setNewVisionText("");
    setShowAddVisionModal(false);
    playHapticSound("complete");
  };

  const handleDeleteVision = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVisions((prev) => prev.filter((v) => v.id !== id));
    playHapticSound("reset");
  };

  const handleVisionImageUpload = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVisions(prev => prev.map(v => v.id === id ? { ...v, image: reader.result as string } : v));
        playHapticSound("complete");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPair = () => {
    if (!newPairGood.trim() || !newPairBad.trim()) return;
    setCharacteristics(prev => prev.map(c => {
      if (c.id === activeCharId) {
        return {
          ...c,
          pairs: [...c.pairs, { id: `p-${Date.now()}`, goodBehavior: newPairGood, badBehavior: newPairBad, balance: 50 }]
        };
      }
      return c;
    }));
    setNewPairGood("");
    setNewPairBad("");
    setShowAddPairModal(false);
    playHapticSound("complete");
  };

  const updatePairBalance = (charId: string, pairId: string, amount: number) => {
    playHapticSound(amount > 0 ? "tick" : "reset");
    setCharacteristics(prev => prev.map(c => {
      if (c.id === charId) {
         return {
           ...c,
           pairs: c.pairs.map(p => {
             if (p.id === pairId) {
                const newB = Math.max(0, Math.min(100, p.balance + amount));
                return { ...p, balance: newB };
             }
             return p;
           })
         }
      }
      return c;
    }));
  }

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          let newMs = g.milestones.map((m) => {
            if (m.id === milestoneId) {
              const nextSt = !m.completed;
              playHapticSound(nextSt ? "complete" : "tick");
              return { ...m, completed: nextSt };
            }
            return m;
          });
          return { ...g, milestones: newMs };
        }
        return g;
      }),
    );
  };

  const handleAddBrainDump = () => {
    if (!newBrainDumpText.trim()) return;
    const item: BrainDump = {
      id: `b-${Date.now()}`,
      text: newBrainDumpText,
      createdAt: new Date().toLocaleDateString(),
      completed: false,
    };
    setBrainDumps((prev) => [item, ...prev]);
    setNewBrainDumpText("");
    playHapticSound("complete");
  };

  const handleToggleBrainDump = (id: string) => {
    setBrainDumps((prev) => prev.map((b) => b.id === id ? { ...b, completed: !b.completed } : b));
    playHapticSound("tick");
  };

  const handleDeleteBrainDump = (id: string) => {
    setBrainDumps((prev) => prev.filter((b) => b.id !== id));
    playHapticSound("reset");
  };

  const renderTimeframeVisions = (category: "paraiso" | "inferno") => {
    const timeframes = [
      { key: "5_anos", label: "5 Anos" },
      { key: "2_anos", label: "2 Anos" },
      { key: "1_ano", label: "1 Ano" },
      { key: "6_meses", label: "6 Meses" },
      { key: "3_meses", label: "3 Meses" },
    ];

    return timeframes.map(({ key, label }) => {
      const filtered = visions.filter((v) => v.category === category && v.timeframe === key);
      if (filtered.length === 0) return null;

      return (
        <div key={key} className="mb-2 bg-black/40 p-2 rounded-xl">
          <div className="flex items-center gap-1.5 mb-1.5">
             <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{label}</div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filtered.map(vision => (
               <div key={vision.id} className={`relative group overflow-hidden flex items-end gap-1.5 px-2.5 py-2 rounded-lg border border-white/5 transition-all ${vision.image ? 'min-h-[80px] w-full max-w-[140px]' : 'bg-black min-h-[30px]'} ${category === 'paraiso' ? 'hover:border-cyan-500/30' : 'hover:border-red-500/30'}`}>
                  {vision.image && (
                    <>
                      <img src={vision.image} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    </>
                  )}
                  <div className={`z-10 flex-1 text-[11px] font-medium tracking-wide break-words leading-tight ${category === 'paraiso' ? 'text-cyan-50' : 'text-red-50'} drop-shadow-md`}>{vision.text}</div>
                  
                  {/* Controls Layer */}
                  <div className="z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <label className="cursor-pointer text-zinc-500 hover:text-white transition p-0.5" title="Alterar/Adicionar Imagem">
                      <Camera className="w-3 h-3" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleVisionImageUpload(e, vision.id)} />
                    </label>
                    <button onClick={(e) => handleDeleteVision(vision.id, e)} className="text-zinc-500 hover:text-red-400 transition p-0.5">
                       <X className="w-3 h-3" />
                    </button>
                  </div>
               </div>
            ))}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden select-none p-1 text-white relative">
      <div className="flex justify-between items-center bg-transparent px-3 relative z-20 shrink-0 pt-2 pb-3 border-b border-white/5">
        <div className="flex flex-col">
          <div className="text-[10px] uppercase text-zinc-500 font-display font-medium tracking-widest leading-none mb-1">
            Mural Tático
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-black text-white tracking-tight leading-none uppercase">
              Bússola
            </h1>

            <div className="flex bg-zinc-900/80 p-0.5 rounded-full border border-white/10 uppercase font-sans text-[9px] font-bold">
              <button
                onClick={() => { playHapticSound("tick"); setBussolaSubTab("visao"); }}
                className={`py-1 px-3 rounded-full transition ${bussolaSubTab === "visao" ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                Visão
              </button>
              <button
                onClick={() => { playHapticSound("tick"); setBussolaSubTab("identidade"); }}
                className={`py-1 px-3 rounded-full transition ${bussolaSubTab === "identidade" ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                Identidade
              </button>
              <button
                onClick={() => { playHapticSound("tick"); setBussolaSubTab("alvos"); }}
                className={`py-1 px-3 rounded-full transition ${bussolaSubTab === "alvos" ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                Macros & Obj.
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-1 pt-2 pb-2 flex flex-col relative w-full">
        <AnimatePresence mode="wait">
          {bussolaSubTab === "visao" && (
            <motion.div
              key="visao"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex-1 w-full flex min-h-0"
            >
              <div className="w-6 shrink-0 h-full rounded-full bg-zinc-950 border border-white/5 mr-3 flex flex-col justify-end relative overflow-hidden py-4 shadow-[0_0_15px_rgba(0,0,0,0.5)] items-center">
                 <div className="absolute inset-0 bg-zinc-900/50" />
                 <motion.div 
                   className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-red-600 via-amber-500 to-emerald-500"
                   animate={{ height: `${balance}%` }}
                   transition={{ type: "spring", stiffness: 50, damping: 20 }}
                 />
                 <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/30 z-10" />
                 {/* Visual markers */}
                 <div className="relative z-20 flex flex-col items-center justify-between h-full pointer-events-none opacity-50">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    <div className="w-1 h-1 rounded-full bg-white/50" />
                    <div className="w-2 h-[2px] bg-white" />
                    <div className="w-1 h-1 rounded-full bg-white/50" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
              </div>
              <div className="flex-1 flex flex-col gap-1.5 min-h-0 pb-1">
                <div className="flex-1 p-2 rounded-xl border border-cyan-500/10 bg-gradient-to-b from-[#001830] to-[#000510] overflow-hidden flex flex-col relative">
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <h2 className="text-sm md:text-base font-display font-black text-cyan-400 uppercase tracking-tighter mix-blend-screen shadow-cyan-400/20 leading-none mb-1">Paraíso</h2>
                      <span className="text-[9px] font-mono text-cyan-200/60 uppercase tracking-[0.2em] block">O Ápice</span>
                    </div>
                    <button onClick={() => { playHapticSound('tick'); setNewVisionCategory('paraiso'); setShowAddVisionModal(true); }} className="p-1.5 bg-cyan-950 rounded-lg text-cyan-400 border border-cyan-500/20 hover:bg-cyan-900 active:scale-95 transition">
                       <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden pt-1">
                    {renderTimeframeVisions('paraiso')}
                    {visions.filter(v => v.category === 'paraiso').length === 0 && <div className="text-[10px] text-cyan-500/40 uppercase font-mono py-1 text-center flex-1 flex items-center justify-center">Vazio.</div>}
                  </div>
                </div>
                
                <div className="flex-1 p-2 rounded-xl border border-red-500/10 bg-gradient-to-b from-[#300000] to-[#100000] overflow-hidden flex flex-col relative">
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <h2 className="text-sm md:text-base font-display font-black text-red-500 uppercase tracking-tighter mix-blend-screen shadow-red-500/20 leading-none mb-1">Inferno</h2>
                      <span className="text-[9px] font-mono text-red-200/60 uppercase tracking-[0.2em] block">Ruína</span>
                    </div>
                    <button onClick={() => { playHapticSound('tick'); setNewVisionCategory('inferno'); setShowAddVisionModal(true); }} className="p-1.5 bg-red-950 rounded-lg text-red-500 border border-red-500/20 hover:bg-red-900 active:scale-95 transition">
                       <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden pt-1">
                    {renderTimeframeVisions('inferno')}
                    {visions.filter(v => v.category === 'inferno').length === 0 && <div className="text-[10px] text-red-500/40 uppercase font-mono py-1 text-center flex-1 flex items-center justify-center">Vazio.</div>}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {bussolaSubTab === "identidade" && (
            <motion.div
              key="identidade"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full h-full flex flex-col"
            >
              <div className="flex gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden mb-3 shrink-0 pb-1 px-1">
                {characteristics.map(c => (
                   <button 
                     key={c.id} 
                     onClick={() => { playHapticSound('tick'); setActiveCharId(c.id); }}
                     className={`px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider uppercase transition-all whitespace-nowrap active:scale-95 border ${activeCharId === c.id ? 'bg-white text-black font-bold border-white' : 'bg-black text-zinc-500 border-white/5 hover:bg-zinc-900'}`}
                   >
                     {c.name}
                   </button>
                ))}
              </div>

               <div className="flex-1 overflow-y-auto space-y-3 pb-6 min-h-0 [&::-webkit-scrollbar]:hidden mt-1 px-1">
                 {activeChar && activeChar.pairs.map(pair => (
                    <div key={pair.id} className="w-full relative flex flex-col group">
                        
                       <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-20 bg-black border border-white/10 rounded-full p-1 shadow-black shadow-lg">
                          <UserRound className="w-4 h-4 text-zinc-500" strokeWidth={1.5} />
                       </div>

                       <div className="flex gap-2 w-full min-h-[90px]">
                         {/* LEFT: GOOD */}
                         <div 
                           onClick={() => updatePairBalance(activeChar.id, pair.id, 10)}
                           className="flex-1 rounded-l-2xl rounded-r border border-white/5 hover:border-emerald-500/40 relative overflow-hidden bg-[#021008] flex flex-col justify-center p-3.5 cursor-pointer transition-colors select-none"
                         >
                            <div 
                              className="absolute left-0 top-0 bottom-0 bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]" 
                              style={{ width: `${pair.balance}%` }} 
                            />
                            <div className="relative z-10 flex flex-col items-start text-left max-w-[95%]">
                               <div className="text-[9px] uppercase font-mono text-emerald-500 mb-1.5 font-bold tracking-widest flex items-center gap-1 opacity-90">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Construir
                               </div>
                               <div className="text-xs leading-snug font-medium text-emerald-50/90 text-left line-clamp-3">
                                 {pair.goodBehavior}
                               </div>
                            </div>
                         </div>
  
                         {/* RIGHT: BAD */}
                         <div 
                            onClick={() => updatePairBalance(activeChar.id, pair.id, -10)}
                           className="flex-1 rounded-r-2xl rounded-l border border-white/5 hover:border-red-500/40 relative overflow-hidden bg-[#100303] flex flex-col justify-center p-3.5 cursor-pointer transition-colors select-none"
                         >
                            <div 
                              className="absolute right-0 top-0 bottom-0 bg-red-500/10 group-hover:bg-red-500/20 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]" 
                              style={{ width: `${100 - pair.balance}%` }} 
                            />
                            <div className="relative z-10 flex flex-col items-end text-right justify-start w-full max-w-full">
                               <div className="text-[9px] uppercase font-mono text-red-500 mb-1.5 font-bold tracking-widest flex items-center gap-1.5 opacity-90">
                                  Evitar
                                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                               </div>
                               <div className="text-xs leading-snug font-medium text-red-50/90 text-right line-clamp-3">
                                 {pair.badBehavior}
                               </div>
                            </div>
                         </div>
                       </div>
                    </div>
                 ))}
                  {activeChar && (
                   <button 
                     onClick={() => { playHapticSound('tick'); setShowAddPairModal(true); }}
                     className="w-full py-4 border border-dashed border-white/10 rounded-xl text-[11px] text-zinc-500 font-mono tracking-widest uppercase hover:bg-white/[0.02] hover:text-white transition-all flex items-center justify-center gap-2"
                   >
                     <Plus className="w-4 h-4" /> Novo Traço
                   </button>
                 )}
              </div>
            </motion.div>
          )}

          {bussolaSubTab === "alvos" && (
            <motion.div
              key="alvos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 text-left pb-10 w-full h-full overflow-y-auto [&::-webkit-scrollbar]:hidden"
            >
              <div className="rounded-[28px] border border-white/5 bg-zinc-950 p-5 shadow-xl">
                <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-3">
                  <Target className="w-5 h-5 text-zinc-400" />
                  <div>
                    <h3 className="text-sm font-display font-black text-white uppercase tracking-tight">Macros & Objetivos</h3>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">Projetos primários alinhados</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {goals.map((goal) => {
                    const completed = goal.milestones.filter((m) => m.completed).length;
                    const total = goal.milestones.length;
                    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

                    return (
                      <div key={goal.id} className="p-4 rounded-xl bg-black border border-white/5">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-[8px] bg-white/10 text-white px-2 py-0.5 rounded-md uppercase tracking-wider font-mono">{goal.category}</span>
                            <h4 className="text-sm font-display font-bold text-white tracking-tight mt-1.5">{goal.title}</h4>
                          </div>
                          <span className="text-xs font-mono font-bold text-white bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-lg">{percent}%</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mb-4 border border-white/5">
                          <div className="bg-emerald-400 h-full transition-all duration-500 shadow-[0_0_8px_#34d399]" style={{ width: `${percent}%` }} />
                        </div>
                        <div className="space-y-2 pt-2 border-t border-white/5">
                          {goal.milestones.map((ms) => (
                            <div key={ms.id} onClick={() => toggleMilestone(goal.id, ms.id)} className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-white/5 cursor-pointer transition select-none">
                              <span className={`w-4 h-4 rounded-full flex items-center justify-center transition border ${ms.completed ? "border-emerald-500 bg-emerald-500/20 text-emerald-400" : "border-zinc-700 bg-zinc-900"}`}>
                                {ms.completed && <Check className="w-3 h-3 stroke-[3]" />}
                              </span>
                              <span className={`text-[11px] font-mono ${ms.completed ? "line-through text-zinc-600" : "text-zinc-300"}`}>{ms.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/5 bg-zinc-950 p-5 shadow-xl">
                <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
                  <BrainCircuit className="w-5 h-5 text-purple-400" />
                  <div>
                    <h3 className="text-sm font-display font-black text-white uppercase tracking-tight">Inbox / Brain Dump</h3>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">Anotações e tarefas soltas</span>
                  </div>
                </div>

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Esvazie um pensamento..."
                    value={newBrainDumpText}
                    onChange={(e) => setNewBrainDumpText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddBrainDump(); }}
                    className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-xs font-mono placeholder-zinc-700 focus:outline-none focus:border-purple-500/50 transition-all text-white"
                  />
                  <button onClick={handleAddBrainDump} className="px-4 bg-purple-600/20 hover:bg-purple-600 border border-purple-500/30 text-purple-400 hover:text-white rounded-xl font-bold transition flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:hidden pr-1">
                  {brainDumps.map((b) => (
                    <div key={b.id} className="flex justify-between items-center p-3 bg-black rounded-xl border border-white/5 hover:border-white/10 transition">
                      <div onClick={() => handleToggleBrainDump(b.id)} className="flex items-center gap-3 flex-1 cursor-pointer">
                        <span className={`w-4 h-4 rounded flex items-center justify-center transition border ${b.completed ? "border-purple-500 text-purple-400 bg-purple-500/10" : "border-zinc-700 bg-zinc-900"}`}>
                          {b.completed && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                        <div className="flex flex-col text-left">
                          <span className={`text-xs font-mono tracking-wide ${b.completed ? "line-through text-zinc-600" : "text-zinc-300"}`}>{b.text}</span>
                          <span className="text-[9px] text-zinc-600 font-mono mt-0.5">{b.createdAt}</span>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteBrainDump(b.id)} className="p-2 text-zinc-600 hover:text-red-400 transition bg-white/5 rounded-lg ml-2 hover:bg-white/10">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {brainDumps.length === 0 && <div className="text-center py-8 text-zinc-600 font-mono text-xs uppercase">Mente limpa. Nenhum dump aberto.</div>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showAddVisionModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-white/10 p-6 rounded-[28px] w-full max-w-sm flex flex-col gap-5 text-left shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <div>
              <span className={`text-[8px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-sm ${newVisionCategory === 'paraiso' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-red-500/10 text-red-500'}`}>Novo Registro</span>
              <h3 className="text-lg font-display font-black text-white uppercase mt-2">Visão do {newVisionCategory === "paraiso" ? "Paraíso" : "Inferno"}</h3>
            </div>
            <div className="flex flex-col gap-4 font-mono">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-zinc-500 uppercase">Horizonte</label>
                <select value={newVisionTimeframe} onChange={(e) => setNewVisionTimeframe(e.target.value as any)} className="bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-white/30 truncate">
                  <option value="5_anos">5 Anos</option><option value="2_anos">2 Anos</option><option value="1_ano">1 Ano</option><option value="6_meses">6 Meses</option><option value="3_meses">3 Meses</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-zinc-500 uppercase">Palavra Chave / Norte</label>
                <input type="text" placeholder="Ex: Liberdade Geográfica" value={newVisionText} onChange={(e) => setNewVisionText(e.target.value)} className="bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-700 outline-none focus:border-white/30" />
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => setShowAddVisionModal(false)} className="flex-1 py-3 bg-zinc-900 border border-white/10 hover:bg-zinc-800 rounded-xl font-mono text-[10px] text-zinc-300 uppercase tracking-wider">Cancelar</button>
              <button onClick={handleAddVision} className={`flex-1 py-3 text-black rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider transition ${newVisionCategory === 'paraiso' ? 'bg-cyan-400 hover:bg-cyan-300' : 'bg-red-500 hover:bg-red-400 text-white'}`}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {showAddPairModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-white/10 p-6 rounded-[28px] w-full max-w-sm flex flex-col gap-5 text-left shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <div>
              <span className="text-[8px] font-mono text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-sm uppercase tracking-widest">Novo Comportamento</span>
              <h3 className="text-lg font-display font-black text-white uppercase mt-2 leading-tight">Cadastrar Traço</h3>
              <p className="text-[10px] font-mono text-zinc-500 mt-1 uppercase">Opostos definem suas escolhas diárias.</p>
            </div>
            <div className="flex flex-col gap-4 font-mono">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] text-emerald-500 uppercase flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Operador (Construção)</label>
                <input type="text" placeholder="Ação ideal..." value={newPairGood} onChange={(e) => setNewPairGood(e.target.value)} className="bg-black border border-emerald-500/20 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-700 outline-none focus:border-emerald-500/50" />
              </div>
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-[9px] text-red-500 uppercase flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-red-500 rounded-full" /> Sabotador (Destruição)</label>
                <input type="text" placeholder="Ação fraca..." value={newPairBad} onChange={(e) => setNewPairBad(e.target.value)} className="bg-black border border-red-500/20 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-700 outline-none focus:border-red-500/50" />
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => setShowAddPairModal(false)} className="flex-1 py-3 bg-zinc-900 border border-white/10 hover:bg-zinc-800 rounded-xl font-mono text-[10px] text-zinc-300 uppercase tracking-wider">Cancelar</button>
              <button onClick={handleAddPair} className="flex-1 py-3 bg-white hover:bg-zinc-200 text-black rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider">Adicionar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
