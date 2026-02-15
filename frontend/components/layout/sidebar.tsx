'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  Search, 
  Plus, 
  Heart, 
  User, 
  Menu,
  LogOut, 
  Sun,
  Moon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { CreateThreadModal } from '@/components/feed/create-thread-modal';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper helper = false; // dummy

  const handleLogout = async () => {
    await logout();
  };

  const menuItems = [
    { icon: Home, label: 'Home', href: '/feed' },
    { icon: Search, label: 'Search', href: '/search' },
    { icon: Plus, label: 'Create', action: () => setIsCreateModalOpen(true) },
    { icon: Heart, label: 'Likes', href: '/likes' },
    { icon: User, label: 'Profile', href: user?.userName ? `/profile/${user.userName}` : '#' },
  ];

  return (
    <>
      <aside className="hidden md:flex flex-col items-center w-24 border-r border-border py-6 sticky top-0 h-screen bg-background z-40 justify-between">
        {/* Logo */}
        <Link href="/feed">
          <div className="cursor-pointer">
            {mounted ? (
              <Image
                src={resolvedTheme === 'dark' ? "/logo-white.png" : "/logo-black.png"}
                alt="Social logo"
                width={80}
                height={80}
                className="object-contain w-[80px] h-[80px] select-none"
                priority
              />
            ) : (
               <div className="w-[80px] h-[80px]" />
            )}
          </div>
        </Link>

        {/* Navigation Icons */}
        <nav className="flex flex-col items-center space-y-8">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = item.href ? pathname === item.href : false;
            
            return (
              <Button
                key={index}
                variant="ghost"
                size="icon"
                className={`h-12 w-12 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
                title={item.label}
                onClick={item.action ? item.action : undefined}
                asChild={!!item.href}
              >
                {item.href ? (
                  <Link href={item.href}>
                    <Icon className={`size-6 ${isActive ? 'fill-current' : ''}`} />
                  </Link>
                ) : (
                  <Icon className="size-6" />
                )}
              </Button>
            );
          })}
        </nav>

        {/* Bottom Menu */}
        <div className="">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              >
                <Menu className="size-10" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mb-2">
              <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? (
                  <>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark mode</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <CreateThreadModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </>
  );
}
