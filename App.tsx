import React, { useState, useRef } from 'react';
import { DiceOutcome, GameState } from './types';
import RiskDice from './components/RiskDice';
import { Sparkles, History, Trophy, RotateCcw } from 'lucide-react';

// Configuration
const SIDES = 20;

export default function App() {
  const [state, setState] = useState<GameState>({
    streak: 0,
    totalRolls: 0,
    outcome: DiceOutcome.IDLE,
    maxStreak: 0,
  });

  const [isRolling, setIsRolling] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Audio Context on first interaction
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const playSound = (type: 'roll' | 'win' | 'lose') => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    if (type === 'roll') {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.1);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'win') {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
      
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(500, now);
      osc2.frequency.exponentialRampToValueAtTime(1000, now + 0.3);
      osc2.connect(gainNode);

      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.5);
      osc2.stop(now + 0.5);
    } else if (type === 'lose') {
      // Explosion Sound
      const bufferSize = ctx.sampleRate * 2.5; 
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i/bufferSize, 2);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.exponentialRampToValueAtTime(10, now + 2.0);

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 2.0);

      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      noise.start(now);
    }
  };

  const rollDice = () => {
    if (isRolling) return;
    initAudio();
    setShowExplosion(false);
    
    setIsRolling(true);
    setState(prev => ({ ...prev, outcome: DiceOutcome.ROLLING }));

    let clickCount = 0;
    const clickInterval = setInterval(() => {
      playSound('roll');
      clickCount++;
      if (clickCount > 8) clearInterval(clickInterval);
    }, 100);

    setTimeout(() => {
      clearInterval(clickInterval);
      
      const roll = Math.floor(Math.random() * SIDES) + 1; // 1 to 20
      const isBad = roll === 1; // 1 is Bad

      setIsRolling(false);
      
      if (isBad) {
        playSound('lose');
        setShowExplosion(true);
        setState(prev => ({
          streak: 0,
          totalRolls: prev.totalRolls + 1,
          outcome: DiceOutcome.GREAT_MISFORTUNE,
          maxStreak: prev.maxStreak 
        }));
        setTimeout(() => setShowExplosion(false), 2000);
      } else {
        playSound('win');
        setState(prev => {
          const newStreak = prev.streak + 1;
          return {
            streak: newStreak,
            totalRolls: prev.totalRolls + 1,
            outcome: DiceOutcome.GREAT_FORTUNE,
            maxStreak: Math.max(prev.maxStreak, newStreak)
          };
        });
      }
    }, 1200); 
  };

  const resetGame = () => {
    setState({
      streak: 0,
      totalRolls: 0,
      outcome: DiceOutcome.IDLE,
      maxStreak: 0,
    });
    setShowExplosion(false);
  };

  return (
    <div className={`min-h-screen bg-slate-950 flex flex-col items-center py-8 px-4 overflow-hidden relative ${showExplosion ? 'animate-shock' : ''}`}>
      
      {/* Intense Explosion Overlay */}
      {showExplosion && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden">
            {/* Red Flash */}
            <div className="absolute inset-0 bg-red-600 animate-explode opacity-0 mix-blend-hard-light"></div>
            {/* White Core Flash */}
            <div className="absolute inset-0 bg-white animate-flash opacity-0"></div>
            {/* Radial Shockwave */}
            <div className="absolute top-1/2 left-1/2 w-[200vw] h-[200vw] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-red-500/50 to-transparent rounded-full animate-shockwave opacity-0"></div>
            
            <h1 className="relative z-50 text-[150px] md:text-[250px] font-black text-red-600 animate-text-slam drop-shadow-[0_0_50px_rgba(255,0,0,1)] uppercase tracking-tighter leading-none" style={{textShadow: "10px 10px 0px #000"}}>
              大凶
            </h1>
        </div>
      )}

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="z-10 text-center mb-8 relative">
        <div className="inline-block relative">
            <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-slate-100 to-slate-400 mb-2 tracking-tighter drop-shadow-sm">
            風險骰子
            </h1>
        </div>
        <p className="text-slate-400 font-serif italic text-sm md:text-base max-w-md mx-auto">
          "The D20 of Fate. 1 Calamity, 19 Fortunes."
        </p>
      </header>

      {/* Main Game Area */}
      <main className="z-10 flex flex-col items-center justify-center flex-grow w-full max-w-2xl">
        
        {/* Stats HUD */}
        <div className="w-full grid grid-cols-3 gap-2 bg-slate-900/60 backdrop-blur-md border border-slate-800 p-4 rounded-2xl mb-12 shadow-2xl">
           <div className="flex flex-col items-center justify-center">
             <div className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
               <History size={12} /> Rolls
             </div>
             <div className="text-xl md:text-2xl font-bold text-slate-300 font-mono">{state.totalRolls}</div>
           </div>

           <div className="flex flex-col items-center justify-center border-x border-slate-800/50 relative">
             <div className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
               <Sparkles size={12} className="text-yellow-500" /> Streak
             </div>
             <div className={`text-3xl md:text-5xl font-black font-mono transition-all duration-300 ${state.outcome === DiceOutcome.GREAT_MISFORTUNE ? 'text-red-600' : 'text-yellow-400 glow-gold'}`}>
               {state.streak}
             </div>
             {state.outcome === DiceOutcome.GREAT_FORTUNE && !isRolling && (
                <div className="absolute -top-2 right-2">
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                    </span>
                </div>
             )}
           </div>

           <div className="flex flex-col items-center justify-center">
             <div className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
               <Trophy size={12} /> Max
             </div>
             <div className="text-xl md:text-2xl font-bold text-slate-300 font-mono">{state.maxStreak}</div>
           </div>
        </div>

        {/* The Dice */}
        <div className="mb-12 relative w-full flex justify-center h-[240px] items-center">
          <RiskDice outcome={state.outcome} isRolling={isRolling} />
        </div>

        {/* Dynamic Status Message */}
        <div className="h-24 flex flex-col items-center justify-center mb-8 text-center px-4 w-full">
          {isRolling && (
            <p className="text-xl text-indigo-300 animate-pulse font-serif tracking-widest">FATE IS SPINNING...</p>
          )}
          {!isRolling && state.outcome === DiceOutcome.IDLE && (
            <p className="text-slate-500 text-lg font-light">Dare to test your luck?</p>
          )}
          {!isRolling && state.outcome === DiceOutcome.GREAT_FORTUNE && (
            <div className="animate-bounce-short">
              <p className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-t from-yellow-300 to-yellow-100 glow-text mb-2">大吉</p>
              <p className="text-emerald-400 text-xs md:text-sm uppercase tracking-widest">Fortune Smiles Upon You</p>
            </div>
          )}
          {!isRolling && state.outcome === DiceOutcome.GREAT_MISFORTUNE && (
            <div className="animate-shake">
              <p className="text-4xl md:text-5xl font-black text-red-600 glow-red mb-2">大凶</p>
              <p className="text-red-400 text-xs md:text-sm uppercase tracking-widest">Calamity Strikes</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <button
          onClick={rollDice}
          disabled={isRolling}
          className={`
            relative group w-full max-w-[280px] py-4 rounded-full 
            font-bold text-lg tracking-[0.2em] uppercase transition-all duration-300
            border border-white/10
            ${isRolling 
              ? 'bg-slate-900 text-slate-600 cursor-not-allowed transform scale-95' 
              : 'bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-700 bg-[length:200%_auto] animate-gradient text-white shadow-[0_0_30px_rgba(79,70,229,0.4)] hover:shadow-[0_0_50px_rgba(79,70,229,0.6)] hover:scale-105 active:scale-95'
            }
          `}
        >
          {isRolling ? 'Rolling...' : 'Roll Fate'}
        </button>
        
        {state.totalRolls > 0 && !isRolling && (
           <button 
             onClick={resetGame}
             className="mt-8 text-slate-600 hover:text-red-400 text-xs flex items-center gap-2 transition-colors opacity-60 hover:opacity-100"
           >
             <RotateCcw size={12} /> RESET DESTINY
           </button>
        )}
      </main>

      {/* Footer Info */}
      <footer className="mt-auto py-6 text-slate-600 text-[10px] uppercase tracking-widest text-center">
        <div className="flex justify-center gap-4 mb-2">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-600"></span> 95% Fortune</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-900"></span> 5% Ruin</span>
        </div>
      </footer>
      
      <style>{`
        @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .animate-gradient {
            animation: gradient 3s ease infinite;
        }
        @keyframes shockwave {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
        @keyframes flash {
           0%, 100% { opacity: 0; }
           10% { opacity: 1; }
           100% { opacity: 0; }
        }
        .animate-shockwave {
           animation: shockwave 0.8s ease-out forwards;
        }
        .animate-flash {
           animation: flash 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
