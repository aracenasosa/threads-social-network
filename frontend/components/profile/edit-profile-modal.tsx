'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/shared/avatar';
import { useAuthStore } from '@/store/auth.store';
import { UserProfile } from '@/shared/types/auth.types';
import { Camera, Lock } from 'lucide-react';
import apiClient from '@/shared/lib/axios';
import { toast } from 'sonner';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: UserProfile;
  onUpdate?: (updatedUser: UserProfile) => void;
}

export function EditProfileModal({ open, onOpenChange, userProfile, onUpdate }: EditProfileModalProps) {
  const { checkAuth } = useAuthStore();
  const [fullName, setFullName] = useState(userProfile.fullName);
  const [userName, setUserName] = useState(userProfile.userName);
  const [bio, setBio] = useState(userProfile.bio || '');
  const [location, setLocation] = useState(userProfile.location || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState(userProfile.avatarUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFullName(userProfile.fullName);
    setUserName(userProfile.userName);
    setBio(userProfile.bio || '');
    setLocation(userProfile.location || '');
    setPreviewAvatar(userProfile.avatarUrl);
  }, [userProfile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('userName', userName);
      formData.append('bio', bio);
      formData.append('location', location);
      
      if (selectedFile) {
        formData.append('profilePhoto', selectedFile);
      }

      const { data } = await apiClient.patch<{ user: UserProfile }>(
        `/users/update/${userProfile.id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      toast.success('Profile updated successfully');
      await checkAuth(); // Refresh global auth state
      if (onUpdate) onUpdate(data.user);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Update failed:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground rounded-3xl overflow-hidden p-0">
        <DialogHeader className="p-6 pb-2">
            <DialogTitle className="sr-only">Edit Profile</DialogTitle>
            <div className="flex justify-between items-start">
                <div className="space-y-4 flex-1">
                    <div className="space-y-1">
                        <Label htmlFor="name" className="text-sm font-bold">Name</Label>
                        <div className="relative group">
                            <Input
                                id="name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="bg-transparent border-none p-0 h-auto text-base text-foreground focus-visible:ring-0 placeholder:text-muted-foreground"
                                placeholder="+ Name"
                            />
                            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-border" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="username" className="text-sm font-bold">Username</Label>
                        <div className="relative group">
                            <Input
                                id="username"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                className="bg-transparent border-none p-0 h-auto text-base text-foreground focus-visible:ring-0 placeholder:text-muted-foreground"
                                placeholder="+ Username"
                            />
                            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-border" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="bio" className="text-sm font-bold">Bio</Label>
                        <div className="relative">
                            <Textarea
                                id="bio"
                                placeholder="+ Write bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                className="bg-transparent border-none p-0 h-auto text-base text-foreground focus-visible:ring-0 resize-none min-h-[20px] placeholder:text-muted-foreground"
                            />
                            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-border" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="location" className="text-sm font-bold">Location</Label>
                        <div className="relative">
                            <Input
                                id="location"
                                placeholder="+ Add location"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="bg-transparent border-none p-0 h-auto text-base text-foreground focus-visible:ring-0 placeholder:text-muted-foreground"
                            />
                            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-border" />
                        </div>
                    </div>
                </div>

                <div 
                    className="relative cursor-pointer group ml-4"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Avatar 
                        src={previewAvatar} 
                        alt={userName}
                        fallback={userName} 
                        size="lg" 
                        className="w-16 h-16 border border-border" 
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={20} />
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange} 
                    />
                </div>
            </div>
        </DialogHeader>

        <div className="p-6 pt-2">
            <Button 
                onClick={handleSubmit} 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl h-12 font-bold transition-all disabled:opacity-50 cursor-pointer"
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Updating...' : 'Done'}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
