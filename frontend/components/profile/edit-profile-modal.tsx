'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/shared/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar } from '@/components/shared/avatar';
import { useAuthStore } from '@/store/auth.store';
import { UserProfile } from '@/shared/types/auth.types';
import { Camera, MapPin, Loader2 } from 'lucide-react';
import { userService } from '@/services/user.service';
import { reverseGeocode } from '@/shared/lib/location';
import { toast } from 'sonner';
import { DiscardChangesDialog } from '@/components/shared/discard-changes-dialog';
import { Switch } from '@/components/ui/switch';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: UserProfile;
  onUpdate?: (updatedUser: UserProfile) => void;
}

export function EditProfileModal({ open, onOpenChange, userProfile, onUpdate }: EditProfileModalProps) {
  const { checkAuth, setUser } = useAuthStore();
  const [fullName, setFullName] = useState(userProfile.fullName);
  const [userName, setUserName] = useState(userProfile.userName);
  const [bio, setBio] = useState(userProfile.bio || '');
  const [location, setLocation] = useState(userProfile.location || '');
  const [showLocation, setShowLocation] = useState(userProfile.showLocation ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState(userProfile.avatarUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFullName(userProfile.fullName);
    setUserName(userProfile.userName);
    setBio(userProfile.bio || '');
    setLocation(userProfile.location || '');
    setShowLocation(userProfile.showLocation ?? true);
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

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const locationString = await reverseGeocode(latitude, longitude);
          setLocation(locationString);
          toast.success('Location set successfully');
        } catch (error: any) {
          toast.error(error.message || 'Failed to get location name');
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Failed to get your current location');
        setIsGettingLocation(false);
      }
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('userName', userName);
      formData.append('bio', bio);
      formData.append('location', location);
      formData.append('showLocation', String(showLocation));
      
      if (selectedFile) {
        formData.append('profilePhoto', selectedFile);
      }

      const { user } = await userService.updateUser(userProfile.id, formData);

      toast.success('Profile updated successfully');
      setUser(user);
      await checkAuth();
      if (onUpdate) onUpdate(user);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
      console.error('Update profile error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges = fullName !== userProfile.fullName ||
                     userName !== userProfile.userName ||
                     bio !== (userProfile.bio || '') ||
                     location !== (userProfile.location || '') ||
                     showLocation !== (userProfile.showLocation ?? true) ||
                     selectedFile !== null;

  const handleCloseAttempt = (e?: Event) => {
    if (e) e.preventDefault();
    if (hasChanges && !isSubmitting) {
      setShowDiscardDialog(true);
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[425px] bg-card border-border text-foreground rounded-3xl overflow-hidden p-0"
        onInteractOutside={handleCloseAttempt}
        onEscapeKeyDown={handleCloseAttempt}
      >
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

                    <div className="space-y-3">
                        <Label className="text-sm font-bold">Location</Label>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <span className={cn(
                                        "text-sm break-words whitespace-normal",
                                        !location && "text-muted-foreground italic"
                                    )}>
                                        {location || 'No location set'}
                                    </span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleGetLocation}
                                    disabled={isGettingLocation}
                                    className="h-8 rounded-full border-zinc-300 dark:border-zinc-600 font-semibold cursor-pointer"
                                >
                                    {isGettingLocation ? (
                                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                    ) : null}
                                    {location ? 'Update' : 'Set location'}
                                </Button>
                            </div>
                            
                            {location && (
                                <div className="flex items-center justify-between py-2 border-t border-border">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">Show on profile</span>
                                        <span className="text-xs text-muted-foreground">Make your location visible to others</span>
                                    </div>
                                    <Switch
                                        checked={showLocation}
                                        onCheckedChange={setShowLocation}
                                    />
                                </div>
                            )}
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
                className="w-full bg-transparent border border-zinc-300 dark:border-zinc-600 text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl h-12 font-bold transition-all disabled:opacity-50 cursor-pointer"
                disabled={isSubmitting}
            >
                {isSubmitting ? 'Updating...' : 'Done'}
            </Button>
        </div>
      </DialogContent>

      <DiscardChangesDialog
        open={showDiscardDialog}
        onOpenChange={setShowDiscardDialog}
        onConfirm={() => onOpenChange(false)}
        title="Discard changes?"
        description="You have unsaved changes in your profile. Are you sure you want to discard them?"
      />
    </Dialog>
  );
}
