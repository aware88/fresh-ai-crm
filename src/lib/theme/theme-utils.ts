'use client';

import { useTheme } from 'next-themes';

export const useThemeValues = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  return {
    // Background colors
    bgColor: isDark ? 'bg-gray-900' : 'bg-white',
    bgMuted: isDark ? 'bg-gray-800' : 'bg-gray-50',
    
    // Card styles
    cardBg: isDark ? 'bg-gray-800' : 'bg-white',
    cardBorder: isDark ? 'border-gray-700' : 'border-gray-200',
    cardHover: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
    
    // Text colors - using darker grays for better visibility
    textPrimary: 'text-black',
    textSecondary: 'text-gray-800',
    textMuted: 'text-gray-600',
    
    // Border colors
    borderColor: isDark ? 'border-gray-700' : 'border-gray-200',
    dividerColor: isDark ? 'bg-gray-700' : 'bg-gray-200',
    
    // Button styles
    buttonHover: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
    buttonBorder: isDark ? 'border-gray-700' : 'border-gray-200',
    
    // Input styles
    inputBg: isDark ? 'bg-gray-800' : 'bg-white',
    inputBorder: isDark ? 'border-gray-700' : 'border-gray-300',
    inputFocus: isDark 
      ? 'focus:ring-blue-500 focus:border-blue-500' 
      : 'focus:ring-blue-500 focus:border-blue-500',
    
    // Utility classes
    ring: isDark ? 'ring-gray-700' : 'ring-gray-200',
    shadow: isDark ? 'shadow-lg' : 'shadow-md',
    
    // Theme state
    isDark
  };
};
