import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusVariant = "default" | "success" | "warning" | "danger" | "info" | "secondary";

interface StatusConfig {
  variant: StatusVariant;
  className?: string;
}

const statusConfigs: Record<string, StatusConfig> = {
  // Lead statuses
  hot: { variant: "danger", className: "bg-red-100 text-red-700 border-red-200" },
  warm: { variant: "warning", className: "bg-orange-100 text-orange-700 border-orange-200" },
  cold: { variant: "info", className: "bg-blue-100 text-blue-700 border-blue-200" },
  
  // General statuses
  active: { variant: "success", className: "bg-green-100 text-green-700 border-green-200" },
  inactive: { variant: "secondary", className: "bg-gray-100 text-gray-700 border-gray-200" },
  pending: { variant: "warning", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  completed: { variant: "success", className: "bg-green-100 text-green-700 border-green-200" },
  failed: { variant: "danger", className: "bg-red-100 text-red-700 border-red-200" },
  
  // Order statuses
  processing: { variant: "info", className: "bg-blue-100 text-blue-700 border-blue-200" },
  shipped: { variant: "success", className: "bg-green-100 text-green-700 border-green-200" },
  delivered: { variant: "success", className: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { variant: "secondary", className: "bg-gray-100 text-gray-700 border-gray-200" },
  
  // Payment statuses
  paid: { variant: "success", className: "bg-green-100 text-green-700 border-green-200" },
  unpaid: { variant: "warning", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  overdue: { variant: "danger", className: "bg-red-100 text-red-700 border-red-200" },
  refunded: { variant: "info", className: "bg-blue-100 text-blue-700 border-blue-200" },
};

interface StatusBadgeProps {
  status: string;
  children?: React.ReactNode;
  className?: string;
}

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '');
  const config = statusConfigs[normalizedStatus] || { variant: "default" as StatusVariant };
  
  return (
    <Badge 
      variant="outline"
      className={cn(
        "font-medium",
        config.className,
        className
      )}
    >
      {children || status}
    </Badge>
  );
}

// Score indicator component
interface ScoreIndicatorProps {
  score: number;
  maxScore?: number;
  showLabel?: boolean;
  className?: string;
}

export function ScoreIndicator({ 
  score, 
  maxScore = 100, 
  showLabel = false,
  className 
}: ScoreIndicatorProps) {
  const percentage = (score / maxScore) * 100;
  
  const getColor = () => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    if (percentage >= 40) return "text-orange-600";
    return "text-red-600";
  };
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showLabel && <span className="text-sm text-muted-foreground">Score:</span>}
      <span className={cn("font-semibold", getColor())}>
        {score}
      </span>
      <span className="text-sm text-muted-foreground">/ {maxScore}</span>
    </div>
  );
}