# ARIS Design System - Quick Start Guide

## 🚀 Getting Started

This guide will help you quickly integrate the ARIS Design System into your React/Next.js project.

## Prerequisites

- React 18+
- Next.js 13+ (with App Router)
- TypeScript 4.9+
- Tailwind CSS 3.3+
- Framer Motion 10+

## Installation

### 1. Install Dependencies

```bash
npm install framer-motion lucide-react
# or
yarn add framer-motion lucide-react
```

### 2. Copy Component Files

Copy the following files to your project:

```
src/components/ui/
├── aris-form.tsx          # Form components
├── aris-animations.tsx    # Animation components  
├── aris-loading.tsx       # Loading states
├── aris-table.tsx         # Table components
└── aris-performance.tsx   # Performance utilities
```

### 3. Update Tailwind Config

Add the ARIS color palette to your `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        aris: {
          blue: '#3b82f6',
          purple: '#8b5cf6',
          pink: '#ec4899',
        },
      },
      backgroundImage: {
        'aris-gradient': 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
      },
    },
  },
};
```

## Basic Usage

### 1. Simple Form

```tsx
import { ArisInput, ArisSubmitButton } from '@/components/ui/aris-form';

function ContactForm() {
  return (
    <form className="space-y-4">
      <ArisInput
        label="Name"
        placeholder="Enter your name"
        required
      />
      <ArisInput
        label="Email"
        type="email"
        placeholder="Enter your email"
        required
      />
      <ArisSubmitButton>
        Submit
      </ArisSubmitButton>
    </form>
  );
}
```

### 2. Animated Dashboard

```tsx
import { ArisAnimatedCard, ArisAnimatedStats } from '@/components/ui/aris-animations';
import { Users, ShoppingCart, DollarSign } from 'lucide-react';

function Dashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <ArisAnimatedStats
        value={1847}
        label="Total Users"
        trend="up"
        trendValue={12}
        icon={Users}
      />
      <ArisAnimatedStats
        value={247}
        label="Orders"
        trend="up"
        trendValue={8}
        icon={ShoppingCart}
      />
      <ArisAnimatedStats
        value={47392}
        label="Revenue"
        trend="up"
        trendValue={15}
        prefix="$"
        icon={DollarSign}
      />
    </div>
  );
}
```

### 3. Data Table

```tsx
import { ArisTable, createViewAction, createEditAction } from '@/components/ui/aris-table';

function UserTable() {
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
  ];

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Role', filterable: true },
  ];

  const actions = [
    createViewAction((user) => console.log('View:', user)),
    createEditAction((user) => console.log('Edit:', user)),
  ];

  return (
    <ArisTable
      data={users}
      columns={columns}
      actions={actions}
      searchable
      pagination={{ pageSize: 10 }}
    />
  );
}
```

### 4. Loading States

```tsx
import { ArisSpinner, ArisSkeletonCard } from '@/components/ui/aris-loading';

function LoadingExample() {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return (
      <div className="space-y-4">
        <ArisSkeletonCard showAvatar lines={3} />
        <ArisSkeletonCard lines={2} />
      </div>
    );
  }

  return <div>Content loaded!</div>;
}
```

## 5-Minute Setup

### Complete Dashboard Example

```tsx
'use client';

import { useState } from 'react';
import { 
  ArisAnimatedCard, 
  ArisAnimatedStats,
  ArisFloatingButton 
} from '@/components/ui/aris-animations';
import { ArisTable, createViewAction } from '@/components/ui/aris-table';
import { ArisSpinner } from '@/components/ui/aris-loading';
import { Users, ShoppingCart, DollarSign, Plus } from 'lucide-react';

export default function Dashboard() {
  const [loading, setLoading] = useState(false);

  // Sample data
  const stats = [
    { value: 1847, label: 'Total Users', trend: 'up', trendValue: 12, icon: Users },
    { value: 247, label: 'Orders', trend: 'up', trendValue: 8, icon: ShoppingCart },
    { value: 47392, label: 'Revenue', trend: 'up', trendValue: 15, prefix: '$', icon: DollarSign },
  ];

  const recentOrders = [
    { id: 1, customer: 'John Doe', amount: 299.99, status: 'Completed' },
    { id: 2, customer: 'Jane Smith', amount: 149.99, status: 'Processing' },
    { id: 3, customer: 'Bob Johnson', amount: 399.99, status: 'Shipped' },
  ];

  const tableColumns = [
    { key: 'customer', label: 'Customer', sortable: true },
    { key: 'amount', label: 'Amount', sortable: true, render: (amount) => `$${amount}` },
    { key: 'status', label: 'Status', filterable: true },
  ];

  const tableActions = [
    createViewAction((order) => console.log('View order:', order)),
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <ArisAnimatedCard variant="fadeIn" className="bg-white p-6 rounded-lg shadow-sm">
          <h1 className="text-3xl font-bold bg-aris-gradient bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's what's happening.</p>
        </ArisAnimatedCard>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <ArisAnimatedStats
              key={stat.label}
              value={stat.value}
              label={stat.label}
              trend={stat.trend}
              trendValue={stat.trendValue}
              prefix={stat.prefix}
              icon={stat.icon}
              delay={index * 0.1}
            />
          ))}
        </div>

        {/* Recent Orders */}
        <ArisAnimatedCard variant="slideUp" delay={0.4} className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
          <ArisTable
            data={recentOrders}
            columns={tableColumns}
            actions={tableActions}
            pagination={{ pageSize: 5 }}
            searchable
            loading={loading}
          />
        </ArisAnimatedCard>

        {/* Floating Action Button */}
        <ArisFloatingButton
          onClick={() => console.log('Add new item')}
          className="fixed bottom-6 right-6"
        >
          <Plus className="w-6 h-6" />
        </ArisFloatingButton>
      </div>
    </div>
  );
}
```

## Common Patterns

### 1. Form with Validation

```tsx
import { useState } from 'react';
import { ArisInput, ArisTextarea, ArisSelect, ArisSubmitButton } from '@/components/ui/aris-form';

function ProductForm() {
  const [loading, setLoading] = useState(false);

  const categories = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'books', label: 'Books' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Handle form submission
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <ArisInput
        label="Product Name"
        placeholder="Enter product name"
        required
        validation={{ required: 'Product name is required' }}
      />
      
      <ArisSelect
        label="Category"
        placeholder="Select category"
        options={categories}
        required
        validation={{ required: 'Please select a category' }}
      />
      
      <ArisTextarea
        label="Description"
        placeholder="Product description"
        maxLength={500}
        showCharCount
        validation={{ 
          required: 'Description is required',
          minLength: { value: 10, message: 'Description must be at least 10 characters' }
        }}
      />
      
      <ArisSubmitButton loading={loading}>
        {loading ? 'Creating...' : 'Create Product'}
      </ArisSubmitButton>
    </form>
  );
}
```

### 2. Animated Page Layout

```tsx
import { ArisAnimatedCard, ArisPageTransition } from '@/components/ui/aris-animations';

function AnimatedPage() {
  return (
    <ArisPageTransition>
      <div className="space-y-6">
        <ArisAnimatedCard variant="fadeIn" delay={0.1}>
          <h1>Page Title</h1>
        </ArisAnimatedCard>
        
        <ArisAnimatedCard variant="slideUp" delay={0.2}>
          <p>Page content here</p>
        </ArisAnimatedCard>
        
        <ArisAnimatedCard variant="slideUp" delay={0.3}>
          <button>Call to Action</button>
        </ArisAnimatedCard>
      </div>
    </ArisPageTransition>
  );
}
```

### 3. Performance Optimized List

```tsx
import { ArisLazy, ArisOptimizedList } from '@/components/ui/aris-performance';
import { ArisSkeletonCard } from '@/components/ui/aris-loading';

function OptimizedList({ items }) {
  return (
    <ArisLazy fallback={<ArisSkeletonCard lines={5} />}>
      <ArisOptimizedList
        items={items}
        itemHeight={80}
        renderItem={({ item, index }) => (
          <div key={item.id} className="p-4 border-b">
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </div>
        )}
      />
    </ArisLazy>
  );
}
```

## Best Practices

### 1. Animation Guidelines

```tsx
// ✅ Good: Subtle, purposeful animations
<ArisAnimatedCard variant="fadeIn" delay={0.1}>
  <Content />
</ArisAnimatedCard>

// ❌ Avoid: Excessive or distracting animations
<ArisAnimatedCard variant="slideUp" delay={2} duration={5}>
  <Content />
</ArisAnimatedCard>
```

### 2. Loading States

```tsx
// ✅ Good: Show loading states for better UX
{loading ? (
  <ArisSkeletonCard showAvatar lines={3} />
) : (
  <ContentCard />
)}

// ❌ Avoid: No loading feedback
{data && <ContentCard />}
```

### 3. Form Validation

```tsx
// ✅ Good: Clear, helpful validation messages
<ArisInput
  label="Email"
  type="email"
  validation={{
    required: "Email is required",
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: "Please enter a valid email address"
    }
  }}
/>

// ❌ Avoid: Generic or unclear messages
<ArisInput
  validation={{ required: "Required" }}
/>
```

### 4. Performance

```tsx
// ✅ Good: Lazy load heavy components
<ArisLazy fallback={<ArisSpinner />}>
  <ExpensiveChart />
</ArisLazy>

// ✅ Good: Use virtual scrolling for large lists
<ArisOptimizedList items={largeDataset} />

// ❌ Avoid: Rendering large lists without optimization
{largeDataset.map(item => <Item key={item.id} />)}
```

## Troubleshooting

### Common Issues

1. **TypeScript Errors**: Make sure you have the latest TypeScript version
2. **Animation Not Working**: Check that Framer Motion is installed
3. **Styles Not Applied**: Verify Tailwind CSS is configured correctly
4. **Icons Missing**: Install and import from `lucide-react`

### Debug Mode

Enable debug mode for development:

```tsx
import { ArisPerformanceMonitor } from '@/components/ui/aris-performance';

// Wrap your app in development
{process.env.NODE_ENV === 'development' && (
  <ArisPerformanceMonitor>
    <App />
  </ArisPerformanceMonitor>
)}
```

## Next Steps

1. **Explore Components**: Check out the [Component Reference](./COMPONENT_REFERENCE.md)
2. **Design System**: Read the full [Design System Documentation](./ARIS_DESIGN_SYSTEM.md)
3. **Customize**: Modify colors and spacing in your Tailwind config
4. **Extend**: Add your own components following ARIS patterns

## Support

- 📖 [Full Documentation](./ARIS_DESIGN_SYSTEM.md)
- 🔧 [Component Reference](./COMPONENT_REFERENCE.md)
- 💡 [GitHub Issues](https://github.com/your-repo/issues)

---

*Happy coding with ARIS! 🚀* 