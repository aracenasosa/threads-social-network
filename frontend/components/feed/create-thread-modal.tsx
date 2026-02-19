'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { useAuthStore } from '@/store/auth.store';
import { useCreatePostMutation } from '@/shared/hooks/use-create-post-mutation';
import { CreatePostDTO, POST_CONSTRAINTS } from '@/shared/types/post-dto';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PostButton } from '@/components/shared/post-button';
import { Avatar } from '@/components/shared/avatar';
import { FilePreview } from '@/components/shared/file-preview';
import { useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Video, X, Smile } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { DiscardChangesDialog } from '@/components/shared/discard-changes-dialog';
import { validateFiles } from '@/shared/lib/file';

interface ThreadEntry {
  id: string;
  text: string;
  files: File[];
}

interface CreateThreadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentPostId?: string;
  parentPostAuthor?: string;
}

export function CreateThreadModal({
  open,
  onOpenChange,
  parentPostId,
  parentPostAuthor,
}: CreateThreadModalProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { resolvedTheme } = useTheme();
  const [entries, setEntries] = useState<ThreadEntry[]>([
    { id: '1', text: '', files: [] }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeEmojiEntryId, setActiveEmojiEntryId] = useState<string | null>(null);
  const [focusedEntryId, setFocusedEntryId] = useState<string | null>('1');
  const textareaRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setEntries([{ id: '1', text: '', files: [] }]);
      setError(null);
      setActiveEmojiEntryId(null);
      setFocusedEntryId('1');
    }
  }, [open]);

  const updateEntry = useCallback((id: string, updates: Partial<ThreadEntry>) => {
    setEntries(prev => prev.map(entry =>
      entry.id === id ? { ...entry, ...updates } : entry
    ));
  }, []);

  const handleTextChange = useCallback((id: string, text: string) => {
    updateEntry(id, { text });
    // Auto-resize textarea
    const textarea = textareaRefs.current.get(id);
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [updateEntry]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    if (!activeEmojiEntryId) return;
    
    const entry = entries.find(e => e.id === activeEmojiEntryId);
    if (entry) {
      const newText = entry.text + emojiData.emoji;
      handleTextChange(entry.id, newText);
      setActiveEmojiEntryId(null);
    }
  };

  const handleFileSelect = useCallback((id: string, selectedFiles: File[]) => {
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    const newFiles = [...entry.files, ...selectedFiles];
    
    const error = validateFiles(newFiles);
    if (error) {
      toast.error(error);
      return;
    }

    setError(null);
    updateEntry(id, { files: newFiles });
  }, [entries, updateEntry]);

  const removeFile = useCallback((entryId: string, fileIndex: number) => {
    setEntries(prev => prev.map(entry =>
      entry.id === entryId
        ? { ...entry, files: entry.files.filter((_, i) => i !== fileIndex) }
        : entry
    ));
    setError(null);
  }, []);

  const removeEntry = useCallback((id: string) => {
    if (entries.length <= 1) return;
    setEntries(prev => prev.filter(entry => entry.id !== id));
  }, [entries.length]);

  const addEntry = useCallback(() => {
    // Only allow adding if the last entry is not empty
    const lastEntry = entries[entries.length - 1];
    if (!lastEntry.text.trim() && lastEntry.files.length === 0) return;

    const newId = Date.now().toString();
    setEntries(prev => [...prev, { id: newId, text: '', files: [] }]);
    // Focus new entry after render
    setTimeout(() => {
      const textarea = textareaRefs.current.get(newId);
      if (textarea) textarea.focus();
    }, 50);
  }, [entries]);

  const canSubmit = entries.some(entry => (entry.text.trim().length >= POST_CONSTRAINTS.MIN_TEXT_LENGTH) || entry.files.length > 0) && 
                    entries.every(entry => {
                      const totalSize = entry.files.reduce((sum, f) => sum + f.size, 0);
                      return entry.text.length <= POST_CONSTRAINTS.MAX_TEXT_LENGTH && 
                             entry.files.length <= POST_CONSTRAINTS.MAX_FILES &&
                             totalSize <= POST_CONSTRAINTS.MAX_TOTAL_SIZE_BYTES;
                    });
  const isLastEntryEmpty = !entries[entries.length - 1].text.trim() && entries[entries.length - 1].files.length === 0;

  const createPostMutation = useCreatePostMutation();

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;

    // Close modal immediately
    onOpenChange(false);
    
    // Continue in background
    Promise.resolve().then(async () => {
      const toastId = toast.loading("Posting...");
      try {
        // Post first entry (or reply to parent)
        const firstEntry = entries[0];
        const postData: CreatePostDTO = {
          author: user.id,
          text: firstEntry.text.trim(),
          media: firstEntry.files.length > 0 ? firstEntry.files : undefined,
          parentPost: parentPostId,
          threadIndex: 1,
          threadTotal: entries.length,
          suppressToast: true,
        };
  
        const firstPost = await createPostMutation.mutateAsync(postData);
  
        // Post subsequent entries as replies to the first post
        const rootPostId = firstPost.post._id;
        
        for (let i = 1; i < entries.length; i++) {
          const entry = entries[i];
          if (entry.text.trim() || entry.files.length > 0) {
            const replyData: CreatePostDTO = {
              author: user.id,
              text: entry.text.trim(),
              media: entry.files.length > 0 ? entry.files : undefined,
              parentPost: rootPostId, 
              threadIndex: i + 1,
              threadTotal: entries.length,
              suppressToast: true,
            };
            await createPostMutation.mutateAsync(replyData);
          }
        }

        // Show success toast with View action (handled here since we suppressed individual toasts)
        toast.success(
          <div className="flex w-full items-center justify-between gap-2 min-w-[300px]">
            <span className="truncate">Posted</span>
            <span 
              className="font-bold cursor-pointer hover:underline text-sm shrink-0"
              onClick={() => window.location.href = `/posts/${rootPostId}/thread`}
            >
              View
            </span>
          </div>, 
          { id: toastId, duration: 5000 }
        );

      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Failed to create thread.';
        toast.error(errorMsg, { id: toastId });
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  const triggerFileInput = (entryId: string, accept: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) handleFileSelect(entryId, files);
    };
    input.click();
  };

  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const hasChanges = entries.some(e => e.text.trim().length > 0 || e.files.length > 0) || entries.length > 1;

  const handleCloseAttempt = (e?: Event) => {
    if (e) e.preventDefault();
    if (hasChanges && !isSubmitting) {
      setShowDiscardDialog(true);
    } else {
      onOpenChange(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[600px] p-0 max-h-[90vh] flex flex-col gap-0 overflow-hidden bg-card"
        showCloseButton={false} // Removed the default X button
        onInteractOutside={handleCloseAttempt}
        onEscapeKeyDown={handleCloseAttempt}
      >
        <DialogTitle className="sr-only">New Thread</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            className="text-foreground font-medium cursor-pointer"
            onClick={() => handleCloseAttempt()}
          >
            Cancel
          </Button>
          <h2 className="text-base font-semibold text-foreground">
            {parentPostId ? 'Reply' : 'New thread'}
          </h2>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Reply indicator */}
          {parentPostAuthor && (
            <div className="px-4 pt-3 text-sm text-muted-foreground">
              Replying to <span className="text-primary">{parentPostAuthor}</span>
            </div>
          )}

          {/* Thread entries */}
          {entries.map((entry, index) => (
            <ThreadEntryItem
              key={entry.id}
              entry={entry}
              index={index}
              totalEntries={entries.length}
              user={user}
              activeEmojiEntryId={activeEmojiEntryId}
              setActiveEmojiEntryId={setActiveEmojiEntryId}
              handleTextChange={handleTextChange}
              handleEmojiClick={handleEmojiClick}
              triggerFileInput={triggerFileInput}
              removeFile={removeFile}
              removeEntry={removeEntry}
              textareaRefs={textareaRefs}
              onFocus={setFocusedEntryId}
            />
          ))}

          {/* Add to thread button */}
          <button
            type="button"
            onClick={addEntry}
            disabled={isLastEntryEmpty}
            className={cn(
              "flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground transition-colors w-full cursor-pointer",
              isLastEntryEmpty && "opacity-50 cursor-not-allowed hover:text-muted-foreground"
            )}
          >
            <Avatar
              src={user.avatarUrl}
              alt={user.userName}
              fallback={user.userName}
              size="sm"
              className="opacity-50"
            />
            <span className="text-sm">Add to thread</span>
          </button>

          {/* Error message */}
          {error && (
            <div className="mx-4 mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <div className="flex-1">
            {focusedEntryId && (
              <CharacterCounter 
                current={entries.find(e => e.id === focusedEntryId)?.text.length || 0} 
                max={POST_CONSTRAINTS.MAX_TEXT_LENGTH} 
              />
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            {!canSubmit && !isSubmitting && (
               <div className="flex flex-col items-end mb-1 mr-1">
                  {!entries.some(e => e.text.trim().length >= POST_CONSTRAINTS.MIN_TEXT_LENGTH || e.files.length > 0) && (
                    <span className="text-[11px] font-medium text-destructive">Minimum 1 character or media required</span>
                  )}
                  {entries.some(e => e.text.length > POST_CONSTRAINTS.MAX_TEXT_LENGTH) && (
                    <span className="text-[11px] font-medium text-destructive">Message exceeds {POST_CONSTRAINTS.MAX_TEXT_LENGTH} characters</span>
                  )}
               </div>
            )}
            <PostButton
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="px-6"
            >
              {isSubmitting 
                ? (parentPostId ? 'Replying...' : 'Posting...') 
                : (parentPostId ? 'Reply' : 'Post')}
            </PostButton>
          </div>
        </div>
      </DialogContent>

      <DiscardChangesDialog
        open={showDiscardDialog}
        onOpenChange={setShowDiscardDialog}
        onConfirm={() => onOpenChange(false)}
        title="Discard thread?"
        description="You have unsaved changes in your thread. Are you sure you want to discard it?"
      />
    </Dialog>
  );
}

interface ThreadEntryItemProps {
  entry: ThreadEntry;
  index: number;
  totalEntries: number;
  user: any;
  activeEmojiEntryId: string | null;
  setActiveEmojiEntryId: (id: string | null) => void;
  handleTextChange: (id: string, text: string) => void;
  handleEmojiClick: (emojiData: EmojiClickData) => void;
  triggerFileInput: (id: string, accept: string) => void;
  removeFile: (entryId: string, fileIndex: number) => void;
  removeEntry: (id: string) => void;
  textareaRefs: React.MutableRefObject<Map<string, HTMLTextAreaElement>>;
  onFocus: (id: string) => void;
}

function ThreadEntryItem({
  entry,
  index,
  totalEntries,
  user,
  activeEmojiEntryId,
  setActiveEmojiEntryId,
  handleTextChange,
  handleEmojiClick,
  triggerFileInput,
  removeFile,
  removeEntry,
  textareaRefs,
  onFocus,
}: ThreadEntryItemProps) {
  const { resolvedTheme } = useTheme();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    dragFree: true,
    align: 'start',
    containScroll: 'trimSnaps',
  });

  // Auto-scroll to last media when new files are added
  useEffect(() => {
    if (emblaApi && entry.files.length > 2) {
      // Use a small timeout to ensure the new item is rendered
      setTimeout(() => {
        emblaApi.scrollTo(entry.files.length - 1);
      }, 50);
    }
  }, [emblaApi, entry.files.length]);

  return (
    <div className="relative">
      <div className="flex gap-3 px-4 py-4">
        {/* Avatar and connector line */}
        <div className="flex flex-col items-center">
          <Avatar
            src={user.avatarUrl}
            alt={user.userName}
            fallback={user.userName}
            size="md"
          />
          {/* Connector line to next entry */}
          {index < totalEntries - 1 && (
            <div className="w-0.5 flex-1 bg-border mt-2" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Username and entry number */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-foreground text-sm">
              {user.userName}
            </span>
            {totalEntries > 1 && (
              <span className="text-xs text-muted-foreground">
                {index + 1}/{totalEntries}
              </span>
            )}
          </div>

          {/* Text input */}
          <textarea
            ref={(el) => {
              if (el) textareaRefs.current.set(entry.id, el);
            }}
            value={entry.text}
            onChange={(e) => handleTextChange(entry.id, e.target.value)}
            onFocus={() => onFocus(entry.id)}
            placeholder={index > 0 ? "Say more..." : "What's new?"}
            className={cn(
              'w-full bg-transparent border-none outline-none resize-none',
              'text-foreground placeholder:text-muted-foreground',
              'min-h-[60px] text-[15px] leading-relaxed'
            )}
            rows={2}
          />

          {/* File previews */}
          {entry.files.length > 0 && (
            <div 
              ref={entry.files.length > 1 ? emblaRef : undefined}
              className={cn(
                "mt-3 overflow-hidden",
                entry.files.length > 1 && "cursor-grab active:cursor-grabbing"
              )}
            >
              <div className={cn(
                "flex",
                entry.files.length > 1 ? "gap-3" : "w-full"
              )}>
                {entry.files.map((file, fileIndex) => (
                  <div 
                    key={fileIndex} 
                    className={cn(
                      "relative shrink-0",
                      entry.files.length > 1 ? "w-[260px]" : "w-full"
                    )}
                  >
                    <FilePreview
                      file={file}
                      onRemove={() => removeFile(entry.id, fileIndex)}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Media buttons */}
          <div className="flex items-center gap-1 mt-3 relative">
            <button
              type="button"
              onClick={() => triggerFileInput(entry.id, 'image/*')}
              className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <ImagePlus className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => triggerFileInput(entry.id, 'video/*')}
              className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <Video className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveEmojiEntryId(activeEmojiEntryId === entry.id ? null : entry.id)}
              className={cn(
                "p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer",
                activeEmojiEntryId === entry.id && "bg-accent text-foreground"
              )}
            >
              <Smile className="w-5 h-5" />
            </button>
            
            {/* Emoji Picker Popover */}
            {activeEmojiEntryId === entry.id && (
              <div className="absolute top-10 left-0 z-50">
                <div className="fixed inset-0 z-40" onClick={() => setActiveEmojiEntryId(null)} />
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

        {/* Remove entry button */}
        {totalEntries > 1 && (
          <button
            type="button"
            onClick={() => removeEntry(entry.id)}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function CharacterCounter({ current, max }: { current: number; max: number }) {
  const remaining = max - current;
  const isOverLimit = remaining < 0;

  return (
    <div className={cn(
      "text-[13px] font-medium transition-colors",
      isOverLimit 
        ? "text-destructive" 
        : "text-muted-foreground" // Use muted foreground as base color
    )}>
      {remaining}
    </div>
  );
}
