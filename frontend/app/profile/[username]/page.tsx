'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuthStore } from '@/store/auth.store';
import { userService } from '@/services/user.service';
import { useFeed } from '@/shared/hooks/use-feed';
import { PostCard } from '@/components/feed/post-card';
import { Avatar } from '@/components/shared/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useInView } from 'react-intersection-observer';
import { 
  Dialog,   DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from '@/components/ui/dialog';
import { EditProfileModal } from '@/components/profile/edit-profile-modal';
import { CreateThreadModal } from '@/components/feed/create-thread-modal';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

import { QUERY_KEYS } from '@/shared/lib/query-keys';

type TabType = 'threads' | 'replies' | 'media' | 'reposts';

export default function ProfilePage() {
  const params = useParams();
  const userName = params.username as string;
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('threads');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImageFullViewOpen, setIsImageFullViewOpen] = useState(false);
  const { ref, inView } = useInView();

  const { data: userData, isLoading: isUserLoading, refetch: refetchUser } = useQuery({
    queryKey: QUERY_KEYS.user(userName),
    queryFn: () => userService.getUserByUsername(userName),
    enabled: !!userName,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
  });

  const profileUser = userData?.user;
  const isOwnProfile = currentUser?.id === profileUser?.id;

  const { 
    data: feedData, 
    isLoading: isFeedLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useFeed(10, profileUser?.id, activeTab === 'replies' ? 'replies' : 'threads');

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const feedItems = feedData?.pages.flatMap(page => page.items) || [];

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 max-w-2xl mx-auto border-x border-border p-4 pt-10">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-20 w-20 rounded-full" />
          </div>
          <Skeleton className="h-10 w-full rounded-xl mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-xl font-bold">User not found</p>
            <Button onClick={() => window.history.back()}>Go back</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <main className="flex-1 flex flex-col max-w-2xl mx-auto border-x border-border overflow-hidden mt-10 rounded-t-3xl pb-20 md:pb-0" style={{ backgroundColor: 'rgb(24, 24, 24)' }}>
        {/* Profile Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white truncate">{profileUser.fullName}</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-white">{profileUser.userName}</span>
              </div>
            </div>
            <Avatar 
                src={profileUser.avatarUrl} 
                alt={profileUser.userName}
                fallback={profileUser.userName} 
                className="w-20 h-20 border border-white/10" 
                onClick={profileUser.avatarUrl ? () => setIsImageFullViewOpen(true) : undefined}
            />
          </div>

          <div className="mt-4 flex flex-col space-y-4">
            {profileUser.bio ? (
              <p className="text-[15px] text-white whitespace-pre-wrap">{profileUser.bio}</p>
            ) : (
               <p className="text-[15px] text-white/50 italic">No bio yet.</p>
            )}
          </div>

          {isOwnProfile && (
            <Button 
                variant="outline" 
                className="w-full mt-6 rounded-xl border-white/20 hover:bg-white/5 text-white font-semibold h-10"
                onClick={() => setIsEditModalOpen(true)}
            >
                Edit profile
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 mt-2">
            {(['threads', 'replies', 'media', 'reposts'] as TabType[]).map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                        "flex-1 py-3 text-sm font-semibold transition-colors relative",
                        activeTab === tab ? "text-white" : "text-muted-foreground"
                    )}
                >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {activeTab === tab && (
                        <div className="absolute bottom-0 left-0 w-full h-[1.5px] bg-white transition-all" />
                    )}
                </button>
            ))}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {(activeTab === 'threads' || activeTab === 'replies') && (
                <>
                    {isOwnProfile && activeTab === 'threads' && (
                        <div className="p-4 border-b border-white/10">
                            <div className="flex space-x-3 items-center">
                                <Avatar
                                    src={currentUser?.avatarUrl}
                                    alt={currentUser?.userName || ''}
                                    fallback={currentUser?.userName || ''}
                                    size="md"
                                />
                                <div className="flex-1">
                                    <div
                                        className="w-full text-muted-foreground text-left font-normal py-3 px-2 rounded-full cursor-pointer hover:bg-white/5 transition-colors select-none"
                                        onClick={() => setIsCreateModalOpen(true)}
                                    >
                                        What&apos;s new?
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    className="rounded-full bg-white/10 text-foreground hover:bg-white/20 px-6 font-semibold"
                                    onClick={() => setIsCreateModalOpen(true)}
                                >
                                    Post
                                </Button>
                            </div>
                        </div>
                    )}
                    
                    <div className="divide-y divide-white/10">
                        {feedItems.length > 0 ? (
                            feedItems.map((post: any) => (
                                <div key={post._id} className="border-b border-white/5">
                                    <PostCard post={post} />
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center text-muted-foreground">
                                {isFeedLoading ? 'Loading...' : `No ${activeTab} yet.`}
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
                </>
            )}

            {activeTab !== 'threads' && activeTab !== 'replies' && (
                <div className="p-12 text-center text-muted-foreground">
                    Nothing here yet.
                </div>
            )}
        </div>
      </main>

      <EditProfileModal 
        open={isEditModalOpen} 
        onOpenChange={setIsEditModalOpen} 
        userProfile={profileUser!}
        onUpdate={() => {
          refetchUser();
          queryClient.invalidateQueries({ queryKey: ['feed'] });
        }}
      />

      <CreateThreadModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />

      <Dialog open={isImageFullViewOpen} onOpenChange={setIsImageFullViewOpen}>
        <DialogContent 
            className="max-w-none border-none bg-transparent p-0 shadow-none overflow-visible flex items-center justify-center h-screen w-screen"
            showCloseButton={false}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Profile Picture</DialogTitle>
            <DialogDescription>Full view of {profileUser.fullName}&apos;s profile picture</DialogDescription>
          </DialogHeader>
          
          <button 
                onClick={() => setIsImageFullViewOpen(false)}
                className="fixed top-4 left-4 z-[60] h-10 w-10 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors cursor-pointer border-2 border-white"
                aria-label="Close"
          >
              <X className="h-5 w-5" />
          </button>

          <div className="relative aspect-square w-[min(85vh,90vw)] max-w-[600px] rounded-full overflow-hidden border-2 border-white/10 shadow-2xl">
            <Image 
              src={profileUser.avatarUrl || ''} 
              alt={profileUser.userName} 
              fill 
              sizes="100vw"
              className="object-cover object-top"
              priority
              unoptimized
              referrerPolicy="no-referrer"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
