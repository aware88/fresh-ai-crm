'use client';

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ConfirmationDialogProps {
  trigger?: React.ReactNode;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ConfirmationDialog({
  trigger,
  title,
  description,
  confirmText = "Continue",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
  open,
  onOpenChange,
}: ConfirmationDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange?.(false);
    } catch (error) {
      console.error("Confirmation action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onCancel} disabled={isLoading}>
          {cancelText}
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={handleConfirm}
          disabled={isLoading}
          className={variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
        >
          {isLoading ? "Processing..." : confirmText}
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  );

  if (trigger) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
        <AlertDialogContent>{content}</AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>{content}</AlertDialogContent>
    </AlertDialog>
  );
}

// Hook for easy confirmation dialogs
export function useConfirmation() {
  const [dialogState, setDialogState] = React.useState<{
    open: boolean;
    title: string;
    description: string;
    variant?: "default" | "destructive";
    onConfirm?: () => void | Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
  });

  const confirm = React.useCallback((
    title: string,
    description: string,
    options?: {
      variant?: "default" | "destructive";
    }
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        title,
        description,
        variant: options?.variant,
        onConfirm: () => {
          resolve(true);
          setDialogState(prev => ({ ...prev, open: false }));
        },
      });
    });
  }, []);

  const dialog = (
    <ConfirmationDialog
      open={dialogState.open}
      onOpenChange={(open) => {
        if (!open) {
          setDialogState(prev => ({ ...prev, open: false }));
        }
      }}
      title={dialogState.title}
      description={dialogState.description}
      variant={dialogState.variant}
      onConfirm={dialogState.onConfirm || (() => {})}
      confirmText={dialogState.variant === "destructive" ? "Delete" : "Confirm"}
    />
  );

  return { confirm, ConfirmationDialog: dialog };
}