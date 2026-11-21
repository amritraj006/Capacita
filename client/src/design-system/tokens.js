/**
 * Capacita Enterprise Design System Tokens
 */
export const tokens = {
  colors: {
    // Brand & Primary
    primary: {
      DEFAULT: '#1E3A8A', // Deep Enterprise Navy
      hover: '#172554',
      light: '#EFF6FF',
      text: '#1D4ED8',
    },
    // Surfaces
    surface: {
      background: '#F8FAFC', // Slate 50
      card: '#FFFFFF',
      subtle: '#F1F5F9',     // Slate 100
      muted: '#E2E8F0',      // Slate 200
    },
    // Borders
    border: {
      subtle: '#E2E8F0',     // Slate 200
      default: '#CBD5E1',    // Slate 300
      focus: '#2563EB',      // Blue 600
    },
    // Text
    text: {
      primary: '#0F172A',    // Slate 900
      secondary: '#475569',  // Slate 600
      muted: '#94A3B8',      // Slate 400
      inverse: '#FFFFFF',
    },
    // Semantics
    semantic: {
      success: { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', dot: '#10B981' },
      warning: { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
      danger:  { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA', dot: '#EF4444' },
      info:    { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE', dot: '#3B82F6' },
      neutral: { bg: '#F1F5F9', text: '#334155', border: '#CBD5E1', dot: '#64748B' },
    },
  },
  radius: {
    sm: '0.375rem', // 6px
    md: '0.5rem',   // 8px - default for inputs, buttons, badges
    lg: '0.75rem',  // 12px - default for cards, dialogs, panels
    xl: '1rem',     // 16px
    full: '9999px',
  },
}
