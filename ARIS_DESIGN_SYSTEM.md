# ARIS Design System Documentation

## Overview

The ARIS (Advanced Responsive Interface System) Design System is a comprehensive UI framework built for modern CRM applications. It features a distinctive rainbow gradient theme (blue → purple → pink), consistent spacing, typography, and a full suite of interactive components.

## Table of Contents

1. [Design Principles](#design-principles)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Component Library](#component-library)
6. [Animation System](#animation-system)
7. [Performance Features](#performance-features)
8. [Usage Guidelines](#usage-guidelines)

## Design Principles

### 1. **Consistency**
- Unified color palette across all components
- Consistent spacing using a 4px grid system
- Standardized typography hierarchy
- Uniform interaction patterns

### 2. **Accessibility**
- WCAG 2.1 AA compliance
- Screen reader support with proper ARIA labels
- Keyboard navigation support
- Respects `prefers-reduced-motion` settings

### 3. **Performance**
- 60fps animations with GPU acceleration
- Lazy loading and code splitting
- Optimized bundle sizes
- Memory-efficient components

### 4. **Responsiveness**
- Mobile-first design approach
- Adaptive layouts for all screen sizes
- Touch-friendly interactions
- Flexible grid system

## Color System

### Primary Rainbow Gradient
The signature ARIS gradient flows from blue through purple to pink:

```css
/* Primary Gradient */
background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);

/* Individual Colors */
--aris-blue: #3b82f6;
--aris-purple: #8b5cf6;
--aris-pink: #ec4899;
```

### Color Palette

#### Primary Colors
- **Blue**: `#3b82f6` - Primary actions, links
- **Purple**: `#8b5cf6` - Secondary actions, highlights
- **Pink**: `#ec4899` - Accent colors, CTAs

#### Semantic Colors
- **Success**: `#10b981` - Success states, confirmations
- **Warning**: `#f59e0b` - Warnings, cautions
- **Error**: `#ef4444` - Errors, destructive actions
- **Info**: `#3b82f6` - Information, neutral states

#### Neutral Colors
- **Gray 50**: `#f9fafb` - Backgrounds
- **Gray 100**: `#f3f4f6` - Light backgrounds
- **Gray 200**: `#e5e7eb` - Borders
- **Gray 300**: `#d1d5db` - Disabled states
- **Gray 400**: `#9ca3af` - Placeholders
- **Gray 500**: `#6b7280` - Secondary text
- **Gray 600**: `#4b5563` - Primary text
- **Gray 700**: `#374151` - Headings
- **Gray 800**: `#1f2937` - Dark text
- **Gray 900**: `#111827` - Darkest text

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Type Scale
- **Heading 1**: 36px / 2.25rem - Page titles
- **Heading 2**: 30px / 1.875rem - Section headers
- **Heading 3**: 24px / 1.5rem - Subsection headers
- **Heading 4**: 20px / 1.25rem - Card titles
- **Body Large**: 18px / 1.125rem - Important body text
- **Body**: 16px / 1rem - Default body text
- **Body Small**: 14px / 0.875rem - Secondary text
- **Caption**: 12px / 0.75rem - Captions, labels

### Font Weights
- **Light**: 300 - Subtle text
- **Regular**: 400 - Body text
- **Medium**: 500 - Emphasized text
- **Semibold**: 600 - Headings
- **Bold**: 700 - Strong emphasis

## Spacing & Layout

### Spacing Scale (4px base unit)
- **xs**: 4px (0.25rem)
- **sm**: 8px (0.5rem)
- **md**: 16px (1rem)
- **lg**: 24px (1.5rem)
- **xl**: 32px (2rem)
- **2xl**: 48px (3rem)
- **3xl**: 64px (4rem)

### Grid System
- **Container**: Max-width 1200px with responsive padding
- **Columns**: 12-column grid with flexible gutters
- **Breakpoints**:
  - Mobile: 0px+
  - Tablet: 768px+
  - Desktop: 1024px+
  - Large: 1200px+

## Component Library

### 1. Form Components (`aris-form.tsx`)

#### ArisInput
```tsx
<ArisInput
  label="Email Address"
  type="email"
  placeholder="Enter your email"
  required
  icon={Mail}
  validation={{
    required: "Email is required",
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: "Invalid email address"
    }
  }}
/>
```

**Features:**
- Built-in validation with error states
- Icon support (left and right)
- Password toggle for password inputs
- Loading states
- Rainbow gradient focus states

#### ArisTextarea
```tsx
<ArisTextarea
  label="Description"
  placeholder="Enter description"
  maxLength={500}
  showCharCount
  rows={4}
/>
```

**Features:**
- Character counting
- Auto-resize option
- Validation support
- Consistent styling with inputs

#### ArisSelect
```tsx
<ArisSelect
  label="Category"
  placeholder="Select category"
  options={[
    { value: "tech", label: "Technology" },
    { value: "design", label: "Design" }
  ]}
  validation={{ required: "Please select a category" }}
/>
```

**Features:**
- Searchable options
- Multi-select support
- Custom option rendering
- Validation states

#### ArisSubmitButton
```tsx
<ArisSubmitButton
  loading={isSubmitting}
  disabled={!isValid}
>
  Save Changes
</ArisSubmitButton>
```

**Features:**
- Rainbow gradient background
- Loading states with spinner
- Disabled states
- Hover animations

### 2. Animation Components (`aris-animations.tsx`)

#### ArisAnimatedCard
```tsx
<ArisAnimatedCard
  variant="slideUp"
  delay={0.2}
  className="p-6"
>
  <h3>Card Title</h3>
  <p>Card content</p>
</ArisAnimatedCard>
```

**Variants:**
- `fadeIn` - Fade in animation
- `slideUp` - Slide up from bottom
- `slideDown` - Slide down from top
- `slideLeft` - Slide in from left
- `slideRight` - Slide in from right
- `scaleIn` - Scale in animation

#### ArisAnimatedButton
```tsx
<ArisAnimatedButton
  variant="primary"
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Click Me
</ArisAnimatedButton>
```

**Features:**
- Spring physics animations
- Hover and tap effects
- Loading states
- Rainbow gradient variants

#### ArisAnimatedStats
```tsx
<ArisAnimatedStats
  value={1847}
  label="Total Contacts"
  trend="up"
  trendValue={12}
  icon={Users}
  duration={2}
/>
```

**Features:**
- Number counting animations
- Trend indicators
- Icon animations
- Customizable duration

### 3. Loading Components (`aris-loading.tsx`)

#### ArisSpinner
```tsx
<ArisSpinner size="lg" variant="rainbow" />
```

**Variants:**
- `default` - Simple spinner
- `rainbow` - Rainbow gradient spinner
- `dots` - Pulsing dots
- `bars` - Loading bars

#### ArisSkeletonCard
```tsx
<ArisSkeletonCard
  showAvatar
  lines={3}
  className="mb-4"
/>
```

**Features:**
- Configurable skeleton shapes
- Shimmer animations
- Responsive layouts
- Accessibility support

#### ArisProgressBar
```tsx
<ArisProgressBar
  value={75}
  max={100}
  variant="rainbow"
  showLabel
/>
```

**Features:**
- Rainbow gradient progress
- Customizable colors
- Label display options
- Smooth animations

### 4. Table Components (`aris-table.tsx`)

#### ArisTable
```tsx
<ArisTable
  data={users}
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Role', filterable: true }
  ]}
  actions={[
    createViewAction(handleView),
    createEditAction(handleEdit),
    createDeleteAction(handleDelete)
  ]}
  pagination={{ pageSize: 10 }}
  searchable
  exportable
/>
```

**Features:**
- Sorting and filtering
- Pagination
- Search functionality
- Export capabilities
- Row actions
- Responsive design

### 5. Performance Components (`aris-performance.tsx`)

#### ArisLazy
```tsx
<ArisLazy fallback={<ArisSpinner />}>
  <ExpensiveComponent />
</ArisLazy>
```

**Features:**
- Lazy loading with intersection observer
- Error boundaries
- Customizable fallbacks
- Performance monitoring

#### ArisVirtualList
```tsx
<ArisVirtualList
  items={largeDataSet}
  itemHeight={60}
  renderItem={({ item, index }) => (
    <div key={index}>{item.name}</div>
  )}
/>
```

**Features:**
- Virtual scrolling for large lists
- Dynamic item heights
- Smooth scrolling
- Memory efficient

## Animation System

### Animation Variants
Pre-built animation variants for consistent motion:

```tsx
export const animationVariants = {
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3 }
  }
};
```

### Stagger Animations
For animating lists and groups:

```tsx
<ArisAnimatedList
  staggerDelay={0.1}
  items={items}
  renderItem={(item) => <Card>{item.name}</Card>}
/>
```

### Page Transitions
Smooth transitions between pages:

```tsx
<ArisPageTransition>
  <YourPageComponent />
</ArisPageTransition>
```

## Performance Features

### Optimization Utilities
- **Memoization**: Automatic component memoization
- **Lazy Loading**: Code splitting and lazy imports
- **Virtual Scrolling**: Efficient large list rendering
- **Debouncing**: Input debouncing for search
- **Throttling**: Event throttling for scroll/resize

### Monitoring Tools
- **Performance Monitor**: Real-time performance tracking
- **Memory Tracker**: Memory usage monitoring
- **Bundle Analyzer**: Bundle size analysis

## Usage Guidelines

### 1. **Component Composition**
```tsx
// Good: Compose components for complex UIs
<ArisCard>
  <ArisAnimatedStats value={100} label="Users" />
  <ArisButton variant="primary">View Details</ArisButton>
</ArisCard>

// Avoid: Creating custom components for simple layouts
```

### 2. **Animation Usage**
```tsx
// Good: Use subtle animations for better UX
<ArisAnimatedCard variant="fadeIn" delay={0.1}>
  Content
</ArisAnimatedCard>

// Avoid: Overusing animations that distract from content
```

### 3. **Performance Best Practices**
```tsx
// Good: Use lazy loading for heavy components
<ArisLazy>
  <ExpensiveChart />
</ArisLazy>

// Good: Use virtual scrolling for large lists
<ArisVirtualList items={largeDataSet} />
```

### 4. **Accessibility**
```tsx
// Good: Always provide accessible labels
<ArisInput
  label="Search"
  aria-label="Search products"
  placeholder="Enter search term"
/>

// Good: Respect motion preferences
<ArisAnimatedCard
  variant={prefersReducedMotion ? "none" : "slideUp"}
>
  Content
</ArisAnimatedCard>
```

### 5. **Color Usage**
```tsx
// Good: Use semantic colors for states
<ArisButton variant="destructive">Delete</ArisButton>
<ArisAlert variant="success">Success message</ArisAlert>

// Good: Use rainbow gradient for primary actions
<ArisSubmitButton>Save Changes</ArisSubmitButton>
```

## File Structure

```
src/
├── components/
│   └── ui/
│       ├── aris-form.tsx          # Form components
│       ├── aris-animations.tsx    # Animation components
│       ├── aris-loading.tsx       # Loading states
│       ├── aris-table.tsx         # Table components
│       └── aris-performance.tsx   # Performance utilities
├── styles/
│   └── globals.css               # Global styles
└── app/
    └── dashboard/
        └── page.tsx              # Example implementation
```

## Migration Guide

### From Legacy Components
1. Replace old form inputs with `ArisInput`
2. Update buttons to use `ArisButton` variants
3. Add animations with `ArisAnimated*` components
4. Implement loading states with `ArisLoading*` components
5. Update tables to use `ArisTable`

### Performance Upgrades
1. Wrap heavy components with `ArisLazy`
2. Use `ArisVirtualList` for large datasets
3. Implement `ArisOptimized` for expensive renders
4. Add performance monitoring in development

## Contributing

### Adding New Components
1. Follow the ARIS naming convention (`Aris*`)
2. Include rainbow gradient variants
3. Add animation support
4. Implement accessibility features
5. Write comprehensive documentation
6. Add TypeScript types
7. Include usage examples

### Testing
- Unit tests for all components
- Accessibility testing
- Performance benchmarks
- Cross-browser compatibility
- Mobile responsiveness

## Support

For questions, issues, or contributions:
- Check the component documentation
- Review usage examples
- Test in isolation first
- Follow accessibility guidelines
- Maintain consistent styling

---

*ARIS Design System v1.0 - Built for modern CRM applications* 