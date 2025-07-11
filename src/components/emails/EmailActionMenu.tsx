import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Archive, Eye, Forward, MoreHorizontal, Paperclip, Reply, Trash } from "lucide-react";

interface Email {
  id: string;
  read_at?: string;
  has_attachments?: boolean;
  attachments?: {
    id: string;
    filename: string;
    size: number;
    content_type: string;
    url?: string;
  }[];
}

interface EmailActionMenuProps {
  email: Email;
  onMarkRead?: (id: string) => void;
  onArchive?: (id: string) => void;
  onViewAttachments?: (email: Email) => void;
  onReply?: (email: Email) => void;
  onForward?: (email: Email) => void;
  onDelete?: (id: string) => void;
}

export function EmailActionMenu({
  email,
  onMarkRead = () => {},
  onArchive = () => {},
  onViewAttachments = () => {},
  onReply = () => {},
  onForward = () => {},
  onDelete = () => {},
}: EmailActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onMarkRead(email.id)}>
          <Eye className="mr-2 h-4 w-4" />
          Mark as {email.read_at ? 'Unread' : 'Read'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onArchive(email.id)}>
          <Archive className="mr-2 h-4 w-4" />
          Archive
        </DropdownMenuItem>
        {email.has_attachments && (
          <DropdownMenuItem onClick={() => onViewAttachments(email)}>
            <Paperclip className="mr-2 h-4 w-4" />
            View Attachments ({email.attachments?.length || 0})
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onReply(email)}>
          <Reply className="mr-2 h-4 w-4" />
          Reply
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onForward(email)}>
          <Forward className="mr-2 h-4 w-4" />
          Forward
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(email.id)}>
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
