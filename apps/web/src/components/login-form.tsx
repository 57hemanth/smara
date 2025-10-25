"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createApiClient } from "@smara/api-client"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const apiClient = createApiClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://smara-api.hemanthyanamaddi.workers.dev",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await apiClient.login({
        email: formData.email,
        password: formData.password,
      })

      // Store JWT token and user info in localStorage
      localStorage.setItem("smara_token", response.token)
      localStorage.setItem("smara_user_id", response.user.id)
      localStorage.setItem("smara_user", JSON.stringify(response.user))

      // Redirect to search page
      router.push("/search")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Login to your account</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {error && (
                <div className="rounded-md bg-red-900/20 border border-red-500/30 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}
              <Field>
                <FieldLabel htmlFor="email" className="text-gray-300">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isLoading}
                  className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-white/50 focus:ring-white/20"
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password" className="text-gray-300">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm text-gray-400 underline-offset-4 hover:underline hover:text-white transition-colors"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={isLoading}
                  className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-white/50 focus:ring-white/20"
                />
              </Field>
              <Field>
                <Button type="submit" disabled={isLoading} className="w-full bg-white text-black hover:bg-gray-100 transition-all duration-200">
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
                <FieldDescription className="text-center text-gray-400">
                  Don&apos;t have an account? <a href="/signup" className="text-white hover:underline transition-colors">Sign up</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
