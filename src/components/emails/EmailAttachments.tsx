import { Button } from "@/components/ui/button";
import { FileIcon, FileText, Image, Music, Video, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Attachment {
  id: string;
  filename: string;
  size: number;
  content_type: string;
  url?: string;
}

interface EmailAttachmentsProps {
  attachments: Attachment[];
  onDownload?: (attachment: Attachment) => void;
}

export function EmailAttachments({ 
  attachments,
  onDownload
}: EmailAttachmentsProps) {
  const { toast } = useToast();
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    } else if (contentType.startsWith('video/')) {
      return <Video className="h-5 w-5 text-red-500" />;
    } else if (contentType.startsWith('audio/')) {
      return <Music className="h-5 w-5 text-purple-500" />;
    } else if (contentType.includes('pdf')) {
      return <FileText className="h-5 w-5 text-orange-500" />;
    } else {
      return <FileIcon className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const handleDownload = (attachment: Attachment) => {
    if (onDownload) {
      onDownload(attachment);
    } else {
      // Default download handler
      if (attachment.url) {
        window.open(attachment.url, '_blank');
      } else {
        toast({
          title: "Download started",
          description: `Downloading ${attachment.filename}...`,
        });
        
        // Simulate download completion
        setTimeout(() => {
          toast({
            title: "Download complete",
            description: `${attachment.filename} has been downloaded.`,
          });
        }, 2000);
      }
    }
  };
  
  if (!attachments || attachments.length === 0) {
    return <div className="text-sm text-muted-foreground">No attachments</div>;
  }
  
  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <div 
          key={attachment.id} 
          className="flex items-center justify-between p-2 rounded-md border bg-muted/40"
        >
          <div className="flex items-center space-x-2">
            {getFileIcon(attachment.content_type)}
            <div>
              <p className="text-sm font-medium">{attachment.filename}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={() => handleDownload(attachment)}
          >
            <Download className="h-4 w-4" />
            <span className="sr-only">Download</span>
          </Button>
        </div>
      ))}
    </div>
  );
}
