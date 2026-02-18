'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { ArrowLeft, Menu, Moon, Sun, LogOut } from 'lucide-react';
import Image from 'next/image';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';

interface MobileNavProps {
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export function MobileNav({ showBackButton = false, onBackClick }: MobileNavProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      router.back();
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <nav className="w-full sm:hidden sticky top-0 z-50 bg-card border-b border-border h-14 flex items-center justify-between px-4">
      {/* Left: Back Button (conditional) */}
      <div className="w-10">
        {showBackButton && (
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
      </div>

      {/* Center: Logo */}
      <div className="flex-1 flex justify-center">
        <Link href="/feed">
          <Image
            src="/logo-white.png"
            alt="Logo"
            width={78}
            height={78}
            className="dark:block hidden"
          />
          <Image
            src="/logo-black.png"
            alt="Logo"
            width={78}
            height={78}
            className="dark:hidden block"
          />
        </Link>
      </div>

      {/* Right: Menu Button */}
      <div className="w-10 flex justify-end">
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <button className="p-2 rounded-full hover:bg-accent transition-colors">
              <Menu className="w-5 h-5 text-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="flex flex-col gap-4 mt-8">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                onClick={() => {
                  toggleTheme();
                  setIsMenuOpen(false);
                }}
                className="w-full justify-start text-base font-normal"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="mr-3 h-5 w-5" />
                    Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="mr-3 h-5 w-5" />
                    Dark Mode
                  </>
                )}
              </Button>

              {/* Logout */}
              <Button
                variant="ghost"
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="w-full justify-start text-base font-normal text-destructive hover:text-destructive"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
