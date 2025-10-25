"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const apiClient = createApiClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://smara-api.hemanthyanamaddi.workers.dev",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsLoading(true)

    try {
      const response = await apiClient.createUser({
        name: formData.name,
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
      setError(err instanceof Error ? err.message : "Failed to create account")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card {...props} className="bg-gray-900/50 border-gray-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Create an account</CardTitle>
        <CardDescription className="text-gray-400">
          Enter your information below to create your account
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
              <FieldLabel htmlFor="name" className="text-gray-300">Full Name</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isLoading}
                className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-white/50 focus:ring-white/20"
              />
            </Field>
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
              <FieldDescription className="text-gray-400">
                We&apos;ll use this to contact you. We will not share your email
                with anyone else.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password" className="text-gray-300">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={isLoading}
                className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-white/50 focus:ring-white/20"
              />
              <FieldDescription className="text-gray-400">
                Must be at least 8 characters long.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password" className="text-gray-300">
                Confirm Password
              </FieldLabel>
              <Input
                id="confirm-password"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                disabled={isLoading}
                className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-500 focus:border-white/50 focus:ring-white/20"
              />
              <FieldDescription className="text-gray-400">Please confirm your password.</FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button type="submit" disabled={isLoading} className="w-full bg-white text-black hover:bg-gray-100 transition-all duration-200">
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
                <FieldDescription className="px-6 text-center text-gray-400">
                  Already have an account? <a href="/login" className="text-white hover:underline transition-colors">Sign in</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
