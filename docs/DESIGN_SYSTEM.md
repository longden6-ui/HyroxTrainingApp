# HYROX Coach AI - Design System

## Overview

All pages in the HYROX Coach AI application follow the design standard established by the **My Profile** page. This document defines the visual language, components, and patterns used throughout the application.

---

## Page Layout Standard

### Structure

Every page follows this hierarchy:

```
┌─────────────────────────────────────────────────────────┐
│                      HEADER SECTION                     │
│  Title              Subtitle                [Action BTN]│
│                                                          │
├─────────────────────────────────────────────────────────┤
│                   CONTENT SECTIONS                      │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Section Title                                     │ │
│  │                                                   │ │
│  │ Label          Value                              │ │
│  │ Label          Value                              │ │
│  └───────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Implementation

Use the `PageLayout` component for all pages:

```tsx
import { PageLayout } from '@/src/components/layout/PageLayout';
import { Card } from '@/src/components/layout/Card';

export default function MyPage() {
  return (
    <PageLayout
      title="Page Title"
      subtitle="Page description text"
      actionButton={{
        label: "Edit",
        onClick: () => { /* handle click */ },
        variant: "primary"
      }}
    >
      <Card title="Section Title">
        {/* Content */}
      </Card>
    </PageLayout>
  );
}
```

---

## Components

### PageLayout

**Purpose:** Container for all page content  
**Required Props:**
- `title: string` - Page heading
- `children: React.ReactNode` - Page content

**Optional Props:**
- `subtitle?: string` - Page description
- `actionButton?: ActionButton` - Single action button in header
- `actionButtons?: ActionButton[]` - Multiple action buttons
- `showBackButton?: boolean` - Show back navigation
- `backHref?: string` - Back button destination

**Example:**
```tsx
<PageLayout
  title="Training Dashboard"
  subtitle="Your personalized preparation status"
  actionButton={{
    label: "View Plan",
    href: "/dashboard/training-plan",
    variant: "primary"
  }}
>
  {/* content */}
</PageLayout>
```

---

### Card

**Purpose:** Container for related information sections  
**Optional Props:**
- `title?: string` - Section heading
- `subtitle?: string` - Section description
- `variant?: 'default' | 'info' | 'warning' | 'error'` - Card style

**Variants:**

| Variant   | Use Case                           | Border Color |
|-----------|--------------------------------------|--------------|
| `default` | Primary content sections            | Purple       |
| `info`    | Informational messages              | Blue         |
| `warning` | Warning messages (action needed)    | Amber        |
| `error`   | Error messages                      | Red          |

**Example:**
```tsx
<Card title="Basic Information" variant="default">
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem' }}>
    <div>
      <label>FULL NAME</label>
      <p>David Longden</p>
    </div>
    <div>
      <label>EMAIL</label>
      <p>longden6@gmail.com</p>
    </div>
  </div>
</Card>
```

---

## Color Palette

### Primary Colors
| Name         | Hex       | Usage                              |
|--------------|-----------|-----------------------------------|
| Purple       | #667eea   | Primary actions, card borders      |
| Dark Purple  | #764ba2   | Gradient end, hover states         |
| White        | #ffffff   | Card backgrounds, text backgrounds |

### Neutral Colors
| Name         | Hex       | Usage                              |
|--------------|-----------|-----------------------------------|
| Dark Gray    | #111827   | Headings, primary text             |
| Gray         | #6b7280   | Body text, labels                  |
| Light Gray   | #e5e7eb   | Borders, dividers                  |
| Lighter Gray | #f3f4f6   | Backgrounds, subtle fills          |

### State Colors
| Name    | Hex       | Usage        |
|---------|-----------|--------------|
| Blue    | #3b82f6   | Info/primary |
| Amber   | #f59e0b   | Warning      |
| Red     | #ef4444   | Error        |
| Green   | #10b981   | Success      |

---

## Typography

### Font Sizes

| Usage              | Size     | Weight | Letter Spacing |
|--------------------|----------|--------|-----------------|
| Page Title         | 2rem     | 700    | normal          |
| Section Title      | 1.25rem  | 600    | normal          |
| Label              | 0.75rem  | 600    | 0.5px           |
| Body Text          | 1rem     | 400    | normal          |
| Helper Text        | 0.875rem | 400    | normal          |
| Small Text         | 0.75rem  | 400    | normal          |

### Text Hierarchy

```
Page Title (Bold, Large)
├─ Subtitle (Regular, Medium)
└─ Content
   ├─ Section Title (Semi-Bold, Medium)
   ├─ Label (Bold, Small, Uppercase, Gray)
   └─ Value (Regular, Medium, Dark)
```

---

## Card Structure & Spacing

### Card Anatomy

```
┌─ 4px solid #667eea (left border)
│
│  Padding: 1.5rem
│
│  ┌────────────────────────┐
│  │ Section Title          │  Font-size: 1.25rem, weight: 600
│  └────────────────────────┘
│  
│  ┌────────────────────────┐
│  │ LABEL        VALUE     │  Label: 0.75rem, Bold, Uppercase, Gray
│  │ LABEL        VALUE     │  Value: 1rem, Regular, Dark
│  └────────────────────────┘
│
└─ Border-radius: 0.75rem
   Box-shadow: 0 1px 3px rgba(0,0,0,0.1)
   Background: white
```

### Spacing Reference

| Size | Value  | Use Cases                                |
|------|--------|------------------------------------------|
| xs   | 0.25rem| Micro spacing between elements           |
| sm   | 0.5rem | Small gaps, button padding               |
| md   | 1rem   | Standard padding, element spacing        |
| lg   | 1.5rem | Section padding, card spacing            |
| xl   | 2rem   | Large gaps, section margins              |

---

## Responsive Design

### Breakpoints

| Breakpoint | Width  | Devices                  |
|-----------|--------|--------------------------|
| Mobile    | < 768px| Phones                   |
| Tablet    | 768px  | Tablets, small laptops   |
| Desktop   | > 768px| Laptops, desktops        |

### Grid Layouts

**For displaying structured data:**
```css
display: grid;
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
gap: 1.5rem;
```

**For 2-column on desktop, 1-column on mobile:**
```css
display: grid;
grid-template-columns: 1fr 1fr;
gap: 1.5rem;

@media (max-width: 768px) {
  grid-template-columns: 1fr;
}
```

---

## Button Styles

### Action Button (Header)

**Primary Style:**
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
color: white;
padding: 0.75rem 1.5rem;
border-radius: 0.5rem;
font-weight: 600;
transition: opacity 0.2s, transform 0.2s;

&:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
```

**Secondary Style:**
```css
background: #f3f4f6;
color: #111827;
border: 1px solid #d1d5db;
padding: 0.75rem 1.5rem;
border-radius: 0.5rem;
font-weight: 600;

&:hover {
  background: #e5e7eb;
}
```

### Form Input Styles

```css
padding: 0.75rem;
border: 1px solid #d1d5db;
border-radius: 0.5rem;
font-size: 1rem;
font-family: inherit;
transition: all 0.2s;
background-color: white;
color: #111827;

&:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}
```

---

## Implementation Checklist

When creating new pages, ensure:

- [ ] Page uses `PageLayout` component
- [ ] Page has a clear title and subtitle
- [ ] Related information is grouped in `Card` components
- [ ] Card titles clearly describe section content
- [ ] Labels are uppercase, gray, and bold
- [ ] Values use dark gray/black text
- [ ] Spacing follows 1.5rem margins between cards
- [ ] Action buttons use gradient purple for primary actions
- [ ] Mobile responsive design is tested (< 768px)
- [ ] No inline styles—use CSS modules or component classes
- [ ] Color palette is consistent with design system
- [ ] Typography hierarchy is maintained

---

## File Structure

```
src/components/layout/
├── PageLayout.tsx          # Main page container
├── Card.tsx               # Content card component
└── layout.module.css      # Centralized styles

docs/
└── DESIGN_SYSTEM.md       # This file
```

---

## Maintenance & Updates

**Making Design Changes:**
1. Update CSS in `src/components/layout/layout.module.css`
2. Changes apply globally to all pages
3. Update this document if adding new patterns
4. Test across mobile, tablet, and desktop

**Adding New Variants:**
1. Add variant to `Card` component props
2. Add corresponding styles in `layout.module.css`
3. Document the variant in this file
4. Update checklist if needed

---

## Examples

### Basic Page with Card
```tsx
<PageLayout
  title="My Profile"
  subtitle="Your personal training profile and onboarding details"
  actionButton={{
    label: "✎ Edit Profile",
    onClick: () => setIsEditing(true),
    variant: "primary"
  }}
>
  <Card title="Basic Information">
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
      <div>
        <label style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
          Full Name
        </label>
        <p style={{ color: '#111827', margin: '0.5rem 0 0 0' }}>David Longden</p>
      </div>
    </div>
  </Card>
</PageLayout>
```

### Page with Multiple Sections
```tsx
<PageLayout title="Training Dashboard">
  <Card title="This Week" variant="default">
    {/* Stats */}
  </Card>
  
  <Card title="Recent Changes" variant="info">
    {/* Changes list */}
  </Card>
</PageLayout>
```

---

## Questions?

For design questions or clarifications, refer to the My Profile page as the golden standard.
