"use client";

import * as React from "react"
import { useState, useEffect } from "react"

// Simple calendar component that doesn't rely on external dependencies
// This is a stripped-down version with basic functionality

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  month?: Date;  // Add month prop to control displayed month
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  [key: string]: any;
}

function Calendar({
  selected,
  onSelect,
  month,  // Accept month prop
  disabled = false,
  minDate,
  maxDate,
  className = "",
  ...props
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    const date = month || selected || new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [localSelected, setLocalSelected] = useState<Date | undefined>(selected);

  // Update localSelected when selected prop changes
  useEffect(() => {
    setLocalSelected(selected);
  }, [selected]);

  // Update currentDate when month prop changes
  useEffect(() => {
    if (month) {
      setCurrentDate(new Date(month.getFullYear(), month.getMonth(), 1));
    }
  }, [month]);

  // Get calendar month info
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const renderCalendar = () => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-start-${year}-${month}-${i}`} className="w-7 h-7 m-0.5"></div>
      );
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
          key={`day-${year}-${month}-${day}`}
          type="button"
          onClick={() => {
            if (!isDisabled) {
              const newSelected = isSelected ? undefined : date;
              setLocalSelected(newSelected);
              if (onSelect) onSelect(newSelected);
            }
          }}
          disabled={isDisabled}
          className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-xs m-0.5 transition-colors
            ${isSelected ? 'bg-blue-600 text-white' : ''} 
            ${isToday && !isSelected ? 'bg-gray-200' : ''}
            ${!isDisabled ? 'hover:bg-gray-100' : 'opacity-40 cursor-not-allowed'}`}
        >
          {day}
        </button>
      );
    }
    
    // Calculate total cells (should always be 42 for 6 weeks)
    const totalCells = 42; // 6 rows * 7 days
    const filledCells = firstDayOfMonth + daysInMonth;
    const remainingCells = totalCells - filledCells;
    
    // Add empty cells at the end to maintain consistent height
    for (let i = 0; i < remainingCells; i++) {
      days.push(
        <div key={`empty-end-${year}-${month}-${i}`} className="w-7 h-7 m-0.5"></div>
      );
    }
    
    return days;
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  return (
    <div className={`p-2 ${className}`} {...props}>
      <div className="flex justify-between items-center mb-2">
        <button
          type="button"
          onClick={() => navigateMonth(-1)}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Previous month"
        >
          &lt;
        </button>
        <div className="font-medium text-sm text-center min-w-[140px]">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </div>
        <button
          type="button"
          onClick={() => navigateMonth(1)}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Next month"
        >
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={`weekday-${day}`} className="w-7 h-7 inline-flex items-center justify-center text-xs text-gray-500 m-0.5">
            {day.charAt(0)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 min-h-[240px]" key={`grid-${currentDate.getFullYear()}-${currentDate.getMonth()}`}>
        {renderCalendar()}
      </div>
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar, type CalendarProps };