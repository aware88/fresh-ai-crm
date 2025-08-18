export interface OrganizationBranding {
  id: string;
  organization_id: string;
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  font_family?: string | null;
  custom_css?: string | null;
  custom_domain?: string | null;
  favicon_url?: string | null;
  email_header_image_url?: string | null;
  email_footer_text?: string | null;
  login_background_url?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface BrandingFormData {
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  font_family?: string | null;
  custom_css?: string | null;
  custom_domain?: string | null;
  favicon_url?: string | null;
  email_header_image_url?: string | null;
  email_footer_text?: string | null;
  login_background_url?: string | null;
}

export interface BrandingTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl?: string;
  faviconUrl?: string;
  organizationId?: string;
}

export const defaultBranding: BrandingTheme = {
  primaryColor: '#0f172a', // slate-900
  secondaryColor: '#64748b', // slate-500
  accentColor: '#2563eb', // blue-600
  fontFamily: 'Inter, system-ui, sans-serif',
  organizationId: undefined,
};

export const defaultBrandingFormData: BrandingFormData = {
  primary_color: '#0f172a',
  secondary_color: '#64748b',
  accent_color: '#2563eb',
  font_family: 'Inter, system-ui, sans-serif',
  custom_css: null,
  custom_domain: null,
  logo_url: null,
  favicon_url: null,
  email_header_image_url: null,
  email_footer_text: null,
  login_background_url: null,
};
