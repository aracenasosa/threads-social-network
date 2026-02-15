'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Post } from '@/shared/types/post.types';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PostButton } from '@/components/shared/post-button';
import { Avatar } from '@/components/shared/avatar';
import { Smile } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useTheme } from 'next-themes';
import { PostMediaGrid } from './post-media-grid';

interface EditPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post;
  onSubmit: (text: string) => Promise<void>;
}

export function EditPostModal({
  open,
  onOpenChange,
  post,
  onSubmit,
}: EditPostModalProps) {
  const { user } = useAuthStore();
  const { resolvedTheme } = useTheme();
  const [text, setText] = useState(post.text);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset form when modal opens or post changes
  useEffect(() => {
    if (open) {
      setText(post.text);
      setError(null);
      setShowEmojiPicker(false);
      
      // Auto-resize and focus
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
          textareaRef.current.focus();
          // Move cursor to end
          const len = post.text.length;
          textareaRef.current.setSelectionRange(len, len);
        }
      }, 50);
    }
  }, [open, post.text]);

  const handleTextChange = (newText: string) => {
    setText(newText);
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const newText = text + emojiData.emoji;
    handleTextChange(newText);
    setShowEmojiPicker(false);
  };

  const handleSubmit = async () => {
    const trimmedText = text.trim();
    
    if (!trimmedText || trimmedText.length < 3) {
      setError('Text must be at least 3 characters');
      return;
    }

    if (trimmedText.length > 1000) {
      setError('Text cannot exceed 1000 characters');
      return;
    }

    if (trimmedText === post.text) {
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(trimmedText);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const canSubmit = text.trim().length >= 3 && text !== post.text;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[600px] p-0 max-h-[90vh] flex flex-col gap-0 overflow-hidden bg-card"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Edit post</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            className="text-foreground font-medium cursor-pointer"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <h2 className="text-base font-semibold text-foreground">
            Edit post
          </h2>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex gap-3 px-4 py-4">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <Avatar
                src={user.avatarUrl}
                alt={user.userName}
                fallback={user.userName}
                size="md"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Username */}
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-foreground text-sm">
                  {user.userName}
                </span>
              </div>

              {/* Text input */}
              <textarea
                key={`edit-textarea-${open ? 'open' : 'closed'}`}
                ref={textareaRef}
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                onInput={(e) => handleTextChange((e.target as HTMLTextAreaElement).value)}
                placeholder="What's new?"
                className={cn(
                  'w-full bg-transparent border-none outline-none resize-none',
                  'text-foreground placeholder:text-muted-foreground',
                  'min-h-[60px] text-[15px] leading-relaxed'
                )}
                style={{ pointerEvents: 'auto'}}
                rows={2}
                autoComplete="off"
                spellCheck="true"
              />

              {/* Existing media (read-only) */}
              {post.media && post.media.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs text-muted-foreground mb-2">
                    Media cannot be edited
                  </div>
                  <PostMediaGrid
                    media={post.media}
                    onMediaClick={() => {}}
                    className="opacity-60 pointer-events-none"
                  />
                </div>
              )}

              {/* Emoji button */}
              <div className="flex items-center gap-1 mt-3 relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={cn(
                    "p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer",
                    showEmojiPicker && "bg-accent text-foreground"
                  )}
                >
                  <Smile className="w-5 h-5" />
                </button>
                
                {/* Emoji Picker Popover */}
                {showEmojiPicker && (
                  <div className="absolute top-10 left-0 z-50">
                    <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                    <div className="relative z-50">
                       <EmojiPicker
                          onEmojiClick={handleEmojiClick}
                          theme={resolvedTheme === 'dark' ? Theme.DARK : Theme.LIGHT}
                          width={320}
                          height={400}
                       />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mx-4 mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-4 py-3 border-t border-border">
          <PostButton
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="px-6 cursor-pointer"
          >
            {isSubmitting ? 'Updating...' : 'Done'}
          </PostButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
