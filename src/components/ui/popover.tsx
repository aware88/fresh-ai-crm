"use client";

import * as React from "react";

// Simple popover component that doesn't rely on external dependencies
// This is a stripped-down version with basic functionality

interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const PopoverContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}>({ open: false, setOpen: () => {} });

const Popover: React.FC<PopoverProps> = ({ 
  children, 
  open: controlledOpen, 
  onOpenChange 
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  
  const setOpen = React.useCallback((value: boolean | ((prevState: boolean) => boolean)) => {
    if (!isControlled) {
      setInternalOpen(value);
    }
    if (onOpenChange) {
      const newValue = typeof value === "function" ? value(open) : value;
      onOpenChange(newValue);
    }
  }, [isControlled, onOpenChange, open]);
  
  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      {children}
    </PopoverContext.Provider>
  );
};

interface PopoverTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ children, asChild, ...props }, ref) => {
    const { open, setOpen } = React.useContext(PopoverContext);
    const Child = asChild ? React.Children.only(children) as React.ReactElement : <button {...props} ref={ref}>{children}</button>;
    
    return React.cloneElement(Child, {
      ...Child.props,
      onClick: (e: React.MouseEvent) => {
        Child.props.onClick?.(e);
        setOpen(!open);
      },
      ref
    });
  }
);

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className = "", align = "center", sideOffset = 4, children, ...props }, ref) => {
    const { open } = React.useContext(PopoverContext);
    
    if (!open) return null;
    
    // Basic positioning based on alignment
    let alignClass = "left-1/2 transform -translate-x-1/2"; // center
    if (align === "start") alignClass = "left-0";
    if (align === "end") alignClass = "right-0";
    
    return (
      <div className="fixed inset-0 z-40 pointer-events-none" {...props}>
        <div 
          ref={ref}
          style={{ marginTop: sideOffset }}
          className={`absolute top-full ${alignClass} z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white p-2 shadow-md animate-in fade-in-0 zoom-in-95 pointer-events-auto ${className}`}
        >
          {children}
        </div>
      </div>
    );
  }
);

PopoverTrigger.displayName = "PopoverTrigger";
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverTrigger, PopoverContent };
