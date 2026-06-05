import React, { useState } from "react";
import { 
  Settings, 
  Trash2, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Shield, 
  Cpu,
  Info,
  LogOut,
  UploadCloud
} from "lucide-react";
import { getAccessToken } from "../firebase";

interface AjustesTabProps {
  onResetDatabase: () => void;
  onResetDay: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onLogout?: () => void;
  playHapticSound: (type: 'tick' | 'complete' | 'reset' | 'warguerra') => void;
}

export default function AjustesTab({
  onResetDatabase,
  onResetDay,
  soundEnabled,
  onToggleSound,
  onLogout,
  playHapticSound
}: AjustesTabProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportToDrive = async () => {
    const token = await getAccessToken();
    if (!token) {
      alert("Sessão Google não encontrada ou expirada. Relogue.");
      return;
    }

    setIsExporting(true);
    playHapticSound('tick');

    try {
      const data = {
        pulse_sales_funnels: localStorage.getItem("pulse_sales_funnels"),
        pulse_visions: localStorage.getItem("pulse_visions"),
        pulse_identity_traits: localStorage.getItem("pulse_identity_traits"),
        pulse_goals: localStorage.getItem("pulse_goals"),
        pulse_braindumps: localStorage.getItem("pulse_braindumps")
      };

      const fileContent = JSON.stringify(data, null, 2);
      const file = new Blob([fileContent], { type: 'application/json' });
      
      const metadata = {
        name: `PULSE_Backup_${new Date().toISOString().split('T')[0]}.json`,
        mimeType: 'application/json'
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: form
      });

      if (res.ok) {
        playHapticSound('complete');
        alert("Backup enviado com sucesso para seu Google Drive!");
      } else {
        throw new Error("Falha ao subir para o drive.");
      }
    } catch(err) {
      console.error(err);
      alert("Erro ao enviar backup.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDayReset = () => {
    if (confirm("Deseja redefinir a execução diária para zero? Esta ação arquiva o progresso recente no banco de dados e limpa os marcadores de progresso diário.")) {
      playHapticSound('reset');
      onResetDay();
    }
  };

  const handleFullReset = () => {
    if (confirm("ATENÇÃO: Deseja redefinir TODAS as tabelas SQL e recarregar os 10 hábitos originais de fábrica? Isso limpará seus dados locais.")) {
      playHapticSound('warguerra');
      onResetDatabase();
    }
  };

  return (
    <div id="settings-tab-frame" className="flex flex-col h-full overflow-hidden justify-between select-none p-1 text-white uppercase">
      {/* Top Header */}
      <div className="shrink-0 py-3 text-left px-1 border-b border-white/5 mb-3">
        <div className="text-[9px] text-zinc-500 tracking-widest leading-none mb-1">CONVERSOR DE AJUSTES E CADÊNCIA</div>
        <h1 className="text-2xl font-sans font-black tracking-tight text-white leading-none">Ajustes</h1>
      </div>

      {/* Main settings options Scroll zone */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-1 pt-1 text-left font-sans">
        
        {/* Toggle Sound Section */}
        <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-4 flex justify-between items-center transition hover:border-white/10">
          <div className="flex items-center gap-3.5">
            <span className="p-2.5 rounded-xl bg-zinc-900 text-zinc-300 border border-white/10">
              {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-400 animate-pulse" /> : <VolumeX className="w-5 h-5 text-zinc-500" />}
            </span>
            <div>
              <h2 className="text-xs font-bold text-white tracking-wide">Sintetor Háptico de Aço</h2>
              <p className="text-[9px] text-zinc-500 tracking-tight mt-0.5 uppercase font-mono">Feedback sonoro imediato de execução</p>
            </div>
          </div>

          <button
            id="toggle-sound-btn"
            onClick={() => {
              onToggleSound();
              if (!soundEnabled) {
                setTimeout(() => playHapticSound('tick'), 100);
              }
            }}
            className={`cursor-pointer py-1.5 px-3 rounded-xl border text-[9.5px] font-black transition uppercase ${
              soundEnabled 
                ? "bg-zinc-900 border-white/15 text-emerald-400" 
                : "bg-zinc-900 text-zinc-500 border-transparent hover:text-white"
            }`}
          >
            {soundEnabled ? "ATIVADO" : "MUTADO"}
          </button>
        </div>

        {/* Push Notifications Section */}
        <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-4 flex justify-between items-center transition hover:border-white/10 mt-2">
          <div className="flex items-center gap-3.5">
            <span className="p-2.5 rounded-xl bg-zinc-900 text-zinc-300 border border-white/10">
              <Shield className="w-5 h-5 text-[#10a6ff]" />
            </span>
            <div>
              <h2 className="text-xs font-bold text-white tracking-wide">Notificações Táticas</h2>
              <p className="text-[9px] text-zinc-500 tracking-tight mt-0.5 uppercase font-mono">PWA Push Notifications</p>
            </div>
          </div>

          <button
            id="req-push-btn"
            onClick={async () => {
              playHapticSound('tick');
              if ('Notification' in window) {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                  const data = {
                    title: 'Pulse Estabelecido',
                    body: 'Notificações táticas de cadência ativadas.',
                    icon: '/pulse_logo.png'
                  };
                  if (navigator.serviceWorker && navigator.serviceWorker.ready) {
                     navigator.serviceWorker.ready.then(reg => {
                       reg.showNotification(data.title, data);
                     });
                  } else {
                     new Notification(data.title, data);
                  }
                } else {
                  alert('Permissão negada para notificações.');
                }
              } else {
                alert('O seu dispositivo ou navegador não suporta notificações de sistema.');
              }
            }}
            className="cursor-pointer py-1.5 px-3 rounded-xl border text-[9.5px] font-black transition uppercase bg-zinc-900 text-[#10a6ff] border-white/15 hover:bg-zinc-800"
          >
            ATIVAR
          </button>
        </div>

        {/* Database Operations Section */}
        <div className="bg-zinc-950/40 border border-white/20/10 border-white/5 rounded-2.5xl p-4 space-y-3.5">
          <div className="flex justify-between items-center text-[10px] text-zinc-500 tracking-widest border-b border-white/5 pb-2.5">
            <span>ARMAZENAMENTO E CONTA</span>
            <Cpu className="w-4 h-4 text-zinc-500" />
          </div>

          <div className="grid grid-cols-1 gap-3 text-[10.5px]">
            {/* Logout Google */}
            {onLogout && (
              <button
                id="settings-logout"
                onClick={() => {
                  playHapticSound('reset');
                  onLogout();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-zinc-900 hover:bg-zinc-800 text-left transition text-white"
              >
                <div>
                  <div className="font-bold flex items-center gap-2 mb-0.5"><LogOut className="w-3.5 h-3.5 text-zinc-400" /> ENCERRAR SESSÃO NA NUVEM</div>
                  <div className="text-[9.5px] text-zinc-500 max-w-[200px] leading-relaxed">Fazer logoff do Google na sessão de treinamento.</div>
                </div>
                <div className="text-[9.5px] font-black bg-white text-black px-2 py-1 rounded">SAIR</div>
              </button>
            )}

            {/* Exportar ao Google Drive */}
            <button
              id="settings-export-drive"
              onClick={handleExportToDrive}
              disabled={isExporting}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-left transition text-white"
            >
              <div>
                <div className="font-bold flex items-center gap-2 mb-0.5">
                  <UploadCloud className="w-3.5 h-3.5 text-emerald-400" /> EXPORTAR PARA GD
                </div>
                <div className="text-[9.5px] text-zinc-500 max-w-[200px] leading-relaxed">Fazer backup dos seus registros e cadência local.</div>
              </div>
              <div className="text-[9.5px] font-black bg-emerald-500 text-black px-2 py-1 rounded">
                {isExporting ? "ENVIANDO" : "DRIVE"}
              </div>
            </button>

            {/* Reset current day */}
            <button
              id="settings-reset-day"
              onClick={handleDayReset}
              className="py-3 px-4 bg-zinc-900 hover:bg-zinc-850 hover:border-white/10 border border-white/5 rounded-xl cursor-pointer hover:text-white transition flex items-center gap-3"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="block font-bold">Redefinir Ciclo Diário</span>
                <span className="block text-[8px] text-zinc-500 font-normal tracking-wide mt-0.5">Arquiva os volumes atuados no SQLite</span>
              </div>
            </button>

            {/* Clear database */}
            <button
              id="settings-reset-database"
              onClick={handleFullReset}
              className="py-3 px-4 bg-zinc-900 hover:bg-rose-950/20 border border-white/5 hover:border-rose-900/40 rounded-xl cursor-pointer hover:text-rose-400 transition flex items-center gap-3"
            >
              <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
              <div>
                <span className="block font-bold text-rose-400">Restaurar de Fábrica</span>
                <span className="block text-[8px] text-zinc-500 font-normal tracking-wide mt-0.5">Recarrega tabelas e os 10 hábitos originais</span>
              </div>
            </button>
          </div>
        </div>

        {/* Stoic Principles / Operational Code of Ethics */}
        <div className="bg-zinc-950/40 border border-[#1b1b22] rounded-2.5xl p-4 space-y-3 relative overflow-hidden">
          {/* Subtle gradient glow decoration */}
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex justify-between items-center text-[10px] text-zinc-500 tracking-widest border-b border-white/5 pb-2.5">
            <span>CADÊNCIA E FILOSOFIA</span>
            <Shield className="w-4 h-4 text-amber-500" />
          </div>

          <div className="text-[10px] text-zinc-400 tracking-wide space-y-2.5 leading-relaxed">
            <div className="flex gap-2.5 items-start bg-black/40 border border-white/5 p-3 rounded-xl">
              <Info className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="block font-bold text-zinc-300">RITMO INEGOCIÁVEL</span>
                <span className="block text-[8.5px] text-zinc-500 font-sans leading-relaxed mt-0.5">
                  O Pulse é projetado para operadores de alta tração que não admitem autocomplacência. Seus dados mostram exatamente sua eficiência semanal.
                </span>
              </div>
            </div>

            <div className="flex gap-2.5 items-start bg-black/40 border border-white/5 p-3 rounded-xl">
              <Info className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="block font-bold text-zinc-300">EXCELÊNCIA EM VOLUME</span>
                <span className="block text-[8.5px] text-zinc-500 font-sans leading-relaxed mt-0.5">
                  Resultados reais e prospecção inabalável dependem de consistência e compromisso continuados, alimentando seu banco de dados diário.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[8.5px] text-zinc-600 font-mono tracking-widest py-3">
          SISTEMA OPERACIONAL ESTÁVEL // PERSISTÊNCIA ATIVA
        </div>
      </div>
    </div>
  );
}
