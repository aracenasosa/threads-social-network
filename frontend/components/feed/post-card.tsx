'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Post } from '@/shared/types/post.types';
import { cn } from '@/shared/lib/utils';
import { Avatar } from '@/components/shared/avatar';
import { PostActions } from './post-actions';
import { MoreHorizontal, X } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreateThreadModal } from './create-thread-modal';
import { PostMediaGrid } from './post-media-grid';
import { EditPostModal } from './edit-post-modal';
import { DeleteConfirmationDialog } from '@/components/shared/delete-confirmation-dialog';
import { useEditPostMutation } from '@/shared/hooks/use-edit-post-mutation';
import { useDeletePostMutation } from '@/shared/hooks/use-delete-post-mutation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Pencil, Trash2 } from 'lucide-react';

import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { useLikeMutation } from '@/shared/hooks/use-like-mutation';

interface PostCardProps {
  post: Post;
  isThreadView?: boolean;
  hideConnectorLine?: boolean;
  hideMenu?: boolean;
}

export function PostCard({ post, isThreadView = false, hideConnectorLine = false, hideMenu = false }: PostCardProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handlePostClick = (e: React.MouseEvent) => {
    // Navigate to thread if not already in thread view
    // and if the click wasn't on an interactive element
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('[data-no-thread-nav="true"]')
    ) {
      return;
    }
    
    router.push(`/posts/${post._id}/thread`);
  };

  const likeMutation = useLikeMutation();

  const handleLike = async () => {
    if (!user) return;
    likeMutation.mutate(post._id);
  };

  const formatDate = (dateString: string) => {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}s`;
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d`;
        const diffInWeeks = Math.floor(diffInDays / 7);
        if (diffInWeeks < 4) return `${diffInWeeks}w`;
        
        // Fallback to simpler date for older posts
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
        return '';
    }
  };

  // Check if post can be edited (within 30 minutes)
  const canEdit = () => {
    const thirtyMinutesInMs = 30 * 60 * 1000;
    const timeSinceCreation = Date.now() - new Date(post.createdAt).getTime();
    return timeSinceCreation <= thirtyMinutesInMs;
  };

  const editMutation = useEditPostMutation();
  const deleteMutation = useDeletePostMutation();

  const handleEdit = async (text: string) => {
    await editMutation.mutateAsync({ postId: post._id, text });
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(post._id);
  };

  return (
    <div>
      <div
        onClick={handlePostClick}
        className={cn(
          "px-4 py-3 transition-colors cursor-pointer border-b border-border bg-card",
          isThreadView && "border-none"
        )}
      >
        <div className="flex space-x-3">
          {/* Avatar */}
          <div className="shrink-0 relative flex flex-col items-center">
            <Link href={`/profile/${post.author.userName}`}>
              <Avatar
                src={post.author.avatarUrl}
                alt={post.author.userName}
                fallback={post.author.fullName || post.author.userName}
                size="md"
                className="z-10 hover:opacity-80 transition-opacity"
              />
            </Link>
            {/* Thread Connector Line */}
            {/* Show line for thread view or if there are replies in feed view 
                But hide if explicitly requested (e.g. main post in thread view)
            */}
            {/* Thread Connector Line */}
            {isThreadView && !hideConnectorLine && (
              <div className={cn(
                  "w-0.5 bg-border absolute left-1/2 -translate-x-1/2 top-10 bottom-0"
              )} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 text-sm">
                <Link 
                  href={`/profile/${post.author.userName}`}
                  className="font-bold text-foreground hover:underline"
                >
                  {post.author.userName}
                </Link>

                <span className="text-muted-foreground ml-2">
                  {formatDate(post.createdAt)}
                </span>
                {post.isEdited && (
                  <>
                    <span className="text-muted-foreground ml-1">·</span>
                    <span className="text-muted-foreground/70 text-xs ml-1">Edited</span>
                  </>
                )}

                {/* In Thread View, date is sometimes just shown next to username or omitted, 
                    user asked for "only username". Assuming just username for now. 
                    If date is needed, we can re-add it. 
                    Screenshot shows "pruebascondoriano 26m". 
                    So we should keep the date but maybe style it differently? 
                    User said "use only the username, no the full name".
                    I will keep the date as it provides context.
                */}

              </div>
              {!hideMenu && user?.id === post.author._id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-muted-foreground hover:text-primary rounded-full p-1 hover:bg-accent transition-colors cursor-pointer">
                      <MoreHorizontal size={18} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {canEdit() && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditModalOpen(true);
                        }}
                        className="cursor-pointer"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDeleteDialogOpen(true);
                      }}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Text */}
            <p className="text-foreground mt-1 whitespace-pre-wrap leading-normal text-[15px]">
              {post.text}
            </p>

            {/* Media Grid / carousel */}
            <PostMediaGrid
              media={post.media}
              data-no-thread-nav="true"
              onMediaClick={(index) => {
                setActiveMediaIndex(index);
                setIsMediaOpen(true);
              }}
            />

            <PostActions
              likesCount={post.likesCount}
              repliesCount={post.repliesCount}
              isLiked={post.isLiked}
              onReply={() => setIsReplyModalOpen(true)}
              onLike={handleLike}
            />
          </div>
        </div>
      </div>

      {/* Media viewer dialog */}
      {post.media && post.media.length > 0 && (
        <Dialog open={isMediaOpen} onOpenChange={setIsMediaOpen}>
          <DialogContent 
            fullScreen={true}
            overlayClassName="bg-black/100"
            showCloseButton={false}
          >
            <DialogTitle className="sr-only">Media viewer</DialogTitle>
            
            {/* Custom Close Button */}
            <button
               onClick={() => setIsMediaOpen(false)}
               className="absolute top-6 left-6 z-50 p-2 rounded-full bg-black/40 text-white transition-all hover:bg-black/60 cursor-pointer"
            >
                <X className="w-6 h-6" />
            </button>

            <PostMediaGrid
              media={post.media}
              activeIndex={activeMediaIndex}
              onActiveIndexChange={setActiveMediaIndex}
              isFullScreen
              className="w-full h-full"
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Reply modal */}
      <CreateThreadModal
        open={isReplyModalOpen}
        onOpenChange={setIsReplyModalOpen}
        parentPostId={post._id}
        parentPostAuthor={post.author.userName}
      />

      {/* Edit modal */}
      <EditPostModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        post={post}
        onSubmit={handleEdit}
      />

      {/* Delete confirmation */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
