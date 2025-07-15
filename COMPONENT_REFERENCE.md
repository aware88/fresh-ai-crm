# ARIS Component Reference

## Quick Reference

| Component | File | Purpose |
|-----------|------|---------|
| [ArisInput](#arisinput) | `aris-form.tsx` | Form input with validation |
| [ArisTextarea](#aristextarea) | `aris-form.tsx` | Multi-line text input |
| [ArisSelect](#arisselect) | `aris-form.tsx` | Dropdown selection |
| [ArisSubmitButton](#arissubmitbutton) | `aris-form.tsx` | Form submission button |
| [ArisAnimatedCard](#arisanimatedcard) | `aris-animations.tsx` | Animated card container |
| [ArisAnimatedButton](#arisanimatedbutton) | `aris-animations.tsx` | Animated button |
| [ArisAnimatedStats](#arisanimatedstats) | `aris-animations.tsx` | Animated statistics display |
| [ArisSpinner](#arisspinner) | `aris-loading.tsx` | Loading spinner |
| [ArisSkeletonCard](#arisskeletoncard) | `aris-loading.tsx` | Skeleton loading state |
| [ArisTable](#aristable) | `aris-table.tsx` | Data table with features |
| [ArisLazy](#arislazy) | `aris-performance.tsx` | Lazy loading wrapper |

---

## Form Components

### ArisInput

**Purpose**: Enhanced input field with validation, icons, and loading states.

#### Props
```typescript
interface ArisInputProps {
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  disabled?: boolean;
  required?: boolean;
  validation?: {
    required?: string;
    pattern?: { value: RegExp; message: string };
    minLength?: { value: number; message: string };
    maxLength?: { value: number; message: string };
  };
  className?: string;
}
```

#### Examples
```tsx
// Basic input
<ArisInput
  label="Full Name"
  placeholder="Enter your full name"
  required
/>

// Email input with validation
<ArisInput
  label="Email Address"
  type="email"
  placeholder="Enter your email"
  icon={Mail}
  validation={{
    required: "Email is required",
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: "Invalid email address"
    }
  }}
/>

// Password input with toggle
<ArisInput
  label="Password"
  type="password"
  placeholder="Enter your password"
  icon={Lock}
  validation={{
    required: "Password is required",
    minLength: { value: 8, message: "Password must be at least 8 characters" }
  }}
/>

// Loading state
<ArisInput
  label="Username"
  placeholder="Checking availability..."
  loading={isChecking}
  disabled={isChecking}
/>
```

#### Features
- **Validation**: Built-in validation with error messages
- **Icons**: Left and right icon support
- **Password Toggle**: Automatic show/hide for password inputs
- **Loading State**: Shows spinner when loading
- **Focus States**: Rainbow gradient focus ring
- **Accessibility**: Proper ARIA labels and keyboard navigation

---

### ArisTextarea

**Purpose**: Multi-line text input with character counting and auto-resize.

#### Props
```typescript
interface ArisTextareaProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
  autoResize?: boolean;
  disabled?: boolean;
  required?: boolean;
  validation?: {
    required?: string;
    minLength?: { value: number; message: string };
    maxLength?: { value: number; message: string };
  };
  className?: string;
}
```

#### Examples
```tsx
// Basic textarea
<ArisTextarea
  label="Description"
  placeholder="Enter description"
  rows={4}
/>

// With character count
<ArisTextarea
  label="Comments"
  placeholder="Add your comments"
  maxLength={500}
  showCharCount
/>

// Auto-resize
<ArisTextarea
  label="Message"
  placeholder="Type your message"
  autoResize
  validation={{
    required: "Message is required",
    minLength: { value: 10, message: "Message must be at least 10 characters" }
  }}
/>
```

---

### ArisSelect

**Purpose**: Dropdown selection with search and multi-select capabilities.

#### Props
```typescript
interface ArisSelectProps {
  label?: string;
  placeholder?: string;
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  multiple?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  required?: boolean;
  validation?: {
    required?: string;
  };
  className?: string;
}
```

#### Examples
```tsx
// Basic select
<ArisSelect
  label="Category"
  placeholder="Select category"
  options={[
    { value: "tech", label: "Technology" },
    { value: "design", label: "Design" },
    { value: "marketing", label: "Marketing" }
  ]}
/>

// Multi-select with search
<ArisSelect
  label="Skills"
  placeholder="Select skills"
  multiple
  searchable
  options={skillOptions}
  validation={{ required: "Please select at least one skill" }}
/>

// With disabled options
<ArisSelect
  label="Status"
  options={[
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "pending", label: "Pending", disabled: true }
  ]}
/>
```

---

### ArisSubmitButton

**Purpose**: Form submission button with loading states and rainbow gradient.

#### Props
```typescript
interface ArisSubmitButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: 'submit' | 'button';
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}
```

#### Examples
```tsx
// Basic submit button
<ArisSubmitButton>
  Save Changes
</ArisSubmitButton>

// With loading state
<ArisSubmitButton
  loading={isSubmitting}
  disabled={!isValid}
>
  {isSubmitting ? 'Saving...' : 'Save Changes'}
</ArisSubmitButton>

// Different variants
<ArisSubmitButton variant="secondary" size="lg">
  Cancel
</ArisSubmitButton>
```

---

## Animation Components

### ArisAnimatedCard

**Purpose**: Card container with entrance animations and hover effects.

#### Props
```typescript
interface ArisAnimatedCardProps {
  children: React.ReactNode;
  variant?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scaleIn';
  delay?: number;
  duration?: number;
  className?: string;
  onClick?: () => void;
}
```

#### Examples
```tsx
// Basic animated card
<ArisAnimatedCard variant="slideUp" delay={0.2}>
  <h3>Card Title</h3>
  <p>Card content here</p>
</ArisAnimatedCard>

// Staggered cards
{items.map((item, index) => (
  <ArisAnimatedCard
    key={item.id}
    variant="fadeIn"
    delay={index * 0.1}
    className="mb-4"
  >
    <ItemComponent item={item} />
  </ArisAnimatedCard>
))}

// Interactive card
<ArisAnimatedCard
  variant="scaleIn"
  onClick={() => handleCardClick(item)}
  className="cursor-pointer"
>
  <ClickableContent />
</ArisAnimatedCard>
```

---

### ArisAnimatedButton

**Purpose**: Button with spring animations and hover effects.

#### Props
```typescript
interface ArisAnimatedButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  whileHover?: object;
  whileTap?: object;
  className?: string;
}
```

#### Examples
```tsx
// Basic animated button
<ArisAnimatedButton variant="primary">
  Click Me
</ArisAnimatedButton>

// Custom animations
<ArisAnimatedButton
  variant="secondary"
  whileHover={{ scale: 1.05, rotate: 2 }}
  whileTap={{ scale: 0.95 }}
>
  Hover Me
</ArisAnimatedButton>

// With loading state
<ArisAnimatedButton
  loading={isLoading}
  disabled={isLoading}
  onClick={handleSubmit}
>
  {isLoading ? 'Processing...' : 'Submit'}
</ArisAnimatedButton>
```

---

### ArisAnimatedStats

**Purpose**: Animated statistics display with counting and trend indicators.

#### Props
```typescript
interface ArisAnimatedStatsProps {
  value: number;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  icon?: React.ComponentType<{ className?: string }>;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}
```

#### Examples
```tsx
// Basic stats
<ArisAnimatedStats
  value={1847}
  label="Total Users"
  icon={Users}
/>

// With trend
<ArisAnimatedStats
  value={24567}
  label="Monthly Revenue"
  trend="up"
  trendValue={12.5}
  prefix="$"
  icon={DollarSign}
/>

// Custom duration
<ArisAnimatedStats
  value={99.9}
  label="Uptime"
  suffix="%"
  duration={3}
  trend="up"
  trendValue={0.1}
/>
```

---

## Loading Components

### ArisSpinner

**Purpose**: Loading spinner with multiple variants and sizes.

#### Props
```typescript
interface ArisSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'rainbow' | 'dots' | 'bars';
  className?: string;
}
```

#### Examples
```tsx
// Basic spinner
<ArisSpinner />

// Rainbow variant
<ArisSpinner size="lg" variant="rainbow" />

// Dots variant
<ArisSpinner variant="dots" />

// Custom styling
<ArisSpinner 
  size="xl" 
  variant="bars" 
  className="text-blue-500" 
/>
```

---

### ArisSkeletonCard

**Purpose**: Skeleton loading state for cards and content.

#### Props
```typescript
interface ArisSkeletonCardProps {
  showAvatar?: boolean;
  lines?: number;
  avatarSize?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

#### Examples
```tsx
// Basic skeleton
<ArisSkeletonCard />

// With avatar
<ArisSkeletonCard showAvatar lines={3} />

// Custom configuration
<ArisSkeletonCard
  showAvatar
  avatarSize="lg"
  lines={5}
  className="mb-4"
/>
```

---

## Table Components

### ArisTable

**Purpose**: Feature-rich data table with sorting, filtering, and pagination.

#### Props
```typescript
interface ArisTableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    label: string;
    sortable?: boolean;
    filterable?: boolean;
    render?: (value: any, row: T) => React.ReactNode;
  }>;
  actions?: Array<ArisTableAction<T>>;
  pagination?: {
    pageSize: number;
    showSizeChanger?: boolean;
  };
  searchable?: boolean;
  exportable?: boolean;
  loading?: boolean;
  className?: string;
}
```

#### Examples
```tsx
// Basic table
<ArisTable
  data={users}
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Role', filterable: true }
  ]}
/>

// With actions
<ArisTable
  data={products}
  columns={productColumns}
  actions={[
    createViewAction(handleView),
    createEditAction(handleEdit),
    createDeleteAction(handleDelete)
  ]}
  pagination={{ pageSize: 10 }}
  searchable
  exportable
/>

// Custom cell rendering
<ArisTable
  data={orders}
  columns={[
    { key: 'id', label: 'Order ID' },
    { 
      key: 'status', 
      label: 'Status',
      render: (status) => (
        <Badge variant={getStatusVariant(status)}>
          {status}
        </Badge>
      )
    },
    { 
      key: 'total', 
      label: 'Total',
      render: (total) => formatCurrency(total)
    }
  ]}
/>
```

---

## Performance Components

### ArisLazy

**Purpose**: Lazy loading wrapper with intersection observer.

#### Props
```typescript
interface ArisLazyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
}
```

#### Examples
```tsx
// Basic lazy loading
<ArisLazy fallback={<ArisSpinner />}>
  <ExpensiveComponent />
</ArisLazy>

// Custom threshold
<ArisLazy
  threshold={0.5}
  rootMargin="100px"
  fallback={<ArisSkeletonCard />}
>
  <HeavyChart />
</ArisLazy>

// Multiple lazy components
<div>
  <ArisLazy fallback={<div>Loading section 1...</div>}>
    <Section1 />
  </ArisLazy>
  <ArisLazy fallback={<div>Loading section 2...</div>}>
    <Section2 />
  </ArisLazy>
</div>
```

---

## Common Patterns

### Form Composition
```tsx
function UserForm() {
  const [loading, setLoading] = useState(false);
  
  return (
    <ArisForm onSubmit={handleSubmit}>
      <ArisFormGrid cols={2}>
        <ArisInput
          label="First Name"
          required
          validation={{ required: "First name is required" }}
        />
        <ArisInput
          label="Last Name"
          required
          validation={{ required: "Last name is required" }}
        />
      </ArisFormGrid>
      
      <ArisInput
        label="Email"
        type="email"
        icon={Mail}
        validation={{
          required: "Email is required",
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: "Invalid email"
          }
        }}
      />
      
      <ArisSelect
        label="Role"
        options={roleOptions}
        validation={{ required: "Please select a role" }}
      />
      
      <ArisTextarea
        label="Bio"
        placeholder="Tell us about yourself"
        maxLength={500}
        showCharCount
      />
      
      <ArisSubmitButton loading={loading}>
        Create User
      </ArisSubmitButton>
    </ArisForm>
  );
}
```

### Dashboard Layout
```tsx
function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ArisAnimatedStats
          value={1847}
          label="Total Contacts"
          trend="up"
          trendValue={12}
          icon={Users}
          delay={0.1}
        />
        <ArisAnimatedStats
          value={247}
          label="Active Orders"
          trend="up"
          trendValue={8}
          icon={ShoppingCart}
          delay={0.2}
        />
        <ArisAnimatedStats
          value={47392}
          label="Monthly Revenue"
          trend="up"
          trendValue={15}
          prefix="$"
          icon={DollarSign}
          delay={0.3}
        />
        <ArisAnimatedStats
          value={156}
          label="Supplier Partners"
          trend="neutral"
          icon={Building}
          delay={0.4}
        />
      </div>
      
      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <ArisAnimatedCard
            key={feature.id}
            variant="slideUp"
            delay={index * 0.1}
            onClick={() => navigate(feature.path)}
          >
            <FeatureCard feature={feature} />
          </ArisAnimatedCard>
        ))}
      </div>
      
      {/* Data Table */}
      <ArisAnimatedCard variant="fadeIn" delay={0.5}>
        <ArisTable
          data={recentOrders}
          columns={orderColumns}
          actions={orderActions}
          pagination={{ pageSize: 5 }}
          searchable
        />
      </ArisAnimatedCard>
    </div>
  );
}
```

### Loading States
```tsx
function DataPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  
  if (loading) {
    return (
      <div className="space-y-6">
        <ArisSkeletonCard showAvatar lines={2} />
        <ArisSkeletonCard lines={4} />
        <ArisSkeletonCard lines={3} />
      </div>
    );
  }
  
  return (
    <ArisLazy fallback={<ArisSpinner size="lg" variant="rainbow" />}>
      <DataVisualization data={data} />
    </ArisLazy>
  );
}
```

---

## TypeScript Types

### Common Interfaces
```typescript
// Form validation
interface ValidationRule {
  required?: string;
  pattern?: { value: RegExp; message: string };
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  min?: { value: number; message: string };
  max?: { value: number; message: string };
}

// Animation variants
type AnimationVariant = 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scaleIn';

// Component sizes
type ComponentSize = 'sm' | 'md' | 'lg' | 'xl';

// Button variants
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';

// Table action
interface ArisTableAction<T> {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: (row: T) => void;
  variant?: ButtonVariant;
  disabled?: (row: T) => boolean;
}
```

---

## Performance Tips

1. **Use React.memo** for expensive components
2. **Implement virtual scrolling** for large lists
3. **Lazy load** heavy components
4. **Debounce** search inputs
5. **Optimize animations** with GPU acceleration
6. **Use proper keys** in lists
7. **Avoid inline objects** in render
8. **Implement error boundaries**

---

## Accessibility Features

- **ARIA labels** on all interactive elements
- **Keyboard navigation** support
- **Screen reader** compatibility
- **Focus management** with proper tab order
- **Color contrast** compliance
- **Motion preferences** respect
- **Semantic HTML** structure

---

*Component Reference v1.0 - Complete API documentation for ARIS components* 