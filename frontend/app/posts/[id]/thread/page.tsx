'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuthStore } from '@/store/auth.store';
import { postService } from '@/services/post.service';
import { CreateThreadModal } from '@/components/feed/create-thread-modal';
import { PostCard } from '@/components/feed/post-card';
import { Avatar } from '@/components/shared/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

import { QUERY_KEYS } from '@/shared/lib/query-keys';

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const threadId = params.id as string;

  const { data: post, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.thread(threadId),
    queryFn: () => postService.getThread(threadId),
    enabled: !!threadId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const replies = post?.replies || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 flex flex-col max-w-2xl mx-auto border-x border-border min-h-screen p-4 space-y-4">
           <Skeleton className="h-40 w-full rounded-xl" />
           <Skeleton className="h-20 w-full rounded-xl" />
           <Skeleton className="h-20 w-full rounded-xl" />
        </main>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-destructive">
          <p className="font-bold text-xl">{'Post not found'}</p>
          <button onClick={() => router.back()} className="mt-4 text-primary hover:underline">
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <main className="flex-1 flex flex-col max-w-2xl mx-auto border-x border-border overflow-hidden mt-10 rounded-4xl pb-20 md:pb-0" style={{ backgroundColor: 'rgb(24, 24, 24)' }}>
        {/* Header */}
        <div className="sticky top-0 z-50 border-b border-white/10 px-4 h-14 flex items-center justify-between" style={{ backgroundColor: 'rgb(24, 24, 24)' }}>
          <button 
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors"
          >
              <ArrowLeft className="w-5 h-5 text-gray-100" />
          </button>
          <span className="font-bold text-base text-gray-100">Thread</span>
          <div className="w-9" /> {/* Spacer to balance back button */}
        </div>

        <div className="flex-1">
          {/* Main Post */}
          <div className="px-4 pt-4">
             <PostCard post={post} isThreadView={true} hideConnectorLine={true} />
          </div>

          {/* Divider with replies count */}
          <div className="px-4 py-2 flex items-center justify-between text-sm text-gray-500 border-b border-white/10">
             <span>Replies</span>
             {/* Removed 'View activity' as requested */}
          </div>

          {/* Reply Input Area (Compact) */}
          <div className="p-4 border-b border-white/10 flex items-center space-x-3 cursor-pointer" onClick={() => setIsReplyModalOpen(true)}>
            <Avatar 
              src={user?.avatarUrl} 
              alt={user?.userName || ''} 
              fallback={user?.userName || ''} 
              size="sm" 
            />
            <div className="flex-1 text-gray-500 text-sm">
               Reply to {post.author.userName}...
            </div>
            <Button size="sm" variant="ghost" className="h-8">Post</Button>
          </div>

          {/* Replies */}
          <div className="pb-10">
            {replies.length > 0 ? (
              replies.map((reply) => (
                <div key={reply._id} className="relative">
                   <PostCard post={reply} isThreadView={true} />
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500 text-sm">
                No replies yet.
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Reply Modal */}
      <CreateThreadModal
        open={isReplyModalOpen}
        onOpenChange={setIsReplyModalOpen}
        parentPostId={post._id}
        parentPostAuthor={post.author.userName}
      />
    </div>
  );
}
