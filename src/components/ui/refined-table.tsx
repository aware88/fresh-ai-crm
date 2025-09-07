import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";

const RefinedTable = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm border-separate border-spacing-0", className)}
      {...props}
    />
  </div>
));
RefinedTable.displayName = "RefinedTable";

const RefinedTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("", className)} {...props} />
));
RefinedTableHeader.displayName = "RefinedTableHeader";

const RefinedTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("", className)}
    {...props}
  />
));
RefinedTableBody.displayName = "RefinedTableBody";

const RefinedTableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn("border-t bg-muted/50 font-medium", className)}
    {...props}
  />
));
RefinedTableFooter.displayName = "RefinedTableFooter";

interface RefinedTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  hoverable?: boolean;
  selected?: boolean;
}

const RefinedTableRow = React.forwardRef<
  HTMLTableRowElement,
  RefinedTableRowProps
>(({ className, hoverable = true, selected = false, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-border/40 transition-colors",
      hoverable && "hover:bg-muted/30",
      selected && "bg-muted/50",
      "data-[state=selected]:bg-muted/50",
      className
    )}
    {...props}
  />
));
RefinedTableRow.displayName = "RefinedTableRow";

interface RefinedTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

const RefinedTableHead = React.forwardRef<
  HTMLTableCellElement,
  RefinedTableHeadProps
>(({ className, sortable = false, sortDirection = null, onSort, children, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-4 text-left align-middle font-medium text-muted-foreground",
      "bg-muted/20 first:rounded-tl-md last:rounded-tr-md",
      "border-b border-border/40",
      sortable && "cursor-pointer select-none hover:text-foreground transition-colors",
      className
    )}
    onClick={sortable ? onSort : undefined}
    {...props}
  >
    <div className="flex items-center gap-2">
      {children}
      {sortable && (
        <div className="flex flex-col">
          <ChevronUp 
            className={cn(
              "h-3 w-3 transition-opacity",
              sortDirection === 'asc' ? 'opacity-100' : 'opacity-30'
            )} 
          />
          <ChevronDown 
            className={cn(
              "h-3 w-3 -mt-1 transition-opacity",
              sortDirection === 'desc' ? 'opacity-100' : 'opacity-30'
            )} 
          />
        </div>
      )}
    </div>
  </th>
));
RefinedTableHead.displayName = "RefinedTableHead";

const RefinedTableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "px-4 py-3 align-middle text-sm",
      "first:pl-4 last:pr-4",
      className
    )}
    {...props}
  />
));
RefinedTableCell.displayName = "RefinedTableCell";

const RefinedTableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
));
RefinedTableCaption.displayName = "RefinedTableCaption";

// Status cell component for common use cases
interface StatusCellProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'failed';
  children: React.ReactNode;
}

const StatusCell = ({ status, children }: StatusCellProps) => {
  const statusStyles = {
    active: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    inactive: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
    completed: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    failed: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
  };

  return (
    <Badge variant="outline" className={cn("font-medium", statusStyles[status])}>
      {children}
    </Badge>
  );
};

// Action cell component
interface ActionCellProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  children?: React.ReactNode;
}

const ActionCell = ({ onEdit, onDelete, onView, children }: ActionCellProps) => {
  if (children) {
    return <div className="flex items-center gap-2">{children}</div>;
  }

  return (
    <div className="flex items-center gap-2">
      {onView && (
        <Button variant="ghost" size="sm" onClick={onView}>
          View
        </Button>
      )}
      {onEdit && (
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Edit
        </Button>
      )}
      {onDelete && (
        <Button variant="ghost" size="sm" onClick={onDelete}>
          Delete
        </Button>
      )}
      <Button variant="ghost" size="sm">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
};

export {
  RefinedTable,
  RefinedTableHeader,
  RefinedTableBody,
  RefinedTableFooter,
  RefinedTableHead,
  RefinedTableRow,
  RefinedTableCell,
  RefinedTableCaption,
  StatusCell,
  ActionCell,
};

