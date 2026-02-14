"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import { clearUserCache } from "@/lib/cache-utils";

import { LogOut, Settings, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useAvatarStore from "@/store/useAvatarStore";
import { BillingModal } from "@/components/modals/BillingModal";

type Props = {
  avatar: string;
  userId: string;
  name: string;
  email: string;
};

const AvatarDropdown = ({ avatar, userId, name, email }: Props) => {
  const router = useRouter();
  const setAvatar = useAvatarStore((state) => state.setAvatar);
  const getAvatar = useAvatarStore((state) => state.avatar);
  const [newAvatar, setNewAvatar] = useState(getAvatar);
  const [isBillingOpen, setIsBillingOpen] = useState(false);

  useEffect(() => {
    setAvatar(avatar);
  }, [avatar, setAvatar]);

  useEffect(() => {
    setNewAvatar(getAvatar);
  }, [getAvatar]);

  //console.log(newAvatar, "newAvatar");
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar>
            <AvatarImage
              src={
                newAvatar
                  ? newAvatar
                  : `${process.env.NEXT_PUBLIC_APP_URL}/images/nouser.png`
              }
            />
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="space-y-1">
            <div>{name}</div>
            <div className="text-xs text-gray-500">{email}</div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => router.push(`/crm/dashboard`)}
          >
            Sales Dashboard
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsBillingOpen(true)}>
            <CreditCard className="w-4 h-4 inline-block mr-2 stroke-current text-gray-500" />
            <span>Billing & Payments</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/profile")}>
            <Settings className="w-4 h-4 inline-block mr-2 stroke-current text-gray-500" />
            <span>Profile Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => {
            clearUserCache();
            signOut({ callbackUrl: `/sign-in?loggedOut=true` });
          }}>
            <LogOut className="w-4 h-4 inline-block mr-2 stroke-current text-gray-500" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <BillingModal
        isOpen={isBillingOpen}
        onClose={() => setIsBillingOpen(false)}
      />
    </>
  );
};

export default AvatarDropdown;
