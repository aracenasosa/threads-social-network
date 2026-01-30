'use client';

import { MessageSquare, Heart, Repeat2, Send } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface PostActionsProps {
  likesCount: number;
  repliesCount: number;
  repostsCount?: number;
  isLiked?: boolean;
  onLike?: () => void;
  onReply?: () => void;
  onRepost?: () => void;
  onShare?: () => void;
  className?: string;
}

export function PostActions({
  likesCount,
  repliesCount,
  repostsCount = 0,
  isLiked = false,
  onLike,
  onReply,
  onRepost,
  onShare,
  className,
}: PostActionsProps) {
  return (
    <div className={cn('flex items-center gap-10 mt-3 text-muted-foreground', className)}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onLike?.();
        }}
        className={cn(
          "group flex items-center space-x-1.5 transition-colors cursor-pointer",
          isLiked ? "text-pink-600" : "hover:text-pink-600"
        )}
      >
        <div className="p-2 rounded-full group-hover:bg-pink-500/10 transition-colors">
          <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
        </div>
        <span className={cn("text-sm group-hover:text-pink-500", isLiked && "text-pink-600")}>
          {likesCount}
        </span>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onReply?.();
        }}
        className="group flex items-center space-x-1.5 hover:text-blue-500 transition-colors cursor-pointer"
      >
        <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
          <MessageSquare size={20} />
        </div>
        <span className="text-sm group-hover:text-blue-500">{repliesCount}</span>
      </button>
    </div>
  );
}

