/**
 * Shared Emotion design tokens (research.md "Shared design tokens" section)
 * — the single source of styling truth across student/teacher/parent/admin
 * screens, replacing the role Tailwind's config would have played.
 */
export interface Theme {
  color: {
    background: string;
    surface: string;
    text: string;
    primary: string;
    primaryDark: string;
    accent: string;
    success: string;
    error: string;
    border: string;
  };
  space: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    pill: string;
  };
  font: {
    family: string;
    size: {
      body: string;
      childBody: string;
      heading: string;
      childHeading: string;
    };
  };
  tapTarget: {
    min: string;
    childMin: string;
  };
}

export const theme: Theme = {
  color: {
    background: '#FFFDF7',
    surface: '#FFFFFF',
    text: '#2B2B2B',
    primary: '#2E7D32', // Garden green
    primaryDark: '#1B5E20',
    accent: '#FF9800', // Playful orange for kid-facing CTAs
    success: '#43A047',
    error: '#D84315',
    border: '#E0DCCB',
  },
  space: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  radius: {
    sm: '8px',
    md: '16px',
    lg: '24px',
    pill: '999px',
  },
  font: {
    // Elementary Child Focus (Principle II): large, readable, icon-paired text.
    family: "'Baloo 2', 'Comic Sans MS', system-ui, sans-serif",
    size: {
      body: '18px',
      childBody: '24px', // Student-facing screens use a larger base size
      heading: '32px',
      childHeading: '40px',
    },
  },
  // Touch targets: 44x44px minimum per constitution Principle II / FR-014.
  tapTarget: {
    min: '44px',
    childMin: '88px', // Student-facing controls are generously oversized
  },
};

/**
 * Distinct "back office" theme for /admin/* (task: admin should feel like a
 * traditional config/management tool, not the playful kid-facing app).
 * Same token shape as `theme` so existing styled(...) usages work unchanged
 * when this is swapped in via ThemeProvider.
 */
export const adminTheme: Theme = {
  ...theme,
  color: {
    background: '#F4F5F7',
    surface: '#FFFFFF',
    text: '#1A1F27',
    primary: '#2C3E91', // Slate blue — distinct from the garden green
    primaryDark: '#1F2C6B',
    accent: '#5B6472',
    success: '#2E7D32',
    error: '#C0392B',
    border: '#D3D7DE',
  },
  font: {
    ...theme.font,
    family: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
};
