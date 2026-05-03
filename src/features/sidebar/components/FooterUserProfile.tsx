"use client";

import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React from "react";
import { LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from "next-auth/react";
import { User } from "next-auth";
import { useSettings } from "@/features/settings/context/SettingsContext";

const FooterUserProfile = ({ user }: { user: User }) => {
  const { setSettingsModalOpen } = useSettings();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const DropdwonListContent = [
    {
      key: "settings",
      label: "Settings",
      icon: <Settings className="mr-2 h-4 w-4" />,
      onClick: () => {
        setSettingsModalOpen(true);
        window.location.hash = "#settings";
      },
    },
    {
      key: "logout",
      label: "Log out",
      icon: <LogOut className="mr-2 h-4 w-4" />,
      onClick: () => signOut({ callbackUrl: window.location.origin + "/login" }),
    },
  ];
  return (
    <SidebarFooter className="mt-auto p-2 ">
      <SidebarMenu>
        <SidebarMenuItem className="bg-sidebar-accent rounded-sm">
          <DropdownMenu>
            <DropdownMenuTrigger asChild id="user-menu-trigger">
              <SidebarMenuButton
                size="lg"
                className="rounded-sm transition-all data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:p-0!"
              >
                <Avatar className="h-8 w-8 rounded-lg flex shrink-0 items-center justify-center bg-sidebar-primary">
                  <AvatarFallback className="rounded-lg flex items-center justify-center">
                    {(mounted && user?.name?.charAt(0)) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold">{user?.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="min-w-[calc(var(--sidebar-width)-20px)]"
              align="start"
              side="top"
              sideOffset={4}
            >
              {DropdwonListContent.map((item) => (
                <DropdownMenuItem key={item.key} onClick={item.onClick}>
                  {item.icon}
                  <span>{item.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
};

export default FooterUserProfile;
