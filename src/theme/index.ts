// Theme configuration for the Fresh AI CRM application
// This file is kept for backward compatibility
// The actual theming is now handled by Tailwind CSS and next-themes

// Re-export the theme constants from the lib/theme directory
import { themeConfig } from '../lib/theme/theme-config';

// Export the theme config as default for backward compatibility
const theme = themeConfig;

export default theme;
