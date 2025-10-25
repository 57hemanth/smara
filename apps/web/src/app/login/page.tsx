import { LoginForm } from "@/components/login-form"
import { SharedHeader } from "@/components/shared-header"
import { SharedBackground } from "@/components/shared-background"

export default function Page() {
  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <SharedBackground />
      
      <div className="relative z-10">
        <SharedHeader currentPage="login" />
        
        <div className="flex min-h-screen items-center justify-center px-6 pt-24 pb-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
              <p className="text-gray-400">Sign in to your SMARA account</p>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
