"use client"

import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { useState, useMemo } from "react"
import { toast } from "sonner"

export function CopyUrlButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  // If the URL starts with http://localhost, replace with window.location.origin
  // This handles the case where NEXT_PUBLIC_APP_URL was not set at build time
  const resolvedUrl = useMemo(() => {
    if (typeof window !== "undefined" && url.startsWith("http://localhost")) {
      const urlObj = new URL(url)
      return `${window.location.origin}${urlObj.pathname}`
    }
    return url
  }, [url])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resolvedUrl)
      setCopied(true)
      toast.success("URLをコピーしました")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("コピーに失敗しました")
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  )
}
