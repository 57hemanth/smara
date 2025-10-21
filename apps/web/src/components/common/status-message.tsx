"use client"

interface StatusMessageProps {
  message: string
}

export function StatusMessage({ message }: StatusMessageProps) {
  const getStatusStyle = () => {
    if (message.includes("Error")) {
      return "bg-red-50 text-red-700 border border-red-200"
    } else if (message.includes("✅")) {
      return "bg-green-50 text-green-700 border border-green-200"
    } else {
      return "bg-accent text-accent-foreground border border-accent"
    }
  }

  return (
    <div className={`p-4 rounded-lg text-sm animate-in fade-in slide-in-from-top-2 ${getStatusStyle()}`}>
      {message}
    </div>
  )
}

