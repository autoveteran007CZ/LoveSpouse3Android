import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppMode, BpmState } from './types';
import { 
  PATTERN_NAMES, 
  DEFAULT_BPM_ON_MS, 
  DEFAULT_BPM_OFF_MS, 
  DEFAULT_BPM_PATTERN 
} from './constants';
import { broadcastCommand } from './services/bleService';
import LogSlider from './components/LogSlider';

export default function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.MANUAL);
  
  // Manual State
  const [manualIndex, setManualIndex] = useState<number | null>(null);
  
  // BPM State
  const [bpmState, setBpmState] = useState<BpmState>({
    patternIndex: DEFAULT_BPM_PATTERN,
    onMs: DEFAULT_BPM_ON_MS,
    offMs: DEFAULT_BPM_OFF_MS,
  });
  const [isBpmRunning, setIsBpmRunning] = useState(false);
  const [bpmPulseState, setBpmPulseState] = useState(false); // true = ON, false = OFF

  // Refs for timing loop
  const lastSwitchRef = useRef<number>(0);
  const lastRepeatRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  // --- LOGIC ENGINE ---

  const handleTick = useCallback(() => {
    const now = Date.now();

    if (mode === AppMode.BPM && isBpmRunning) {
      const period = bpmPulseState ? bpmState.onMs : bpmState.offMs;
      
      // Check for state switch
      if (now - lastSwitchRef.current >= period) {
        const nextPulseState = !bpmPulseState;
        setBpmPulseState(nextPulseState);
        lastSwitchRef.current = now;
        lastRepeatRef.current = now;

        if (nextPulseState) {
           // ON: Send bursts based on duration (from Arduino logic: max(1, min(10, onMs/20)))
           const bursts = Math.max(1, Math.min(10, Math.floor(bpmState.onMs / 20)));
           broadcastCommand(bpmState.patternIndex, bursts);
        } else {
           // OFF: Always 10 bursts of Stop (Index 0)
           broadcastCommand(0, 10);
        }
      }
    } else if (mode === AppMode.MANUAL && manualIndex !== null) {
      // Manual Repeat Safety (every 1000ms)
      if (now - lastRepeatRef.current >= 1000) {
        broadcastCommand(manualIndex, 1);
        lastRepeatRef.current = now;
      }
    }

    animationFrameRef.current = requestAnimationFrame(handleTick);
  }, [mode, isBpmRunning, bpmPulseState, bpmState, manualIndex]);

  // Start/Stop Loop
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(handleTick);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [handleTick]);

  // --- HANDLERS ---

  const handleManualSelect = (index: number) => {
    setMode(AppMode.MANUAL);
    setManualIndex(index);
    setIsBpmRunning(false);
    // Initial burst 10x
    broadcastCommand(index, 10);
    lastRepeatRef.current = Date.now();
  };

  const handleStop = () => {
    setManualIndex(null);
    setIsBpmRunning(false);
    setBpmPulseState(false);
    // Send stop command
    broadcastCommand(0, 20); // Extra bursts to ensure stop
  };

  const toggleBpm = () => {
    if (isBpmRunning) {
      handleStop();
    } else {
      setMode(AppMode.BPM);
      setIsBpmRunning(true);
      setBpmPulseState(false); // Will switch to true immediately in loop
      lastSwitchRef.current = 0; // Force immediate switch
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 pb-32 font-sans selection:bg-fuchsia-500 selection:text-white">
      {/* Header */}
      <header className="p-4 bg-slate-800 border-b border-slate-700 sticky top-0 z-10 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
              LoveSpouse
            </h1>
            <p className="text-xs text-slate-400">BLE Controller (Alpha)</p>
          </div>
          <div className={`px-2 py-1 rounded text-xs font-bold ${isBpmRunning || manualIndex !== null ? 'bg-green-900 text-green-400' : 'bg-slate-700 text-slate-500'}`}>
            {isBpmRunning ? 'BPM RUNNING' : (manualIndex !== null ? 'MANUAL ON' : 'IDLE')}
          </div>
        </div>
      </header>

      <main className="p-4 max-w-md mx-auto">
        
        {/* Mode Tabs */}
        <div className="flex p-1 bg-slate-800 rounded-xl mb-6">
          <button 
            onClick={() => { setMode(AppMode.MANUAL); setIsBpmRunning(false); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === AppMode.MANUAL ? 'bg-slate-600 text-white shadow' : 'text-slate-400'}`}
          >
            Manual
          </button>
          <button 
            onClick={() => { setMode(AppMode.BPM); setManualIndex(null); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === AppMode.BPM ? 'bg-fuchsia-600 text-white shadow' : 'text-slate-400'}`}
          >
            BPM
          </button>
        </div>

        {mode === AppMode.MANUAL ? (
          <div className="grid grid-cols-2 gap-3">
            {PATTERN_NAMES.map((name, idx) => (
              <button
                key={idx}
                onClick={() => handleManualSelect(idx)}
                className={`p-4 rounded-xl border transition-all active:scale-95 ${
                  manualIndex === idx 
                    ? 'bg-fuchsia-600 border-fuchsia-400 text-white shadow-[0_0_15px_rgba(232,121,249,0.3)]' 
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <div className="text-lg font-bold mb-1">{idx}</div>
                <div className="text-xs opacity-70">{name}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
            <h2 className="text-lg font-bold text-fuchsia-400 mb-4">BPM Configuration</h2>
            
            {/* Pattern Selector */}
            <div className="mb-6">
              <label className="block text-gray-300 text-sm font-medium mb-2">Pulse Pattern</label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((pid) => (
                  <button
                    key={pid}
                    onClick={() => setBpmState(s => ({ ...s, patternIndex: pid }))}
                    className={`aspect-square rounded-lg font-bold flex items-center justify-center border ${
                      bpmState.patternIndex === pid
                        ? 'bg-fuchsia-600 border-fuchsia-400 text-white'
                        : 'bg-slate-700 border-slate-600 text-gray-400'
                    }`}
                  >
                    {pid}
                  </button>
                ))}
              </div>
            </div>

            <LogSlider 
              label="ON Duration" 
              min={10} 
              max={60000} 
              value={bpmState.onMs} 
              onChange={(val) => setBpmState(s => ({ ...s, onMs: val }))} 
            />
            
            <LogSlider 
              label="OFF Duration" 
              min={10} 
              max={60000} 
              value={bpmState.offMs} 
              onChange={(val) => setBpmState(s => ({ ...s, offMs: val }))} 
            />

            <div className="mt-8 pt-4 border-t border-slate-700 flex items-center justify-between">
               <div className="text-xs text-slate-500">
                 Status: <span className={bpmPulseState ? "text-fuchsia-400 font-bold" : "text-slate-400"}>{bpmPulseState ? "PULSING" : "WAITING"}</span>
               </div>
               <button
                onClick={toggleBpm}
                className={`px-6 py-3 rounded-full font-bold shadow-lg transition-transform active:scale-95 ${
                  isBpmRunning 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
               >
                 {isBpmRunning ? 'STOP BPM' : 'START BPM'}
               </button>
            </div>
          </div>
        )}
      </main>

      {/* Global Stop Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur border-t border-slate-800">
        <button
          onClick={handleStop}
          className="w-full bg-slate-800 border border-red-900/50 text-red-400 py-4 rounded-2xl font-bold text-xl uppercase tracking-widest active:bg-red-900/20 active:scale-[0.98] transition-all"
        >
          EMERGENCY STOP
        </button>
      </div>
    </div>
  );
}