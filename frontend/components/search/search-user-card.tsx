'use client';

import Link from 'next/link';
import { UserProfile } from '@/shared/types/auth.types';
import { Avatar } from '@/components/shared/avatar';
import { useAuthStore } from '@/store/auth.store';

interface SearchUserCardProps {
  user: UserProfile;
}

export function SearchUserCard({ user }: SearchUserCardProps) {
  const { user: currentUser } = useAuthStore();
  const isOwnProfile = currentUser?.id === user.id;

  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-white/5 transition-colors">
      <Link href={`/profile/${user.userName}`} className="flex items-center space-x-3 flex-1 min-w-0">
        <Avatar
          src={user.avatarUrl}
          alt={user.userName}
          fallback={user.userName}
          size="md"
        />
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-white truncate">{user.userName}</span>
          <span className="text-muted-foreground text-sm truncate">{user.fullName}</span>
        </div>
      </Link>
    </div>
  );
}
