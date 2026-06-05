import React, { useEffect, useState } from "react";
import { motion } from "motion/react";

interface SplashProps {
  phrase: string;
  onComplete: () => void;
}

export default function Splash({ phrase, onComplete }: SplashProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    // Elegant system clock
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    // Automatically fade out after 2.8 seconds to start execution cockpit
    const timer = setTimeout(onComplete, 2800);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      id="splash-container"
      className="fixed inset-0 bg-black z-50 flex flex-col justify-between p-12 select-none"
    >
      {/* Top Header */}
      <div className="flex justify-between items-center text-xs tracking-widest text-[#555] font-mono">
        <span>SISTEMA OPERACIONAL PULSE</span>
        <span>STATUS: DIRETO E IMPLACÁVEL</span>
      </div>

      {/* Center typography section */}
      <div className="flex flex-col gap-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-[#666] font-mono text-xs tracking-widest uppercase mb-2"
        >
          // COMANDO DIÁRIO
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-[#f3f4f6]"
        >
          {phrase || "Você ainda não venceu o dia."}
        </motion.h1>
      </div>

      {/* Bottom info containing huge system clock and quick initialization status */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-t border-[#111] pt-8">
        <div>
          <div className="text-xs text-[#444] font-mono tracking-wider mb-1 uppercase">Cronômetro de Vida Ativa</div>
          <motion.div 
            className="text-[4rem] font-display font-black tracking-tighter text-[#3b82f6] glow-blue leading-none"
          >
            {time}
          </motion.div>
        </div>
        <div className="text-right flex flex-col gap-1 text-[11px] font-mono text-[#555]">
          <div className="flex items-center gap-2 justify-end">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>NÚCLEO DO OPERADOR INICIADO</span>
          </div>
          <div>CADÊNCIA OPERACIONAL ESTÁVEL</div>
          <div>SISTEMA PRONTO PARA ABSORÇÃO DE MOVIMENTO</div>
        </div>
      </div>
    </motion.div>
  );
}
