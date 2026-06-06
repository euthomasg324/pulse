import React, { useState } from "react";
import { Habit, HabitType } from "../types";
import { 
  Search, 
  Sparkles, 
  Trash2, 
  Zap, 
  Moon, 
  Sun, 
  Droplets, 
  BookOpen, 
  MessageSquare,
  PhoneCall, 
  TrendingUp, 
  Clock, 
  Award, 
  Activity, 
  Plus, 
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  X,
  Play
} from "lucide-react";
import { iconMap, colorPresets } from "../data";

interface HabitosTabProps {
  habits: Habit[];
  onCreateHabit: (habitData: Partial<Habit>) => void;
  onDeleteHabit: (id: string) => void;
  playHapticSound: (type: 'tick' | 'complete' | 'reset' | 'warguerra') => void;
}

export default function HabitosTab({ 
  habits, 
  onCreateHabit, 
  onDeleteHabit, 
  playHapticSound 
}: HabitosTabProps) {
  // Filter and search keys
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");

  // Onboarding wizard popup layout
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  
  // New habit parameters
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitType, setNewHabitType] = useState<HabitType>("check");
  const [newHabitTarget, setNewHabitTarget] = useState<number>(1);
  const [newHabitFrequency, setNewHabitFrequency] = useState<string>("daily");
  const [newHabitInterval, setNewHabitInterval] = useState<number>(1);
  const [newHabitColor, setNewHabitColor] = useState<string>("blue");
  const [newHabitIcon, setNewHabitIcon] = useState<string>("Zap");
  const [newHabitHasTime, setNewHabitHasTime] = useState<boolean>(false);
  const [newHabitTime, setNewHabitTime] = useState<string>("08:00");
  const [newHabitCategory, setNewHabitCategory] = useState<string>("Execução");
  const [newHabitExigencia, setNewHabitExigencia] = useState<string>("Moderado");
  const [newHabitConnectedMacroId, setNewHabitConnectedMacroId] = useState<string>("");
  const [newHabitConnectedTraitId, setNewHabitConnectedTraitId] = useState<string>("");

  const categories = ["todos", "Execução", "Energia", "Ritmo", "Resultado"];

  // Retrieve existing goals and traits from Bussola for mapping connections
  const availableGoals = React.useMemo(() => {
    try {
      const saved = localStorage.getItem("pulse_goals_v2");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  }, [isWizardOpen]);

  const availableTraits = React.useMemo(() => {
    try {
      const saved = localStorage.getItem("pulse_identity_characteristics_v1");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  }, [isWizardOpen]);

  const filteredHabits = habits.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === "todos" || h.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Wizard action handlers
  const handleNextStep = () => {
    if (wizardStep === 1 && !newHabitName.trim()) {
      return; // Name is required
    }
    playHapticSound('tick');
    setWizardStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    playHapticSound('tick');
    setWizardStep(prev => Math.max(1, prev - 1));
  };

  const handleCreate = () => {
    playHapticSound('complete');

    onCreateHabit({
      name: newHabitName,
      type: newHabitType,
      targetValue: newHabitTarget,
      frequencyType: newHabitFrequency as any,
      frequencyInterval: newHabitFrequency === 'every-x-days' ? newHabitInterval : undefined,
      color: newHabitColor,
      icon: newHabitIcon,
      timeOfDay: newHabitHasTime ? newHabitTime : undefined,
      category: newHabitCategory,
      exigencia: newHabitExigencia as any,
      connectedMacroId: newHabitConnectedMacroId,
      connectedTraitId: newHabitConnectedTraitId
    });

    // Reset wizard
    setIsWizardOpen(false);
    setWizardStep(1);
    setNewHabitName("");
    setNewHabitType("check");
    setNewHabitTarget(1);
    setNewHabitFrequency("daily");
    setNewHabitColor("blue");
    setNewHabitIcon("Zap");
    setNewHabitExigencia("Moderado");
    setNewHabitConnectedMacroId("");
    setNewHabitConnectedTraitId("");
  };

  const iconsList = [
    "Zap", "Sun", "Moon", "Droplets", "BookOpen", "MessageSquare", "PhoneCall", "TrendingUp", "Clock", "Award", "Activity"
  ];

  const colorsList = ["blue", "green", "orange", "purple", "red"];

  return (
    <div id="habits-tab-root" className="flex flex-col h-full overflow-hidden justify-between select-none p-1 text-white uppercase font-mono">
      
      {/* Top action layout */}
      <div className="flex flex-col gap-2 shrink-0 py-2.5">
        <div className="flex justify-between items-center px-1">
          <div>
            <div className="text-[10px] text-zinc-500 tracking-widest leading-none mb-0.5">Indicadores do Sistema</div>
            <h1 className="text-xl font-display font-black tracking-tight text-white leading-tight">Configurações</h1>
          </div>
          
          <button
            id="btn-open-wizard"
            onClick={() => { playHapticSound('tick'); setIsWizardOpen(true); }}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-black text-[10px] font-bold rounded-full cursor-pointer shadow-lg transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            Criar Hábito
          </button>
        </div>

        {/* Search & Filter tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1 relative">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar por indicador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-white/5 py-1.5 pl-8 pr-3 rounded-xl text-[10px] uppercase font-mono text-zinc-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 placeholder-zinc-600"
            />
          </div>

          {/* Categories selectors */}
          <div className="flex gap-1 overflow-x-auto scroller-hidden pr-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { playHapticSound('tick'); setSelectedCategory(cat); }}
                className={`py-1 px-2.5 rounded-lg text-[8.5px] font-bold cursor-pointer transition capitalize font-mono shrink-0 ${
                  selectedCategory === cat 
                    ? "bg-zinc-900 text-white border border-white/10" 
                    : "text-zinc-500 border border-transparent hover:text-zinc-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Habits Horizontal list organization with pagination style */}
      <div id="habits-list-scrollable" className="flex-1 overflow-y-auto pr-1 pb-2 content-start space-y-2.5 pt-1">
        {filteredHabits.length === 0 ? (
          <div className="text-center py-12 text-zinc-600 text-xs border border-dashed border-white/5 rounded-2xl">
            Nenhum hábito ou indicador localizado com estes filtros.
          </div>
        ) : (
          filteredHabits.map((habit) => {
            const IconComponent = iconMap[habit.icon] || Zap;
            const colorKey = habit.color || "blue";
            const colorSetting = colorPresets[colorKey as keyof typeof colorPresets] || colorPresets.blue;

            // Generate miniature visual consistency trackbar (actual days logs)
            const logs = habit.logs || [];
            const completePercentage = logs.length > 0 
              ? Math.round((logs.filter(l => l.completed).length / logs.length) * 100)
              : 0;

            return (
              <div
                key={habit.id}
                className="bg-zinc-950/45 hover:bg-zinc-900/40 border border-white/5 hover:border-white/10 rounded-2xl p-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="p-2 border rounded-xl flex items-center justify-center" style={{ backgroundColor: colorSetting.bg, borderColor: colorSetting.border }}>
                    <IconComponent className="w-4 h-4" style={{ color: colorSetting.hex }} />
                  </span>

                  <div className="text-left min-w-0">
                    <h3 className="text-xs font-bold text-white tracking-wide truncate">{habit.name}</h3>
                    <div className="flex items-center gap-1.5 text-[8.5px] text-zinc-500 font-mono tracking-wider mt-0.5">
                      <span>{habit.type.toUpperCase()}</span>
                      <span>•</span>
                      <span>COV {habit.frequencyType}</span>
                      {habit.timeOfDay && (
                        <>
                          <span>•</span>
                          <span>{habit.timeOfDay}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Micro consistency metrics and Mini consistency trackbar */}
                <div className="flex items-center justify-between w-full md:w-auto gap-4 shrink-0">
                  <div className="text-left md:text-right shrink-0">
                    <div className="text-[8px] text-zinc-600">CONSISTÊNCIA</div>
                    <div className="text-[11px] font-bold text-emerald-400 font-mono tracking-tighter mt-0.5">
                      {completePercentage}% CONCLUÍDO
                    </div>
                  </div>

                  {/* Micro list of past 6 logs circles of actual logs */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: 6 }).map((_, idx) => {
                      // Map to display the last 6 entries from habit logs
                      const logIndex = logs.length - 6 + idx;
                      const log = logIndex >= 0 ? logs[logIndex] : null;
                      const complete = log ? log.completed : false;
                      return (
                        <div 
                          key={idx} 
                          className={`w-2.5 h-2.5 rounded-full border ${
                            complete ? 'bg-emerald-500 border-emerald-400' : 'bg-zinc-950 border-white/5'
                          }`}
                          title={log ? `${log.date}: ${log.completed ? 'Concluído' : 'Pendente'}` : 'Sem registro'}
                        />
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      if (confirm("Deseja deletar este indicador? Esta operação é irreversível.")) {
                        onDeleteHabit(habit.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-950/20 active:scale-95 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* STEP ONBOARDING WIZARD OVERLAY */}
      {isWizardOpen && (
        <div id="wizard-viewport" className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-center items-center p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-[24px] overflow-hidden p-5 flex flex-col justify-between min-h-[420px] max-h-[85vh]">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-[9px] text-[#444] tracking-widest font-mono">CADASTRO DE DISCIPLINA OPERACIONAL</span>
              <button
                id="btn-close-wizard"
                onClick={() => { playHapticSound('tick'); setIsWizardOpen(false); }}
                className="p-1 rounded-full text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Steps indicator bar tracker */}
            <div className="grid grid-cols-6 gap-1 my-3 bg-black/40 p-1 rounded-full border border-white/5">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    wizardStep >= idx + 1 ? 'bg-emerald-500' : 'bg-zinc-900'
                  }`}
                />
              ))}
            </div>

            {/* Step canvas inputs */}
            <div className="flex-1 flex flex-col justify-center py-4 text-left">
              
              {/* Step 1: name */}
              {wizardStep === 1 && (
                <div className="space-y-3">
                  <label className="block text-[10px] text-zinc-400 font-mono tracking-widest uppercase">PASSO 1: QUAL O NOME DO SEU NOVO INDICADOR?</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 300 mensagens, 50 ligações, Água..."
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs uppercase font-mono tracking-wider focus:outline-none focus:border-emerald-500 text-white placeholder-zinc-700"
                    maxLength={32}
                  />
                  <div className="text-[9px] text-zinc-600 uppercase font-mono">Use poucas palavras. Nomes literais e fáceis de ler no centro operacional.</div>
                </div>
              )}

              {/* Step 2: type */}
              {wizardStep === 2 && (
                <div className="space-y-3">
                  <label className="block text-[10px] text-zinc-400 font-mono tracking-widest uppercase">PASSO 2: QUAL A METODOLOGIA DE MEDIÇÃO?</label>
                  <div className="grid grid-cols-2 gap-2 text-[10px] tracking-wider font-bold">
                    <button
                      onClick={() => { playHapticSound('tick'); setNewHabitType("check"); }}
                      className={`p-3 rounded-xl border text-left transition uppercase ${
                        newHabitType === 'check' ? 'bg-emerald-950/20 border-emerald-500 text-emerald-400' : 'bg-zinc-900/60 border-white/5 text-zinc-400'
                      }`}
                    >
                      Check Simples
                      <span className="block text-[8px] text-zinc-500 font-normal mt-1 leading-normal capitalize">Tapar apenas para marcar concluído/pendente.</span>
                    </button>
                    <button
                      onClick={() => { playHapticSound('tick'); setNewHabitType("quantitative"); }}
                      className={`p-3 rounded-xl border text-left transition uppercase ${
                        newHabitType === 'quantitative' ? 'bg-blue-950/20 border-blue-500 text-blue-400' : 'bg-zinc-900/60 border-white/5 text-zinc-400'
                      }`}
                    >
                      Quantitativo
                      <span className="block text-[8px] text-zinc-500 font-normal mt-1 leading-normal capitalize">Contagem manual numérica e incrementos.</span>
                    </button>
                    <button
                      onClick={() => { playHapticSound('tick'); setNewHabitType("timed"); }}
                      className={`p-3 rounded-xl border text-left transition col-span-2 uppercase ${
                        newHabitType === 'timed' ? 'bg-[#ff9c00]/10 border-[#ff9c00] text-[#ff9c00]' : 'bg-zinc-900/60 border-white/5 text-zinc-400'
                      }`}
                    >
                      Cronômetro Ativo
                      <span className="block text-[8px] text-zinc-500 font-normal mt-1 leading-normal capitalize">Acumula minutos com cronômetro integrado no card.</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Target value */}
              {wizardStep === 3 && (
                <div className="space-y-3">
                  <label className="block text-[10px] text-zinc-400 font-mono tracking-widest uppercase">PASSO 3: QUAL A META DIÁRIA?</label>
                  <input
                    type="number"
                    min={1}
                    value={newHabitTarget}
                    onChange={(e) => setNewHabitTarget(Number(e.target.value) || 1)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs uppercase font-mono tracking-wider focus:outline-none focus:border-emerald-500 text-white"
                  />
                  <div className="text-[9px] text-zinc-600 uppercase font-mono">Ex: meta de 300 mensagens por dia, 50 ligações, 3 litros se for água, ou 20 minutos de meditação.</div>
                </div>
              )}

              {/* Step 4: Frequency/Scheduling config */}
              {wizardStep === 4 && (
                <div className="space-y-3">
                  <label className="block text-[10px] text-zinc-400 font-mono tracking-widest uppercase">PASSO 4: QUAL A FREQUÊNCIA OPERACIONAL?</label>
                  <select
                    value={newHabitFrequency}
                    onChange={(e) => { playHapticSound('tick'); setNewHabitFrequency(e.target.value); }}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs uppercase font-mono tracking-wider focus:outline-none focus:border-emerald-500 text-zinc-300"
                  >
                    <option value="daily">Diário (Todos os dias)</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="flex items-center gap-2 text-[8px] text-zinc-500 font-mono">
                        <input 
                          type="checkbox" 
                          checked={newHabitHasTime} 
                          onChange={(e) => { playHapticSound('tick'); setNewHabitHasTime(e.target.checked); }}
                          className="accent-emerald-500"
                        />
                        POSSUI HORÁRIO?
                      </label>
                      {newHabitHasTime ? (
                        <input
                          type="time"
                          value={newHabitTime}
                          onChange={(e) => setNewHabitTime(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 rounded-xl p-2 text-xs uppercase font-mono tracking-wider focus:outline-none text-zinc-300"
                        />
                      ) : (
                        <div className="w-full bg-zinc-900/50 border border-white/5 rounded-xl p-2 text-xs uppercase font-mono tracking-wider text-zinc-600 flex items-center h-[34px]">
                          LIVRE
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-[8px] text-zinc-500 mb-1 font-mono">CATEGORIA</label>
                      <select
                        value={newHabitCategory}
                        onChange={(e) => setNewHabitCategory(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl p-2 text-xs uppercase font-mono text-zinc-400 focus:outline-none"
                      >
                        <option value="Execução">Execução</option>
                        <option value="Energia">Energia</option>
                        <option value="Ritmo">Ritmo</option>
                        <option value="Resultado">Resultado</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: color selector */}
              {wizardStep === 5 && (
                <div className="space-y-4">
                  <label className="block text-[10px] text-zinc-400 font-mono tracking-widest uppercase">PASSO 5: IDENTIDADE VISUAL</label>
                  
                  {/* Selectors for icon */}
                  <div>
                    <span className="block text-[8px] text-[#444] tracking-wide mb-1.5 uppercase">SELECIONAR ÍCONE</span>
                    <div className="grid grid-cols-6 gap-1 bg-zinc-900/40 p-2 rounded-2xl border border-white/5 justify-items-center">
                      {iconsList.map((ic) => {
                        const IconItem = iconMap[ic] || Zap;
                        return (
                          <button
                            key={ic}
                            onClick={() => { playHapticSound('tick'); setNewHabitIcon(ic); }}
                            className={`p-2 rounded-lg border cursor-pointer hover:bg-zinc-800 transition ${
                              newHabitIcon === ic ? 'bg-zinc-800 border-white/40 text-emerald-400' : 'border-transparent text-zinc-500'
                            }`}
                          >
                            <IconItem className="w-3.5 h-3.5" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selectors for color */}
                  <div>
                    <span className="block text-[8px] text-[#444] tracking-wide mb-1.5 uppercase">SELECIONAR COR</span>
                    <div className="flex gap-2 bg-zinc-900/40 p-2 rounded-2xl border border-white/5 justify-center">
                      {colorsList.map((col) => (
                        <button
                          key={col}
                          onClick={() => { playHapticSound('tick'); setNewHabitColor(col); }}
                          className={`w-5 h-5 rounded-full border cursor-pointer relative flex items-center justify-center`}
                          style={{ 
                            backgroundColor: colorPresets[col as keyof typeof colorPresets]?.hex, 
                            borderColor: newHabitColor === col ? '#ffffff' : 'transparent'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 6: Exigency and Inter-Connections */}
              {wizardStep === 6 && (
                <div className="space-y-4">
                  <label className="block text-[10px] text-emerald-400 font-mono tracking-widest uppercase">PASSO 6: INTELIGÊNCIA E CONEXÃO</label>
                  
                  <div>
                    <span className="block text-[8px] text-[#444] tracking-wide mb-1.5 uppercase">NÍVEL DE EXIGÊNCIA ENERGÉTICA</span>
                    <select
                      value={newHabitExigencia}
                      onChange={(e) => setNewHabitExigencia(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs uppercase font-mono text-zinc-300 focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="Leve">Leve (Automático)</option>
                      <option value="Moderado">Moderado (Exige Foco)</option>
                      <option value="Alto">Alto (Gasto Extremo de Energia)</option>
                      <option value="Extremo">Extremo (Custo de Vontade Máximo)</option>
                    </select>
                  </div>

                  <div>
                    <span className="block text-[8px] text-[#444] tracking-wide mb-1.5 uppercase">VINCULAR A UM MACRO OBJETIVO (BÚSSOLA)</span>
                    <select
                      value={newHabitConnectedMacroId}
                      onChange={(e) => setNewHabitConnectedMacroId(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs uppercase font-mono text-zinc-300 focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="">Não vincular nenhum macro</option>
                      {availableGoals.map((g: any) => (
                        <option key={g.id} value={g.id}>{g.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="block text-[8px] text-[#444] tracking-wide mb-1.5 uppercase">VINCULAR AO COMPORTAMENTO (IDENTIDADE OP/SAB)</span>
                    <select
                      value={newHabitConnectedTraitId}
                      onChange={(e) => setNewHabitConnectedTraitId(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs uppercase font-mono text-zinc-300 focus:outline-none focus:border-emerald-500/50"
                    >
                      <option value="">Não vincular traço de identidade</option>
                      {availableTraits.flatMap((char: any) => char.pairs.map((p: any) => (
                        <option key={p.id} value={p.id}>{char.name} - Op/Sab </option>
                      )))}
                    </select>
                  </div>
                </div>
              )}

              {/* Step 7: live preview card */}
              {wizardStep === 7 && (
                <div className="space-y-4">
                  <label className="block text-[10px] text-zinc-400 font-mono tracking-widest uppercase">PASSO 7: CONFIRMAR PREVIEW DO CARD OPERACIONAL</label>
                  
                  {/* Live Card simulation render */}
                  <div className="bg-zinc-950 border border-white/10 rounded-[18px] p-4 flex flex-col justify-between min-h-[110px] max-w-[210px] mx-auto text-white shadow-xl relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-zinc-900 text-zinc-100 flex items-center justify-center">
                          {React.createElement(iconMap[newHabitIcon] || Zap, { className: "w-3.5 h-3.5 text-emerald-400" })}
                        </span>
                        <div className="text-left font-mono">
                          <div className="text-[10px] font-bold text-white uppercase">{newHabitName || "Novo Hábito"}</div>
                          <div className="text-[7.5px] text-zinc-600">{newHabitCategory || "Execução"}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-left">
                      <div className="text-[8px] text-[#444] leading-none mb-1">PROGRESÃO DIÁRIA</div>
                      <div className="text-sm font-black font-mono">0 / {newHabitTarget}</div>
                    </div>
                  </div>

                  <div className="text-center text-[9.5px] text-zinc-500">Tudo pronto. Salve para ativar este novo circuito de acompanhamento.</div>
                </div>
              )}
            </div>

            {/* Footer action steps navigation buttons */}
            <div className="flex justify-between items-center shrink-0 border-t border-white/5 pt-3">
              {wizardStep > 1 ? (
                <button
                  onClick={handlePrevStep}
                  className="flex items-center gap-1 py-1.5 px-3 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-400 text-[10px] font-bold rounded-lg cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Voltar
                </button>
              ) : (
                <div />
              )}

              {wizardStep < 7 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={wizardStep === 1 && !newHabitName.trim()}
                  className={`flex items-center gap-1 py-1.5 px-4 text-[10px] font-bold rounded-lg cursor-pointer ${
                    wizardStep === 1 && !newHabitName.trim() 
                      ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed' 
                      : 'bg-zinc-200 text-black hover:bg-white'
                  }`}
                >
                  Próximo
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleCreate}
                  className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-black text-[10px] font-bold rounded-lg cursor-pointer transition animate-pulse"
                >
                  Ativar Indicador
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
