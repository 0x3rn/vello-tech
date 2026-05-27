import Link from "next/link"
import { Mail, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="h-10 w-10 text-primary" />
        </div>
        
        <h1 className="text-3xl font-bold text-foreground mb-4">Check your email</h1>
        <p className="text-muted-foreground mb-8">
          We&apos;ve sent you a verification link. Please check your email and click the link to verify your account.
        </p>

        <div className="space-y-4">
          <Button asChild className="w-full h-12">
            <Link href="/auth/login">
              Back to Sign In
            </Link>
          </Button>
          
          <Link 
            href="/" 
            className="inline-flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to store
          </Link>
        </div>
      </div>
    </div>
  )
}
