"use client"

import { ReactNode } from "react"
import { Loader2, LucideIcon } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/use-auth"

interface PageLayoutProps {
  children: ReactNode
  title?: string
  icon?: LucideIcon
  headerContent?: ReactNode
  showHeader?: boolean
}

export function PageLayout({ 
  children, 
  title, 
  icon: Icon,
  headerContent,
  showHeader = true
}: PageLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {showHeader && (
          <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4">
            {headerContent ? (
              // Custom header content (should include its own SidebarTrigger if needed)
              headerContent
            ) : (
              // Default header with SidebarTrigger and title
              <>
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                {title && (
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-5 h-5 text-blue-600" />}
                    <h1 className="text-lg font-semibold">{title}</h1>
                  </div>
                )}
              </>
            )}
          </header>
        )}
        <div className="flex flex-1 flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

