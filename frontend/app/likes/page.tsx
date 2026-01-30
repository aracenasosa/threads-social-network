'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { PostCard } from '@/components/feed/post-card';
import { useFeed } from '@/shared/hooks/use-feed';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';

export default function LikesPage() {
  const { 
    data, 
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useFeed(10, undefined, undefined, true);

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const likedItems = data?.pages.flatMap(page => page.items) || [];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 flex flex-col max-w-2xl mx-auto border-x border-border overflow-hidden mt-10 rounded-t-3xl pb-20 md:pb-0" style={{ backgroundColor: 'rgb(24, 24, 24)' }}>
        <div className="px-6 py-4 border-b border-white/10">
          <h1 className="text-xl font-bold text-white">Likes</h1>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="divide-y divide-white/10">
            {likedItems.length > 0 ? (
              likedItems.map((post: any) => (
                <div key={post._id} className="border-b border-white/5">
                  <PostCard post={post} />
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                {isLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                  </div>
                ) : (
                  'No liked posts yet.'
                )}
              </div>
            )}
            
            {hasNextPage && (
              <div ref={ref} className="p-4 flex justify-center h-10">
                {isFetchingNextPage && (
                  <div className="space-y-3 w-full">
                    <div className="flex space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
