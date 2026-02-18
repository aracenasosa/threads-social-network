'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, Search, Plus, Heart, User } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { CreateThreadModal } from '@/components/feed/create-thread-modal';
import { cn } from '@/shared/lib/utils';

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const menuItems = [
    { icon: Home, label: 'Home', href: '/feed' },
    { icon: Search, label: 'Search', href: '/search' },
    { icon: Plus, label: 'Create', action: () => setIsCreateModalOpen(true) },
    { icon: Heart, label: 'Likes', href: '/likes' },
    { 
      icon: User, 
      label: 'Profile', 
      href: user?.userName ? `/profile/${user.userName}` : '#' 
    },
  ];

  return (
    <>
      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border sm:hidden">
        <div className="flex items-center justify-around px-2 py-2 pb-safe">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = item.href ? pathname === item.href : false;

            if (item.action) {
              // Create button (middle button with special styling)
              return (
                <Button
                  key={index}
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-12 w-12 rounded-xl transition-all duration-200",
                    "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                  onClick={item.action}
                  title={item.label}
                >
                  <Icon className="size-6" />
                </Button>
              );
            }

            return (
              <Button
                key={index}
                variant="ghost"
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                title={item.label}
                asChild
              >
                <Link href={item.href || '#'}>
                  <Icon className={cn("size-6", isActive && "fill-current")} />
                </Link>
              </Button>
            );
          })}
        </div>
      </nav>

      <CreateThreadModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </>
  );
}
