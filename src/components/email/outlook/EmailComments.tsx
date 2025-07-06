'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  messageId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

interface EmailCommentsProps {
  messageId: string;
}

export default function EmailComments({ messageId }: EmailCommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch comments for this email
  useEffect(() => {
    async function fetchComments() {
      try {
        setLoading(true);
        // This would be a real API call in production
        // For now, we'll simulate loading comments
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data
        const mockComments: Comment[] = [
          {
            id: '1',
            messageId,
            userId: 'user1',
            userName: 'John Doe',
            userAvatar: 'https://i.pravatar.cc/40?img=1',
            content: 'This customer has been with us for 3 years. They usually respond quickly.',
            createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          },
          {
            id: '2',
            messageId,
            userId: 'user2',
            userName: 'Jane Smith',
            userAvatar: 'https://i.pravatar.cc/40?img=2',
            content: 'I handled their last support request. They were satisfied with our solution.',
            createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          },
        ];
        
        setComments(mockComments);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch comments:', err);
        setError('Failed to load comments');
      } finally {
        setLoading(false);
      }
    }

    fetchComments();
  }, [messageId]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !session?.user) return;
    
    try {
      // This would be a real API call in production
      // For now, we'll simulate adding a comment
      const newCommentObj: Comment = {
        id: `comment-${Date.now()}`,
        messageId,
        userId: session.user.id as string,
        userName: session.user.name || 'Anonymous',
        userAvatar: session.user.image || undefined,
        content: newComment.trim(),
        createdAt: new Date().toISOString(),
      };
      
      setComments([...comments, newCommentObj]);
      setNewComment('');
    } catch (err: any) {
      console.error('Failed to add comment:', err);
      setError('Failed to add comment');
    }
  };

  return (
    <div className="email-comments mt-6">
      <h3 className="text-lg font-medium mb-4">Comments</h3>
      
      {loading ? (
        <div className="text-center py-4">
          <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Loading comments...</p>
        </div>
      ) : error ? (
        <div className="text-center py-4 text-red-500">{error}</div>
      ) : (
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No comments yet</p>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="flex space-x-3 p-3 bg-gray-50 rounded-lg">
                {comment.userAvatar ? (
                  <img 
                    src={comment.userAvatar} 
                    alt={comment.userName} 
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 font-medium">
                    {comment.userName.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-sm">{comment.userName}</p>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{comment.content}</p>
                </div>
              </div>
            ))
          )}
          
          {/* Add new comment */}
          <div className="mt-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full px-3 py-2 border rounded-lg text-sm"
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || !session?.user}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
