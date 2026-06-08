import React, { useState, useEffect } from 'react';

export default function TimerHabit({ 
  habit, 
  onComplete, 
  isFocusMode, 
  playHapticSound 
}: { 
  habit: any, 
  onComplete: (val: number, isComplete: boolean) => void, 
  isFocusMode: boolean, 
  playHapticSound: any 
}) {
  const [isActive, setIsActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isActive) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else if (!isActive && elapsedSeconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, elapsedSeconds]);

  const handleStart = (e: any) => {
    e.stopPropagation();
    playHapticSound("tick");
    setIsActive(true);
  };

  const handleStop = (e: any) => {
    e.stopPropagation();
    playHapticSound("complete");
    setIsActive(false);
    
    // Calculate minutes and update
    const minutesToAdd = Number((elapsedSeconds / 60).toFixed(2));
    const newVal = habit.currentValue + minutesToAdd;
    onComplete(newVal, newVal >= habit.targetValue);
    setElapsedSeconds(0);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className={`col-span-3 flex gap-2 w-full ${isFocusMode ? "pt-1" : ""}`}>
      {isActive ? (
        <>
          <div className="flex-1 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center font-mono text-xl text-yellow-400 font-bold" onClick={(e) => e.stopPropagation()}>
            {formatTime(elapsedSeconds)}
          </div>
          <button 
            onClick={handleStop}
            className={`bg-rose-500/20 text-rose-500 font-sans font-bold hover:bg-rose-500/30 border border-rose-500/30 rounded-xl transition cursor-pointer px-4 ${isFocusMode ? "py-2.5 text-sm" : "text-xs py-1.5"}`}
          >
            FINALIZAR
          </button>
        </>
      ) : (
        <button 
          onClick={handleStart}
          className={`flex-1 bg-white text-black font-sans font-bold hover:bg-zinc-200 border border-transparent rounded-xl transition cursor-pointer ${isFocusMode ? "py-2.5 text-sm" : "text-[10px] py-1.5"}`}
        >
          COMEÇAR
        </button>
      )}
    </div>
  );
}
