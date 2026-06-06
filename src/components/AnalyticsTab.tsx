import React, { useState, useEffect } from "react";
import { 
  BarChart2, 
  Flame, 
  Calendar, 
  Award, 
  TrendingUp, 
  Zap, 
  MessageSquare, 
  PhoneCall, 
  Droplets, 
  BookOpen,
  Clock, 
  ShieldAlert,
  Loader2,
  Download,
  CheckCircle,
  TrendingDown,
  AlertTriangle,
  Smile,
  Activity
} from "lucide-react";
import { iconMap, colorPresets } from "../data";

interface AnalyticsTabProps {
  playHapticSound: (type: 'tick' | 'complete' | 'reset' | 'warguerra') => void;
}

export default function AnalyticsTab({ playHapticSound }: AnalyticsTabProps) {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'geral' | 'gargalos' | 'graficos'>('geral');

  // Load insights from SQL backend `/api/insights`
  useEffect(() => {
    fetch("/api/insights")
      .then(res => res.json())
      .then(data => {
        setInsights(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed loading insights data:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 font-mono text-xs h-full">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mb-2.5" />
        SESSÃO DE ENGRENAGEM DE METAS...
      </div>
    );
  }

  // Safe fallback options
  const scoreToday = insights?.score?.today ?? 0;
  const scoreWeek = insights?.score?.week ?? 0;
  const streak = insights?.streakDays ?? 0;
  const trendList = insights?.weeklyTrend || [];
  const hoursData = insights?.dailyExecutionHours || [];
  const habitsAnalysis = insights?.habitsAnalysis || [];
  
  const volumes = insights?.volumes || [];
  const correlations = insights?.correlations || [];

  const bestHour = insights?.bestTimeText || "Seu melhor horário de foco é entre 07h e 11h.";
  const tendency = insights?.tendencyText || "Cadência operacional impecável. Você está acelerando seu volume.";

  // Sort habits to isolate bottlenecks and strengths
  const bottlenecks = [...habitsAnalysis]
    .sort((a, b) => a.completionRate - b.completionRate); // Lowest rate first
  const strengths = [...habitsAnalysis]
    .sort((a, b) => b.completionRate - a.completionRate); // Highest rate first

  // Heat map scaling background color code
  const getCellColor = (score: number) => {
    if (score === 0) return "bg-zinc-950 border-white/5 text-zinc-700";
    if (score < 40) return "bg-rose-950/20 border-rose-900/30 text-rose-400";
    if (score < 80) return "bg-amber-950/20 border-amber-900/30 text-amber-500";
    return "bg-emerald-500 border-transparent text-black font-black";
  };

  // Compute SVG Line coordinates for trendList
  const getSvgCoordinates = () => {
    if (trendList.length < 2) return "";
    const width = 460;
    const height = 120;
    const paddingLeft = 20;
    const paddingTop = 15;

    return trendList.map((day: any, i: number) => {
      const x = paddingLeft + (i / (trendList.length - 1)) * (width - 40);
      const y = paddingTop + height - (day.score / 100) * height;
      return `${x},${y}`;
    }).join(" ");
  };

  return (
    <div id="analytics-tab-root" className="flex flex-col h-full overflow-hidden justify-between select-none p-1 text-white uppercase font-mono">
      
      {/* Tab Header with visual styling */}
      <div className="shrink-0 py-3 text-left px-1 flex justify-between items-end border-b border-white/5 mb-3">
        <div>
          <div className="text-[9px] text-zinc-500 tracking-widest leading-none mb-1">MÉTRICAS DO DISPOSITIVO</div>
          <h1 className="text-2xl font-sans font-black tracking-tight text-white leading-none">Métricas</h1>
        </div>
        <div className="text-[10px] text-zinc-400 bg-zinc-900 border border-white/5 px-2.5 py-1 rounded-full flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sincronizado SQL</span>
        </div>
      </div>

      {/* Primary Sub-Navigation Row */}
      <div className="shrink-0 grid grid-cols-3 gap-1 bg-zinc-950 border border-white/5 p-1 rounded-2xl mb-4 text-[10px] font-bold">
        {(['geral', 'gargalos', 'graficos'] as const).map((subTab) => (
          <button
            key={subTab}
            onClick={() => {
              playHapticSound('tick');
              setActiveSubTab(subTab);
            }}
            className={`py-2 rounded-xl text-center cursor-pointer transition uppercase tracking-wider ${
              activeSubTab === subTab 
                ? 'bg-zinc-900 text-white border border-white/10 shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {subTab === 'geral' ? 'Geral' : subTab === 'gargalos' ? 'FALHAS / GARGALOS' : 'Gráficos'}
          </button>
        ))}
      </div>

      {/* Main Dynamic Scrollable Dashboard Layer */}
      <div id="analytics-grid-viewport" className="flex-1 overflow-y-auto space-y-4 pr-1 pb-20 scrollbar-none">
        
        {/* SUBTAB 1: GERAL SUMMARY */}
        {activeSubTab === 'geral' && (
          <>
            <div className="flex gap-2">
              {/* GAMIFICATION - COMPACT MILITARY RANK */}
              <div className={`flex-1 relative rounded-xl p-3 shadow-md overflow-hidden border flex items-center justify-between ${
                streak >= 30 ? 'bg-gradient-to-r from-amber-600/20 to-amber-900/40 border-amber-500/30' :
                streak >= 15 ? 'bg-gradient-to-r from-indigo-600/20 to-indigo-900/40 border-indigo-500/30' :
                streak >= 7 ? 'bg-gradient-to-r from-emerald-600/20 to-emerald-900/40 border-emerald-500/30' :
                'bg-zinc-950/40 border-white/5'
              }`}>
                <div className="absolute -right-2 -top-2 opacity-10 pointer-events-none">
                  <ShieldAlert className="w-16 h-16" />
                </div>
                <div className="relative z-10 flex flex-col">
                  <span className="text-[7.5px] tracking-widest font-bold text-zinc-400">PATENTE ATUAL</span>
                  <div className="text-sm font-black heading-tight tracking-tighter mt-0.5">
                    {streak >= 30 ? <span className="text-amber-400">COMANDANTE</span> :
                     streak >= 15 ? <span className="text-indigo-400">ELITE TÁTICA</span> :
                     streak >= 7 ? <span className="text-emerald-400">FORÇA ESPECIAL</span> :
                     streak >= 3 ? <span className="text-white">AGENTE</span> :
                     <span className="text-zinc-500">RECRUTA</span>}
                  </div>
                </div>
                <div className="relative z-10 flex flex-col items-end">
                  <span className="text-[7.5px] text-zinc-500">STREAK</span>
                  <div className="flex items-center gap-1 font-mono font-bold text-[11px] text-zinc-200">
                    <Flame className="w-3 h-3 text-amber-500" />
                    {streak}D
                  </div>
                </div>
              </div>

              {/* COMPACT DOWNLOAD BUTTON */}
              <a
                href="/api/report"
                download="relatorio_pulse.csv"
                onClick={() => playHapticSound('complete')}
                className="shrink-0 flex flex-col items-center justify-center p-3 w-[65px] rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 active:scale-95 transition-all text-emerald-500 gap-1 shadow-sm"
                title="Download CSV"
              >
                <Download className="w-4 h-4" />
                <span className="text-[7px] font-bold tracking-widest">.CSV</span>
              </a>
            </div>

            {/* VOLUMES CARDS */}
            <div className="bg-zinc-950/40 border border-white/5 rounded-2.5xl p-4">
              <div className="flex justify-between items-center text-[9px] text-zinc-500 tracking-widest border-b border-white/5 pb-2.5 mb-3">
                <span>EFICIÊNCIA ATUAL DE OPERAÇÃO</span>
                <BarChart2 className="w-3.5 h-3.5 text-zinc-600" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/35 border border-white/5 rounded-2xl p-3 flex flex-col items-center text-center relative overflow-hidden">
                  <span className="block text-[8px] text-zinc-500 tracking-wider">HOJE</span>
                  <div className="relative w-20 h-20 flex items-center justify-center my-2">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="40" cy="40" r="32" fill="transparent" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="4.5" />
                      <circle 
                        cx="40" 
                        cy="40" 
                        r="32" 
                        fill="transparent" 
                        stroke="#10b981" 
                        strokeWidth="4.5" 
                        strokeDasharray={`${2 * Math.PI * 32}`}
                        strokeDashoffset={`${2 * Math.PI * 32 * (1 - scoreToday / 100)}`}
                        className="transition-all duration-1000 ease-out"
                        style={{ strokeLinecap: 'round' }}
                      />
                    </svg>
                    <span className="text-[15px] font-sans font-black text-white">{scoreToday}%</span>
                  </div>
                  <span className="text-[7.5px] text-zinc-600">Aproveitamento</span>
                </div>

                <div className="bg-black/35 border border-white/5 rounded-2xl p-3 flex flex-col items-center text-center relative overflow-hidden">
                  <span className="block text-[8px] text-zinc-500 tracking-wider">MÉDIA DA SEMANA</span>
                  <div className="relative w-20 h-20 flex items-center justify-center my-2">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="40" cy="40" r="32" fill="transparent" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="4.5" />
                      <circle 
                        cx="40" 
                        cy="40" 
                        r="32" 
                        fill="transparent" 
                        stroke="#10a6ff" 
                        strokeWidth="4.5" 
                        strokeDasharray={`${2 * Math.PI * 32}`}
                        strokeDashoffset={`${2 * Math.PI * 32 * (1 - scoreWeek / 100)}`}
                        className="transition-all duration-1000 ease-out"
                        style={{ strokeLinecap: 'round' }}
                      />
                    </svg>
                    <span className="text-[15px] font-sans font-black text-white">{scoreWeek}%</span>
                  </div>
                  <span className="text-[7.5px] text-zinc-600">Ritmo Geral</span>
                </div>
              </div>
            </div>

            {/* GRID HEAT MAP */}
            <div className="bg-zinc-950/40 border border-white/5 rounded-2.5xl p-4">
              <div className="flex justify-between items-center text-[9px] text-zinc-500 tracking-widest border-b border-white/5 pb-2.5 mb-3">
                <span>GRADE DE CONSISTÊNCIA AUTOMÁTICA (16 DIAS)</span>
                <div className="flex items-center gap-1 bg-amber-500/10 py-0.5 px-2 rounded-full border border-amber-500/10">
                  <Flame className="w-3 h-3 text-amber-500 animate-pulse" />
                  <span className="text-[8.5px] font-bold text-amber-500">{streak} DIAS</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 justify-center py-2 max-w-[340px] mx-auto">
                {trendList.length === 0 ? (
                  <div className="text-zinc-600 text-[9px]">Sincronizando estatísticas...</div>
                ) : (
                  trendList.map((day: any, idx: number) => (
                    <div
                      key={idx}
                      className={`w-7.5 h-7.5 rounded-lg border font-mono text-[8.5px] font-black flex flex-col items-center justify-center transition-all duration-300 shadow-inner ${getCellColor(day.score)}`}
                      title={`Date: ${day.date} | Score: ${day.score}%`}
                    >
                      <span className="text-[7px] text-zinc-500 scale-90 block leading-none select-none">
                        {day.date.split('-')[2]}
                      </span>
                      <span className="block text-[8px] leading-tight font-sans">
                        {day.score > 0 ? `${day.score}%` : "0"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* MOTOR DE CORRELAÇÃO DE HÁBITOS */}
            <div className="bg-[#030303] border border-white/5 rounded-2.5xl p-4">
              <div className="flex justify-between items-center text-[10px] text-zinc-300 tracking-widest border-b border-white/5 pb-2.5 mb-3">
                <span>MOTOR DE CORRELAÇÃO E COEFICIENTES</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="space-y-3 font-mono text-[11px] text-zinc-300 text-left">
                <p className="text-[10px] text-zinc-400 uppercase leading-relaxed">
                  Cruzamento estatístico de dados históricos para identificar gatilhos comportamentais de alto rendimento.
                </p>

                {correlations.map((corr: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-white font-bold uppercase text-[11px] leading-tight flex-1">{corr.title}</span>
                      <span className={`font-bold px-2 py-0.5 rounded text-[9px] shrink-0 ${corr.color === 'emerald' ? 'text-emerald-400 bg-emerald-500/10' : corr.color === 'rose' ? 'text-rose-400 bg-rose-500/10' : 'text-blue-400 bg-blue-500/10'}`}>
                        {corr.tag}
                      </span>
                    </div>
                    <p className="text-[10.5px] text-zinc-300 leading-normal">
                      {corr.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* METRICS ACCUMULATED */}
            <div className="bg-zinc-950/40 border border-white/5 rounded-2.5xl p-4">
              <div className="flex justify-between items-center text-[10px] text-zinc-300 tracking-widest border-b border-white/5 pb-2.5 mb-3">
                <span>INDICADORES GERAIS (Total Acumulado)</span>
                <Award className="w-4 h-4 text-zinc-400" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-left uppercase">
                {volumes.map((vol: any, idx: number) => {
                  const preset = colorPresets[vol.color as keyof typeof colorPresets] || colorPresets.blue;
                  const IconComp = iconMap[vol.icon] || Award;
                  return (
                    <div key={idx} className="bg-black border border-white/10 rounded-xl p-3 flex items-center gap-3">
                      <span className="p-2 rounded-xl border" style={{ backgroundColor: `${preset.hex}15`, borderColor: `${preset.hex}25`, color: preset.hex }}>
                        <IconComp className="w-5 h-5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="block text-[9px] text-zinc-400 truncate w-full pr-1">{vol.name}</span>
                        <span className="block text-base font-sans font-black text-white leading-none mt-1 truncate">{vol.total}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* SUBTAB 2: GARGALOS (ONDE ESTOU MAIS FALHANDO) */}
        {activeSubTab === 'gargalos' && (
          <div className="space-y-4">
            
            {/* DYNAMIC ANALYSIS REPORT HEADER */}
            <div className="bg-zinc-950/40 border border-amber-500/10 rounded-2.5xl p-4">
              <span className="text-[8px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded tracking-wide">AVALIAÇÃO DE RISCO OPERACIONAL</span>
              <h2 className="text-sm font-bold mt-2 text-white">Análise Dinâmica de Gaps</h2>
              <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                Aqui estão os hábitos com menor pontuação e as vulnerabilidades do seu sistema. Foque em corrigir os gargalos críticos hoje para restaurar a integridade da sua cadência.
              </p>
            </div>

            {/* BOTTLENECK SECTION: ONDE ESTOU FALHANDO MAIS */}
            <div className="bg-zinc-950/60 border border-white/5 rounded-2.5xl p-4">
              <div className="flex items-center gap-2 text-red-400 font-bold text-xs border-b border-white/5 pb-2.5 mb-3.5">
                <AlertTriangle className="w-4 h-4" />
                <span>MEUS PONTOS CRÍTICOS (LOWEST SCORE)</span>
              </div>

              {bottlenecks.length === 0 ? (
                <div className="text-center text-zinc-600 text-[10px] py-4">NENHUM HÁBITO ARQUIVADO NO SISTEMA.</div>
              ) : (
                <div className="space-y-3.5">
                  {bottlenecks.slice(0, 4).map((h, index) => {
                    const preset = colorPresets[h.color as keyof typeof colorPresets] || colorPresets.blue;
                    const IconComp = iconMap[h.icon] || Zap;
                    
                    return (
                      <div 
                        key={h.id} 
                        className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 flex flex-col justify-between cursor-pointer hover:border-white/10 transition"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 truncate">
                            <span className="p-1 rounded bg-zinc-950 text-zinc-400">
                              <IconComp className="w-3.5 h-3.5" style={{ color: preset.hex }} />
                            </span>
                            <span className="text-[11px] font-sans font-bold text-zinc-100 truncate">{h.name}</span>
                          </div>
                          
                          <span className={`text-[9.5px] font-bold py-0.5 px-2 rounded-full ${
                            h.completionRate < 45 ? 'bg-rose-950/40 text-rose-400' : 'bg-amber-950/40 text-amber-500'
                          }`}>
                            {h.completionRate}% EFICIÊNCIA
                          </span>
                        </div>

                        {/* Visual completion progress bar */}
                        <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden mt-1 relative">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              h.completionRate < 45 ? 'bg-rose-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${h.completionRate}%` }}
                          />
                        </div>
                        
                        <div className="text-[8.5px] text-zinc-500 mt-2 flex justify-between pr-1">
                          <span>EXECUTADO EM {h.completedTally} DE {h.totalTally} CICLOS</span>
                          <span className="font-sans lowercase first-letter:uppercase text-zinc-400">FALHOU EM {h.totalTally - h.completedTally} OCASIÕES</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* STRENGTHS SECTION: ONDE ESTOU MELHOR (HIGH SCORE) */}
            <div className="bg-zinc-950/60 border border-white/5 rounded-2.5xl p-4">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs border-b border-white/5 pb-2.5 mb-3.5">
                <Smile className="w-4 h-4" />
                <span>PONTOS FORTES (INTEGRIDADE TOTAL)</span>
              </div>

              {strengths.length === 0 ? (
                <div className="text-center text-zinc-600 text-[10px] py-4">NENHUMA CONSISTÊNCIA ARQUIVADA.</div>
              ) : (
                <div className="space-y-3.5">
                  {strengths.slice(0, 4).map((h, index) => {
                    const preset = colorPresets[h.color as keyof typeof colorPresets] || colorPresets.blue;
                    const IconComp = iconMap[h.icon] || Zap;
                    
                    return (
                      <div 
                        key={h.id} 
                        className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 truncate">
                            <span className="p-1 rounded bg-zinc-950 text-emerald-400">
                              <IconComp className="w-3.5 h-3.5" style={{ color: preset.hex }} />
                            </span>
                            <span className="text-[11px] font-sans font-bold text-zinc-200 truncate">{h.name}</span>
                          </div>
                          
                          <span className="text-[9.5px] font-bold text-emerald-400 py-0.5 px-2 bg-emerald-950/20 rounded-full">
                            {h.completionRate}% EFICIÊNCIA
                          </span>
                        </div>

                        {/* Visual completion progress bar */}
                        <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden mt-1 relative">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${h.completionRate}%` }}
                          />
                        </div>
                        
                        <div className="text-[8.5px] text-zinc-500 mt-2 flex justify-between pr-1">
                          <span>COMPLETADO EM {h.completedTally} DE {h.totalTally} DIAS</span>
                          <span className="text-emerald-500 font-sans uppercase text-[7.5px]">CONSISTÊNCIAS</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* SUBTAB 3: GRÁFICOS VISUAIS */}
        {activeSubTab === 'graficos' && (
          <div className="space-y-4">
            
            {/* GRAPH 1: WEEKLY TREND GRAPH */}
            <div className="bg-zinc-950/40 border border-white/5 rounded-2.5xl p-4">
              <div className="flex justify-between items-center text-[9px] text-zinc-500 tracking-widest border-b border-white/5 pb-2.5 mb-3.5">
                <span>CURVA DE EXECUÇÃO HISTÓRICA (Aproveitamento)</span>
                <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              </div>

              {trendList.length < 2 ? (
                <div className="text-center text-zinc-600 text-[10px] py-8">AGUARDANDO MASSA DE DADOS SUFICIENTE...</div>
              ) : (
                <div className="relative">
                  {/* High Tech SVG Line graph */}
                  <svg viewBox="0 0 460 150" className="w-full h-auto overflow-visible select-none">
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#10a6ff" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1="20" y1="15" x2="440" y2="15" stroke="rgba(255,255,255,0.03)" strokeDasharray="3" />
                    <line x1="20" y1="52.5" x2="440" y2="52.5" stroke="rgba(255,255,255,0.03)" strokeDasharray="3" />
                    <line x1="20" y1="90" x2="440" y2="90" stroke="rgba(255,255,255,0.03)" strokeDasharray="3" />
                    <line x1="20" y1="127.5" x2="440" y2="127.5" stroke="rgba(255,255,255,0.03)" strokeDasharray="3" />

                    {/* Area fill */}
                    <path
                      d={`M20,135 L${getSvgCoordinates()} L440,135 Z`}
                      fill="url(#areaGradient)"
                      className="transition-all duration-1000 ease-out"
                    />

                    {/* Line path */}
                    <path
                      d={`M${getSvgCoordinates()}`}
                      fill="none"
                      stroke="url(#lineGradient)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />

                    {/* Interactive nodes and labels */}
                    {trendList.map((day: any, i: number) => {
                      const width = 460;
                      const height = 120;
                      const paddingLeft = 20;
                      const paddingTop = 15;
                      const x = paddingLeft + (i / (trendList.length - 1)) * (width - 40);
                      const y = paddingTop + height - (day.score / 100) * height;

                      return (
                        <g key={i} className="group cursor-pointer">
                          <circle
                            cx={x}
                            cy={y}
                            r="3.5"
                            fill="#000000"
                            stroke={day.score >= 80 ? "#10b981" : day.score >= 40 ? "#f59e0b" : "#f43f5e"}
                            strokeWidth="2"
                          />
                          {/* Floating Score above bubble */}
                          <text
                            x={x}
                            y={y - 8}
                            fill="#ffffff"
                            fontSize="8"
                            fontFamily="monospace"
                            fontWeight="bold"
                            textAnchor="middle"
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-black pointer-events-none"
                          >
                            {day.score}%
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                  
                  {/* Bottom Legends */}
                  <div className="flex justify-between text-[8px] text-zinc-500 mt-2 px-1 border-t border-white/5 pt-1.5 font-mono">
                    <span>{trendList[0]?.date} (HÁ 15 DIAS)</span>
                    <span>MEIO DO PERÍODO</span>
                    <span>HOJE</span>
                  </div>
                </div>
              )}
            </div>

            {/* GRAPH 2: HOURLY DENSITY BARCHART */}
            <div className="bg-zinc-950/40 border border-white/5 rounded-2.5xl p-4">
              <div className="flex justify-between items-center text-[9px] text-zinc-500 tracking-widest border-b border-white/5 pb-2.5 mb-3.5">
                <span>DENSIDADE OPERACIONAL HORÁRIA (CONCLUSÕES)</span>
                <Clock className="w-4 h-4 text-[#10a6ff]" />
              </div>

              {hoursData.length === 0 ? (
                <div className="text-center text-zinc-600 text-[10px] py-8">Sincronizando fuso de carregamento...</div>
              ) : (
                <div className="space-y-3 pt-2">
                  {hoursData.map((hr: any, index: number) => {
                    const maxWeight = Math.max(...hoursData.map((h: any) => h.count));
                    const widthPercent = maxWeight > 0 ? (hr.count / maxWeight) * 100 : 0;
                    
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <span className="w-10 text-[9.5px] text-zinc-400 font-mono text-left">{hr.hour}</span>
                        
                        <div className="flex-1 bg-zinc-950 h-5 border border-white/5 rounded relative overflow-hidden flex items-center pr-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded transition-all duration-700"
                            style={{ width: `${widthPercent}%` }}
                          />
                          <span className="absolute right-2 text-[9px] text-white font-bold select-none">{hr.count} METAS</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <div className="text-[8.5px] text-zinc-500 text-left mt-4 border-t border-white/5 pt-2 leading-relaxed">
                As faixas horárias representam as conclusões acumuladas das tarefas agendadas em sua linha do tempo operacional.
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
