'use client';

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const RefinedModal = DialogPrimitive.Root;

const RefinedModalTrigger = DialogPrimitive.Trigger;

const RefinedModalPortal = DialogPrimitive.Portal;

const RefinedModalClose = DialogPrimitive.Close;

const RefinedModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
RefinedModalOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface RefinedModalContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const RefinedModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  RefinedModalContentProps
>(({ className, children, size = 'md', ...props }, ref) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] max-h-[95vh]'
  };

  return (
    <RefinedModalPortal>
      <RefinedModalOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border border-border/50 bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
        <RefinedModalClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </RefinedModalClose>
      </DialogPrimitive.Content>
    </RefinedModalPortal>
  );
});
RefinedModalContent.displayName = DialogPrimitive.Content.displayName;

const RefinedModalHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
RefinedModalHeader.displayName = "RefinedModalHeader";

const RefinedModalFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
RefinedModalFooter.displayName = "RefinedModalFooter";

const RefinedModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
RefinedModalTitle.displayName = DialogPrimitive.Title.displayName;

const RefinedModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
RefinedModalDescription.displayName = DialogPrimitive.Description.displayName;

// Confirmation Modal Component
interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: 'default' | 'destructive';
  loading?: boolean;
}

const ConfirmationModal = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
  loading = false
}: ConfirmationModalProps) => {
  return (
    <RefinedModal open={open} onOpenChange={onOpenChange}>
      <RefinedModalContent size="sm">
        <RefinedModalHeader>
          <RefinedModalTitle>{title}</RefinedModalTitle>
          <RefinedModalDescription>{description}</RefinedModalDescription>
        </RefinedModalHeader>
        <RefinedModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              onCancel?.();
              onOpenChange(false);
            }}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </RefinedModalFooter>
      </RefinedModalContent>
    </RefinedModal>
  );
};

// Form Modal Component
interface FormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSubmit?: () => void;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const FormModal = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  onCancel,
  submitText = 'Save',
  cancelText = 'Cancel',
  loading = false,
  size = 'md'
}: FormModalProps) => {
  return (
    <RefinedModal open={open} onOpenChange={onOpenChange}>
      <RefinedModalContent size={size}>
        <RefinedModalHeader>
          <RefinedModalTitle>{title}</RefinedModalTitle>
          {description && (
            <RefinedModalDescription>{description}</RefinedModalDescription>
          )}
        </RefinedModalHeader>
        <div className="space-y-4">
          {children}
        </div>
        {(onSubmit || onCancel) && (
          <RefinedModalFooter>
            <Button
              variant="outline"
              onClick={() => {
                onCancel?.();
                onOpenChange(false);
              }}
              disabled={loading}
            >
              {cancelText}
            </Button>
            {onSubmit && (
              <Button
                onClick={onSubmit}
                disabled={loading}
              >
                {loading ? 'Saving...' : submitText}
              </Button>
            )}
          </RefinedModalFooter>
        )}
      </RefinedModalContent>
    </RefinedModal>
  );
};

export {
  RefinedModal,
  RefinedModalPortal,
  RefinedModalOverlay,
  RefinedModalClose,
  RefinedModalTrigger,
  RefinedModalContent,
  RefinedModalHeader,
  RefinedModalFooter,
  RefinedModalTitle,
  RefinedModalDescription,
  ConfirmationModal,
  FormModal,
};

