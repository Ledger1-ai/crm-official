"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "@prisma/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

import useAvatarStore from "@/store/useAvatarStore";

interface ProfileFormProps {
  data: Users;
}

export function ProfilePhotoForm({ data }: ProfileFormProps) {
  const [avatar, setAvatar] = useState(data.avatar || "");
  const [isUploading, setIsUploading] = useState(false);

  const { toast } = useToast();
  const router = useRouter();
  const setAvatarStore = useAvatarStore((state) => state.setAvatar);

  useEffect(() => {
    setAvatar(data.avatar || "");
  }, [data.avatar]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please select an image file.",
        duration: 5000,
      });
      return;
    }

    // Validate file size (4MB)
    if (file.size > 4 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please select an image smaller than 4MB.",
        duration: 5000,
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/profile/upload-photo', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload photo');
      }

      setAvatar(result.avatar);
      setAvatarStore(result.avatar);

      toast({
        title: "Profile photo updated",
        description: "Your profile photo has been updated successfully.",
        duration: 5000,
      });

      router.refresh();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Error updating profile photo",
        description: error.message || "There was an error updating your profile photo.",
        duration: 5000,
      });
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-5">
      <div>
        <Avatar className="h-24 w-24">
          <AvatarImage src={avatar || "/images/nouser.png"} alt="avatar" />
          <AvatarFallback>
            {data.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="flex flex-col gap-2">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
          id="profile-photo-input"
        />
        <label htmlFor="profile-photo-input">
          <Button
            type="button"
            disabled={isUploading}
            onClick={() => document.getElementById('profile-photo-input')?.click()}
            className="cursor-pointer"
          >
            {isUploading ? 'Uploading...' : 'Upload Photo'}
          </Button>
        </label>
        <p className="text-sm text-muted-foreground">
          Images will be resized to 500x500px. Max size: 4MB
        </p>
      </div>
    </div>
  );
}
