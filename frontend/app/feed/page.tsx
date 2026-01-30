'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { PostCard } from '@/components/feed/post-card';
import { CreateThreadModal } from '@/components/feed/create-thread-modal';
import { Avatar } from '@/components/shared/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Sidebar } from '@/components/layout/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
} from '@/components/ui/sheet';
import { useInView } from 'react-intersection-observer';
import { 
  Moon, 
  Sun, 
  LogOut, 
  Home, 
  Search, 
  Plus, 
  Heart, 
  User, 
  Menu,
  ChevronDown,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useFeed } from '@/shared/hooks/use-feed';
import Link from 'next/link';

export default function FeedPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } = useFeed(10);
  const { ref, inView } = useInView();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [menuSection, setMenuSection] = useState<'root' | 'appearance'>('root');

  // Load more when scrolling to the bottom
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Flatten all pages into a single array
  const posts = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />




      {/* Main Content Area */}
      <main className="flex-1 flex flex-col max-w-2xl mx-auto border-x border-border overflow-hidden mt-10 
      rounded-4xl" style={{ backgroundColor: 'rgb(24, 24, 24)' }}>
        {/* Create Post Input */}
        <div className="p-4 border-b border-white/10" style={{ backgroundColor: 'rgb(24, 24, 24)' }}>
          <div className="flex space-x-3 items-center">
            <Avatar
              src={user?.avatarUrl}
              alt={user?.userName || ''}
              fallback={user?.userName || ''}
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
            <Button
              variant="ghost"
              className="rounded-full bg-white/10 text-foreground hover:bg-white/20 px-6 font-semibold"
              onClick={() => setIsCreateModalOpen(true)}
            >
              Post
            </Button>
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
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
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

      {/* Floating Create Button (Mobile) */}
      <Button
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg md:hidden z-50"
        onClick={() => setIsCreateModalOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Mobile menu drawer */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed bottom-6 left-6 h-12 w-12 rounded-full border border-border bg-background/80 shadow-md md:hidden z-50"
            title="Menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" onOpenAutoFocus={() => setMenuSection('root')}>
          {menuSection === 'root' ? (
            <>
              <SheetHeader>
                <SheetTitle className="text-base">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 px-2 py-2">
                <Button
                  variant="ghost"
                  className="justify-between px-3 py-4"
                  onClick={() => setMenuSection('appearance')}
                >
                  <span className="text-sm font-medium">Appearance</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </Button>
                <Button variant="ghost" className="justify-start px-3 py-4 text-sm">
                  Insights
                </Button>
                <Button variant="ghost" className="justify-start px-3 py-4 text-sm">
                  Settings
                </Button>
                <Button variant="ghost" className="justify-start px-3 py-4 text-sm">
                  Feeds
                </Button>
                <Button variant="ghost" className="justify-start px-3 py-4 text-sm">
                  Saved
                </Button>
                <Button variant="ghost" className="justify-start px-3 py-4 text-sm">
                  Liked
                </Button>
                <Button variant="ghost" className="justify-start px-3 py-4 text-sm">
                  Report a problem
                </Button>
              </div>
              <SheetFooter>
                <Button
                  variant="ghost"
                  className="justify-start text-destructive"
                  onClick={handleLogout}
                >
                  Log out
                </Button>
              </SheetFooter>
            </>
          ) : (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3 px-2 pt-2">
                  <button
                    type="button"
                    className="rounded-full p-1 hover:bg-accent"
                    onClick={() => setMenuSection('root')}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <SheetTitle className="text-base">Appearance</SheetTitle>
                </div>
              </SheetHeader>
              <div className="flex flex-col gap-4 px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Dark mode</span>
                    <span className="text-xs text-muted-foreground">
                      Toggle between light and dark themes.
                    </span>
                  </div>
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                  />
                </div>
              </div>
            </>
          )}
        </SheetContent>

      </Sheet>

      <CreateThreadModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </div>
  );
}
