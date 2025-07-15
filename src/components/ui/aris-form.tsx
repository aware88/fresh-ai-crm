'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Checkbox } from './checkbox';

// Enhanced Input with validation states
interface ArisInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  hint?: string;
  required?: boolean;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const ArisInput = React.forwardRef<HTMLInputElement, ArisInputProps>(
  ({ 
    className, 
    label, 
    error, 
    success, 
    hint, 
    required, 
    icon, 
    showPasswordToggle, 
    type = 'text',
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    
    const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;
    
    return (
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {label && (
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          
          <Input
            ref={ref}
            type={inputType}
            className={cn(
              "transition-all duration-200",
              icon && "pl-10",
              showPasswordToggle && "pr-10",
              isFocused && "ring-2 ring-blue-500/20 border-blue-500",
              error && "border-red-500 focus:ring-red-500/20 focus:border-red-500",
              success && "border-green-500 focus:ring-green-500/20 focus:border-green-500",
              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          
          {showPasswordToggle && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          )}
          
          {error && (
            <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
          )}
          
          {success && !error && (
            <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
          )}
        </div>
        
        {error && (
          <motion.p 
            className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.2 }}
          >
            <AlertCircle className="h-3 w-3" />
            {error}
          </motion.p>
        )}
        
        {hint && !error && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{hint}</p>
        )}
      </motion.div>
    );
  }
);

ArisInput.displayName = 'ArisInput';

// Enhanced Textarea with validation states
interface ArisTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  success?: boolean;
  hint?: string;
  required?: boolean;
  maxLength?: number;
  showCount?: boolean;
}

export const ArisTextarea = React.forwardRef<HTMLTextAreaElement, ArisTextareaProps>(
  ({ 
    className, 
    label, 
    error, 
    success, 
    hint, 
    required, 
    maxLength, 
    showCount, 
    value = '',
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const currentLength = String(value).length;
    
    return (
      <motion.div 
        className="space-y-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {label && (
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        
        <div className="relative">
          <Textarea
            ref={ref}
            value={value}
            maxLength={maxLength}
            className={cn(
              "transition-all duration-200 resize-none",
              isFocused && "ring-2 ring-blue-500/20 border-blue-500",
              error && "border-red-500 focus:ring-red-500/20 focus:border-red-500",
              success && "border-green-500 focus:ring-green-500/20 focus:border-green-500",
              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          
          {showCount && maxLength && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {currentLength}/{maxLength}
            </div>
          )}
        </div>
        
        {error && (
          <motion.p 
            className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.2 }}
          >
            <AlertCircle className="h-3 w-3" />
            {error}
          </motion.p>
        )}
        
        {hint && !error && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{hint}</p>
        )}
      </motion.div>
    );
  }
);

ArisTextarea.displayName = 'ArisTextarea';

// Enhanced Select with validation states
interface ArisSelectProps {
  label?: string;
  error?: string;
  success?: boolean;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

export const ArisSelect = ({ 
  label, 
  error, 
  success, 
  hint, 
  required, 
  placeholder, 
  value, 
  onValueChange, 
  children 
}: ArisSelectProps) => {
  const [isFocused, setIsFocused] = React.useState(false);
  
  return (
    <motion.div 
      className="space-y-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {label && (
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger 
            className={cn(
              "transition-all duration-200",
              isFocused && "ring-2 ring-blue-500/20 border-blue-500",
              error && "border-red-500 focus:ring-red-500/20 focus:border-red-500",
              success && "border-green-500 focus:ring-green-500/20 focus:border-green-500"
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {children}
          </SelectContent>
        </Select>
        
        {error && (
          <AlertCircle className="absolute right-8 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
        )}
        
        {success && !error && (
          <CheckCircle2 className="absolute right-8 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
        )}
      </div>
      
      {error && (
        <motion.p 
          className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.2 }}
        >
          <AlertCircle className="h-3 w-3" />
          {error}
        </motion.p>
      )}
      
      {hint && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </motion.div>
  );
};

// Enhanced Checkbox with validation states
interface ArisCheckboxProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  id?: string;
}

export const ArisCheckbox = ({ 
  label, 
  error, 
  hint, 
  required, 
  checked, 
  onCheckedChange, 
  id 
}: ArisCheckboxProps) => {
  return (
    <motion.div 
      className="space-y-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center space-x-2">
        <Checkbox 
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          className={cn(
            "transition-all duration-200",
            error && "border-red-500 data-[state=checked]:bg-red-500"
          )}
        />
        {label && (
          <Label 
            htmlFor={id}
            className={cn(
              "text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer",
              error && "text-red-600 dark:text-red-400"
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
      </div>
      
      {error && (
        <motion.p 
          className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.2 }}
        >
          <AlertCircle className="h-3 w-3" />
          {error}
        </motion.p>
      )}
      
      {hint && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{hint}</p>
      )}
    </motion.div>
  );
};

// Enhanced Submit Button with loading states
interface ArisSubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const ArisSubmitButton = React.forwardRef<HTMLButtonElement, ArisSubmitButtonProps>(
  ({ 
    className, 
    loading, 
    loadingText = 'Submitting...', 
    children, 
    disabled, 
    variant = 'default',
    size = 'default',
    ...props 
  }, ref) => {
    return (
      <Button
        ref={ref}
        type="submit"
        variant={variant}
        size={size}
        disabled={loading || disabled}
        className={cn(
          "relative transition-all duration-200",
          "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600",
          "hover:from-blue-700 hover:via-purple-700 hover:to-pink-700",
          "text-white font-medium shadow-lg",
          "hover:shadow-xl hover:scale-[1.02]",
          "active:scale-[0.98]",
          loading && "cursor-not-allowed opacity-70",
          className
        )}
        {...props}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {loadingText}
          </div>
        ) : (
          children
        )}
      </Button>
    );
  }
);

ArisSubmitButton.displayName = 'ArisSubmitButton';

// Form Container with consistent styling
interface ArisFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export const ArisForm = ({ 
  title, 
  description, 
  children, 
  className, 
  ...props 
}: ArisFormProps) => {
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-gray-600 dark:text-gray-400">{description}</p>
          )}
        </div>
      )}
      
      <form 
        className={cn("space-y-6", className)}
        {...props}
      >
        {children}
      </form>
    </motion.div>
  );
};

// Form Grid for organizing form fields
interface ArisFormGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

export const ArisFormGrid = ({ 
  children, 
  columns = 2, 
  className 
}: ArisFormGridProps) => {
  return (
    <div 
      className={cn(
        "grid gap-4",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 md:grid-cols-2",
        columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  );
}; 