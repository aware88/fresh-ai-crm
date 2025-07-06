'use client';

import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

export function ColorPicker({ color, onChange, disabled = false }: ColorPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Common colors for quick selection
  const presetColors = [
    '#0f172a', // slate-900
    '#1e293b', // slate-800
    '#334155', // slate-700
    '#475569', // slate-600
    '#64748b', // slate-500
    '#2563eb', // blue-600
    '#3b82f6', // blue-500
    '#60a5fa', // blue-400
    '#0891b2', // cyan-600
    '#06b6d4', // cyan-500
    '#22c55e', // green-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#f97316', // orange-500
    '#ef4444', // red-500
    '#ec4899', // pink-500
    '#8b5cf6', // violet-500
    '#a855f7', // purple-500
  ];
  
  return (
    <Popover open={isOpen && !disabled} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-10 h-10 rounded-md border border-gray-300 flex items-center justify-center"
          style={{ backgroundColor: color }}
          disabled={disabled}
        >
          <span className="sr-only">Pick a color</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="grid grid-cols-6 gap-2">
          {presetColors.map((presetColor) => (
            <button
              key={presetColor}
              type="button"
              className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center"
              style={{ backgroundColor: presetColor }}
              onClick={() => {
                onChange(presetColor);
                setIsOpen(false);
              }}
            >
              {color === presetColor && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4 text-white"
                >
                  <path
                    fillRule="evenodd"
                    d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
        
        <div className="mt-4">
          <label htmlFor="custom-color" className="block text-sm font-medium text-gray-700 mb-1">
            Custom Color
          </label>
          <input
            type="color"
            id="custom-color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-8"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
