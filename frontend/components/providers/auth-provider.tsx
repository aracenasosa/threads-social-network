'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Skeleton } from '@/components/ui/skeleton';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, checkAuth, user } = useAuthStore();

  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/signup'];
  const isPublicRoute = publicRoutes.some((route) => pathname?.startsWith(route));

  useEffect(() => {
    // Only check auth if NOT on a public route
    // On public routes, skip auth check to avoid unnecessary refresh calls
    if (!isPublicRoute) {
      // Only call checkAuth if status is idle.
      // If status is 'guest', we have already checked and failed - let the redirect logic handle it.
      // If status is 'checking', we are in progress.
      // If status is 'authenticated', we are good.
      if (status === 'idle') {
        checkAuth();
      }
    } else if (status === 'idle') {
      // On public routes, if status is idle, set to guest without calling refresh
      // This prevents refresh calls on login/signup pages
      useAuthStore.setState({ status: 'guest' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isPublicRoute, status, user]); // checkAuth is stable from Zustand, so we can omit it

  useEffect(() => {
    // Wait until auth check is done
    if (status === 'checking') return;

    // If not on a public route and not authenticated, redirect to login
    if (!isPublicRoute && status === 'guest') {
      router.push('/login');
    }

    // If on a public route and is authenticated, redirect to feed
    if (isPublicRoute && status === 'authenticated') {
      router.push('/feed');
    }
  }, [pathname, status, router]);

  // Show skeleton while checking auth status to prevent flash
  if (status === 'checking') {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center space-y-4 p-8">
         <div className="w-full max-w-md space-y-4">
             {/* Header Skeleton */}
            <div className="flex items-center space-x-4">
               <Skeleton className="h-12 w-12 rounded-full" />
               <div className="space-y-2">
                 <Skeleton className="h-4 w-[200px]" />
                 <Skeleton className="h-4 w-[150px]" />
               </div>
            </div>
            {/* Content Skeleton */}
            <div className="space-y-2 pt-8">
              <Skeleton className="h-[200px] w-full rounded-xl" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[80%]" />
            </div>
         </div>
      </div>
    );
  }

  // Prevent rendering if we are about to redirect
  if (status === 'authenticated' && isPublicRoute) {
      return null; // Redirecting to feed
  }

  if (status === 'guest' && !isPublicRoute) {
      return null; // Redirecting to login
  }

  return <>{children}</>;
}

