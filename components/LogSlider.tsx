import React, { useMemo } from 'react';

interface LogSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (val: number) => void;
  label: string;
  unit?: string;
}

const LogSlider: React.FC<LogSliderProps> = ({ min, max, value, onChange, label, unit = "ms" }) => {
  // Convert linear slider position (0-100) to logarithmic value
  const minLog = Math.log(min);
  const maxLog = Math.log(max);
  const scale = (maxLog - minLog) / 100;

  // Calculate slider position from current value
  const sliderPos = useMemo(() => {
    return (Math.log(value) - minLog) / scale;
  }, [value, minLog, scale]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pos = parseFloat(e.target.value);
    const newValue = Math.exp(minLog + scale * pos);
    onChange(Math.round(newValue));
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-end mb-2">
        <span className="text-gray-300 font-medium">{label}</span>
        <span className="text-fuchsia-400 font-bold font-mono text-lg">
          {value} <span className="text-xs text-gray-500">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        step="0.1"
        value={sliderPos}
        onChange={handleChange}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-600 mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

export default LogSlider;