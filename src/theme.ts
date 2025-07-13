// This file is kept for backward compatibility
// The actual theming is now handled by Tailwind CSS and next-themes

// Re-export the theme constants from the lib/theme directory
import { themeConfig } from '@/lib/theme/theme-config';

export { themeConfig };

// Export an empty system object for backward compatibility
export const system = {};
