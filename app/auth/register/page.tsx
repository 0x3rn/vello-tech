"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, sendEmailVerification } from "firebase/auth"
import { syncCartWithFirestore } from "@/lib/store/cart-sync"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Loader2, Check } from "lucide-react"
import { toast } from "sonner"

const getAuthErrorMessage = (err: any) => {
  const code = err.code || ""
  if (code === "auth/email-already-in-use") {
    return "An account with this email already exists."
  }
  if (code === "auth/weak-password") {
    return "Password is too weak. Please use a stronger password."
  }
  if (code === "auth/invalid-email") {
    return "Invalid email format."
  }
  if (code === "auth/network-request-failed") {
    return "Network error. Please check your connection."
  }
  return "An unexpected error occurred. Please try again."
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const passwordRequirements = [
    { met: password.length >= 8, text: "At least 8 characters" },
    { met: /[A-Z]/.test(password), text: "One uppercase letter" },
    { met: /[0-9]/.test(password), text: "One number" },
  ]

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!passwordRequirements.every(r => r.met)) {
      setError("Password does not meet requirements")
      return
    }

    setLoading(true)

    try {
      const previousUid = auth.currentUser?.uid
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(userCredential.user, { displayName: fullName })
      
      if (previousUid !== userCredential.user.uid) {
        await syncCartWithFirestore(userCredential.user)
      }
      
      // Explicitly set the session cookie
      const idToken = await userCredential.user.getIdToken(true)
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })

      await sendEmailVerification(userCredential.user)
      toast.success("Account created! Please check your email (and spam folder) for the verification link.")
    } catch (err: any) {
      setError(getAuthErrorMessage(err))
      setLoading(false)
      return
    }

    router.push("/auth/verify")
  }

  const handleGoogleRegister = async () => {
    setError(null)
    setLoading(true)
    const provider = new GoogleAuthProvider()
    
    try {
      const previousUid = auth.currentUser?.uid
      const userCredential = await signInWithPopup(auth, provider)
      
      if (previousUid !== userCredential.user.uid) {
        await syncCartWithFirestore(userCredential.user)
      }

      // Explicitly set the session cookie before redirecting
      const idToken = await userCredential.user.getIdToken(true)
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })

      router.push("/account")
      router.refresh()
    } catch (err: any) {
      setError(getAuthErrorMessage(err))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to store
          </Link>

          <div className="mb-8">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                <span className="text-primary-foreground font-bold text-xl">V</span>
              </div>
              <span className="text-xl font-bold tracking-tight">
                Vello<span className="text-primary">Tech</span>
              </span>
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Create an account</h1>
            <p className="text-muted-foreground mt-2">
              Join VelloTech and start shopping smarter
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="space-y-1 mt-2">
                {passwordRequirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${req.met ? 'bg-green-500' : 'bg-muted'}`}>
                      {req.met && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className={req.met ? 'text-green-600' : 'text-muted-foreground'}>{req.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium transition-all duration-200 hover:scale-[1.02]"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            type="button" 
            onClick={handleGoogleRegister}
            disabled={loading}
            className="w-full h-12 text-base font-medium transition-all duration-200 hover:scale-[1.02]"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Decorative */}
      <div className="hidden lg:flex flex-1 bg-secondary items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-3xl">V</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Join the VelloTech family
          </h2>
          <p className="text-muted-foreground">
            Get access to exclusive deals, early product releases, and personalized recommendations.
          </p>
        </div>
      </div>
    </div>
  )
}
