"use client";

import React from "react";
import { APP_CURRENT_VERSION, APP_NAME, APP_LOGO } from "@/lib/constants";
import Link from "next/link";
import Image from "next/image";
import {
  Sidebar,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import NewChatButton from "@/features/sidebar/components/NewChatButton";
import FooterUserProfile from "./FooterUserProfile";
import { User } from "next-auth";
import ConversationList from "./ConversationList";

export function AppSidebar({
  user,
  ...props
}: { user: User | undefined } & React.ComponentProps<typeof Sidebar>) {
  const { open } = useSidebar();

  return (
    <Sidebar
      {...props}
      collapsible="icon"
      className="border-r border-sidebar-border/70 bg-sidebar"
    >
      <SidebarHeader className="gap-3 border-b border-sidebar-border/80 p-2">
        <SidebarMenu className="gap-3">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="h-auto gap-3 p-0 hover:bg-transparent"
            >
              <Link href="/c">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-sidebar-accent text-primary-foreground">
                  <Image
                    src={APP_LOGO.DARK}
                    alt={`${APP_NAME} Logo`}
                    width={22}
                    height={22}
                    className="hidden dark:block"
                  />
                  <Image
                    src={APP_LOGO.LIGHT}
                    alt={`${APP_NAME} Logo`}
                    width={22}
                    height={22}
                    className="block dark:hidden"
                  />
                </div>
                <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-semibold">{APP_NAME}</span>
                  <span className="text-xs text-muted-foreground">
                    v{APP_CURRENT_VERSION}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <NewChatButton variant="outline" size="lg" iconOnly={false} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <ConversationList open={open} />
      {user && <FooterUserProfile user={user} />}
      <SidebarRail />
    </Sidebar>
  );
}
