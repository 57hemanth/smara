"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { apiClient, FoldersResponse } from "@/lib/api"
import { 
  Search, 
  Upload, 
  Folder, 
  Clock, 
  Settings, 
  LogOut,
  Sparkles,
  Home
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

// Navigation items for SMARA
const data = {
  navMain: [
    {
      title: "Search",
      url: "/search",
      icon: Search,
    },
    {
      title: "Upload",
      url: "/upload",
      icon: Upload,
    },
    {
      title: "Recent",
      url: "/recent",
      icon: Clock,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const isRouteActive = (url: string) => pathname === url || pathname.startsWith(url + "/")
  const searchParams = useSearchParams()
  const activeFolderId = searchParams.get("id")
  const [foldersResponse, setFoldersResponse] = useState<FoldersResponse>({
    success: false,
    folders: []
  })

  const handleLogout = () => {
    localStorage.removeItem("smara_user_id")
    localStorage.removeItem("smara_token")
    window.location.href = "/login"
  }

  const getFolders = async () => {
    const response = await apiClient.getFolders()
    console.log('response')
    console.log(response)
    setFoldersResponse({
      success: true,
      folders: response
    })
  }

  useEffect(() => {
    getFolders()
  }, [])

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <img src="/logo.png" alt="SMARA Logo" className="w-6 h-6" />
          <h1 className="text-lg font-bold text-primary">
            SMARA
          </h1>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain.map((item) => {
                const Icon = item.icon
                const isActive = isRouteActive(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url} className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Folders Section */}
        <SidebarGroup>
          <div className="flex items-center justify-between pr-1">
            <SidebarGroupLabel>Folders</SidebarGroupLabel>
            <Link href="/folders" className="text-xs text-primary hover:text-primary/80 hover:underline">
              View All
            </Link>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {foldersResponse.folders.length > 0 ? (
                foldersResponse.folders.map((folder) => {
                  const isActive = pathname.startsWith("/folders/view") && activeFolderId === folder.id
                  return (
                    <SidebarMenuItem key={folder.id}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={`/folders/view/?id=${folder.id}`} className="flex items-center gap-2">
                          <Folder className="w-4 h-4" />
                          <span>{folder.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4" />
                      <span>No folders yet</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Secondary Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navSecondary.map((item) => {
                const Icon = item.icon
                const isActive = isRouteActive(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url} className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  )
}
