"use client";

import * as React from "react"
import { useState } from "react"

// Simple calendar component that doesn't rely on external dependencies
// This is a stripped-down version with basic functionality

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  [key: string]: any;
}

function Calendar({
  selected,
  onSelect,
  disabled = false,
  minDate,
  maxDate,
  className = "",
  ...props
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selected || new Date());
  const [localSelected, setLocalSelected] = useState<Date | undefined>(selected);

  // Get calendar month info
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const month = currentMonth.getMonth();
  const year = currentMonth.getFullYear();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  // Build calendar days
  const days = [];
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="w-8 h-8 m-1"></div>);
  }

  // Add cells for days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isSelected = localSelected && 
      date.getDate() === localSelected.getDate() && 
      date.getMonth() === localSelected.getMonth() && 
      date.getFullYear() === localSelected.getFullYear();
    
    const isToday = new Date().getDate() === day && 
      new Date().getMonth() === month && 
      new Date().getFullYear() === year;
    
    const isDisabled = disabled || 
      (minDate && date < minDate) || 
      (maxDate && date > maxDate);

    days.push(
      <button
        key={day}
        type="button"
        onClick={() => {
          if (!isDisabled) {
            const newSelected = isSelected ? undefined : date;
            setLocalSelected(newSelected);
            if (onSelect) onSelect(newSelected);
          }
        }}
        disabled={isDisabled}
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm m-1 
          ${isSelected ? 'bg-blue-600 text-white' : ''} 
          ${isToday && !isSelected ? 'bg-gray-200' : ''}
          ${!isDisabled ? 'hover:bg-gray-100' : 'opacity-40 cursor-not-allowed'}`}
      >
        {day}
      </button>
    );
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className={`p-3 ${className}`} {...props}>
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          onClick={() => setCurrentMonth(new Date(year, month - 1))}
          className="p-2 rounded-md hover:bg-gray-100"
          aria-label="Previous month"
        >
          &lt;
        </button>
        <div className="font-medium">
          {monthNames[month]} {year}
        </div>
        <button
          type="button"
          onClick={() => setCurrentMonth(new Date(year, month + 1))}
          className="p-2 rounded-md hover:bg-gray-100"
          aria-label="Next month"
        >
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="w-8 h-8 flex items-center justify-center text-xs text-gray-500">
            {day.charAt(0)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days}
      </div>
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar, type CalendarProps };
