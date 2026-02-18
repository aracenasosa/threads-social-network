"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { PostCard } from "@/components/feed/post-card";
import { PostButton } from "@/components/shared/post-button";
import { CreateThreadModal } from "@/components/feed/create-thread-modal";
import { Avatar } from "@/components/shared/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";

import { useInView } from "react-intersection-observer";
import { Plus } from 'lucide-react';

import { useTheme } from "next-themes";
import { useFeed } from "@/shared/hooks/use-feed";

import { MobileNav } from "@/components/layout/mobile-nav";

export default function FeedPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useFeed(10);
  const { ref, inView } = useInView();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Load more when scrolling to the bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && !isError) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, isError]);



  // Flatten all pages into a single array
  const posts = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="min-h-screen bg-background flex flex-col sm:flex-row">
      <Sidebar />

      {/* Mobile Top Navigation */}
      <MobileNav />

      {/* Main Content Area */}
      <main
        className="flex-1 flex flex-col w-full sm:max-w-2xl sm:mx-4 md:mx-auto md:mr-[50px] lg:mr-auto sm:border sm:border-border overflow-hidden sm:mt-10 sm:rounded-4xl bg-card pb-20 sm:pb-0"
      >
        {/* Create Post Input - Hidden on Mobile */}
        <div
          className="hidden sm:flex p-4 border-b border-border bg-card"
        >
          <div className="flex space-x-3 items-center w-full">
            <Avatar
              src={user?.avatarUrl}
              alt={user?.userName || ""}
              fallback={user?.userName || ""}
              size="md"
            />
            <div className="flex-1">
              <div
                className="w-full text-muted-foreground text-left font-normal py-3 px-2 rounded-full transition-colors select-none cursor-text"
                onClick={() => setIsCreateModalOpen(true)}
              >
                What&apos;s new?
              </div>
            </div>
            <PostButton
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 font-semibold"
            >
              Post
            </PostButton>
          </div>
        </div>

        {/* Feed Items */}
        <div className="flex-1">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex space-x-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[80%]" />
                    </div>
                  </div>
                  <Skeleton className="h-[200px] w-full rounded-xl" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="p-8 text-center">
              <div className="text-destructive font-semibold mb-2">
                Failed to load feed
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                {error instanceof Error
                  ? error.message
                  : "An unexpected error occurred"}
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No posts found. Be the first to post!
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}

              {/* Infinite scroll trigger */}
              <div ref={ref} className="h-10 flex items-center justify-center">
                {isFetchingNextPage && (
                  <div className="p-4 space-y-3 w-full">
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
            </>
          )}
        </div>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />

      {/* Floating Create Button - Tablet Only */}
      <button
        onClick={() => setIsCreateModalOpen(true)}
        className="hidden sm:flex lg:hidden fixed bottom-6 right-6 h-14 w-14 rounded-2xl bg-primary text-primary-foreground items-center justify-center shadow-lg hover:bg-primary/90 transition-all z-50"
      >
        <Plus className="h-6 w-6" />
      </button>

      <CreateThreadModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
}
