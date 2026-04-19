export type Theme = {
  name: 'light' | 'dark';
  colors: {
    background: string;
    backgroundAlt: string;
    card: string;
    text: string;
    muted: string;
    primary: string;
    accent: string;
    danger: string;
    border: string;
    heroGradient: [string, string, string];
  };
};

export const lightTheme: Theme = {
  name: 'light',
  colors: {
    background: '#f3f4f6',
    backgroundAlt: '#111827',
    card: '#ffffff',
    text: '#111827',
    muted: '#6b7280',
    primary: '#4f46e5',
    accent: '#22c55e',
    danger: '#ef4444',
    border: '#e5e7eb',
    heroGradient: ['#4f46e5', '#2563eb', '#22c55e'], 
  },
};

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    background: '#020617',
    backgroundAlt: '#020617',
    card: '#0f172a',
    text: '#e5e7eb',
    muted: '#9ca3af',
    primary: '#6366f1',
    accent: '#22c55e',
    danger: '#f97316',
    border: '#1f2937',
    heroGradient: ['#020617', '#1e293b', '#22c55e'], 
  },
};