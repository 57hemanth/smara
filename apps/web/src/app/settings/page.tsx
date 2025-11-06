"use client";

import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Mail, User } from "lucide-react";
import { PageLayout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface UserData {
  id: string;
  email: string;
  name?: string;
}

export default function SettingsPage() {
  useAuth(); // Handles authentication
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    // Load user data from localStorage
    const storedUser = localStorage.getItem("smara_user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserData(user);
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }
  }, []);

  return (
    <PageLayout title="Settings" icon={SettingsIcon}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Settings
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Manage your account settings and preferences
            </p>
          </div>

          <Separator />

          {/* Account Information Card */}
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Account Information
              </CardTitle>
              <CardDescription>
                View your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Section */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Mail className="w-4 h-4 text-primary" />
                  Email Address
                </label>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-900 dark:text-white font-medium">
                    {userData?.email || "Loading..."}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This is the email address associated with your SMARA account
                </p>
              </div>

              {/* User ID Section (for reference) */}
              {userData?.id && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    User ID
                  </label>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <code className="text-xs text-slate-600 dark:text-slate-400 break-all">
                      {userData.id}
                    </code>
                  </div>
                </div>
              )}

              {/* Future Update Notice */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                  ℹ️ Email update functionality will be available soon
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Placeholder for future settings sections */}
          <Card className="border-slate-200 dark:border-slate-700 shadow-sm opacity-60">
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Customize your SMARA experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Coming soon...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}

