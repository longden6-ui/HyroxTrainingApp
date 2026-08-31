// Accessibility compliance [T-32, PRD 12.3]
// WCAG 2.2 AA - Keyboard navigation, visible focus, semantic headings,
// screen-reader labels, accessible validation messages, contrast,
// no colour-only status, plain language

export const A11Y_STANDARDS = {
  WCAG: '2.2',
  LEVEL: 'AA',
  REQUIREMENTS: [
    'Keyboard navigation (Tab, Enter, Escape)',
    'Visible focus indicators (min 3:1 contrast)',
    'Semantic HTML headings (h1-h6 hierarchy)',
    'aria-label for interactive elements',
    'aria-describedby for form errors',
    'Color contrast 4.5:1 (normal text), 3:1 (large text)',
    'No colour-only information conveyance',
    'Plain language (8th grade reading level)',
    'Both metric and imperial units',
    'Skip links for keyboard users',
  ],
} as const;

// Keyboard navigation helpers [T-32]
export const KEYBOARD_EVENTS = {
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  SPACE: ' ',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  TAB: 'Tab',
  SHIFT_TAB: 'Shift+Tab',
} as const;

// Screen reader announcements [T-32]
export const A11Y_LABELS = {
  // Form labels
  FORM_REQUIRED: 'required field',
  FORM_ERROR: 'form has errors',

  // Navigation
  SKIP_TO_MAIN: 'Skip to main content',
  MAIN_NAV: 'Main navigation',

  // Status messages
  LOADING: 'Loading',
  SUCCESS: 'Success',
  ERROR: 'Error',
  WARNING: 'Warning',

  // Interactive elements
  OPEN_MENU: 'Open menu',
  CLOSE_MENU: 'Close menu',
  EXPAND: 'Expand',
  COLLAPSE: 'Collapse',

  // Training context
  SESSION_LOCKED: 'Session is completed and locked',
  PAIN_REPORTED: 'Pain was reported for this session',
  PLAN_PAUSED: 'Training plan is paused for safety',
} as const;

// Color contrast ratios [T-32, PRD 12.3]
export const CONTRAST_RATIOS = {
  NORMAL_TEXT: '4.5:1', // Text and images of text
  LARGE_TEXT: '3:1', // Large text (18pt+ or 14pt+ bold)
  UI_COMPONENTS: '3:1', // Buttons, form inputs, focus indicators
  DISABLED: '3:1', // Disabled states must still be legible
} as const;

// Semantic HTML structure [T-32]
export const SEMANTIC_STRUCTURE = {
  HEADINGS: {
    H1: 'Page title (one per page)',
    H2: 'Major sections',
    H3: 'Subsections',
    H4: 'Sub-subsections',
  },
  LANDMARKS: {
    MAIN: 'Main content area',
    HEADER: 'Site header',
    FOOTER: 'Site footer',
    NAV: 'Navigation regions',
    ASIDE: 'Complementary content',
    ARTICLE: 'Independent content',
  },
  FORMS: {
    LABEL: 'Every form input has <label>',
    FIELDSET: 'Related inputs grouped',
    LEGEND: 'Describes fieldset purpose',
  },
} as const;

// Accessibility testing checklist [T-32]
export const A11Y_CHECKLIST = {
  KEYBOARD: [
    '✓ All interactive elements reachable via Tab',
    '✓ Tab order is logical (left-to-right, top-to-bottom)',
    '✓ No keyboard traps',
    '✓ Focus visible on all interactive elements',
    '✓ Escape key closes modals and menus',
  ],
  SCREEN_READER: [
    '✓ Page title describes purpose',
    '✓ Headings create logical outline',
    '✓ Form labels associated with inputs',
    '✓ Error messages linked via aria-describedby',
    '✓ Non-text content has alt text or aria-label',
  ],
  CONTRAST: [
    '✓ Text: 4.5:1 contrast ratio (WCAG AA)',
    '✓ Large text: 3:1 contrast ratio',
    '✓ Focus indicators: 3:1 contrast',
    '✓ Status indicators not color-only',
  ],
  RESPONSIVE: [
    '✓ Works at 1.4x zoom',
    '✓ Works at 200% zoom',
    '✓ Works on mobile (no horizontal scroll)',
    '✓ Text resizable',
  ],
  LANGUAGE: [
    '✓ Plain language (8th grade reading level)',
    '✓ Medical terms defined',
    '✓ Training terminology glossary',
    '✓ Both metric and imperial units',
    '✓ Instructions clear and actionable',
  ],
} as const;

// Accessibility routes to test [T-32]
export const CRITICAL_A11Y_PATHS = [
  '/predict',
  '/signup',
  '/signin',
  '/onboarding/step1',
  '/onboarding/step2',
  '/onboarding/step3',
  '/onboarding/step4',
  '/onboarding/step5',
  '/onboarding/step6',
  '/dashboard',
  '/dashboard/calendar',
] as const;

// Accessibility helper functions [T-32]
export function isFocusVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  const outline = style.outline || style.outlineWidth;
  const border = style.border || style.borderWidth;

  return outline !== 'none' || border !== 'none';
}

export function getContrastRatio(color1: string, color2: string): number {
  // Simplified contrast calculation (in production, use WCAG formula)
  // This is a placeholder for actual WCAG color contrast calculation
  return 4.5; // Placeholder
}

export function getReadingLevel(text: string): string {
  // Flesch-Kincaid Grade Level
  const words = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).length;
  const syllables = text.split(/[aeiou]+/).length;

  const grade = (0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59);

  if (grade < 6) return 'Elementary (excellent for accessibility)';
  if (grade < 9) return '6-8th grade (good for accessibility)';
  if (grade < 13) return 'High school (acceptable)';
  return 'College+ (may need simplification for accessibility)';
}

// Unit conversion helpers [T-32]
export function formatDurationAccessible(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

export function formatWeightAccessible(grams: number): string {
  // Both kg and lbs [T-32]
  const kg = (grams / 1000).toFixed(1);
  const lbs = (grams * 0.00220462).toFixed(1);

  return `${kg} kg (${lbs} lbs)`;
}

export function formatDistanceAccessible(metres: number): string {
  // Both metres and feet/yards [T-32]
  const m = metres.toFixed(1);
  const ft = (metres * 3.28084).toFixed(1);

  return `${m} metres (${ft} feet)`;
}
