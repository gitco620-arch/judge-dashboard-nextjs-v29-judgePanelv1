"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, LogIn, User, Lock } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const user = localStorage.getItem("user")
    if (user) {
      const parsedUser = JSON.parse(user)
      if (parsedUser.role === "Judge") {
        router.push("/judge-dashboard")
      } else if (parsedUser.role === "Admin") {
        router.push("/admin-dashboard")
      }
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem("user", JSON.stringify(data.user))
        if (data.user.role === "Judge") {
          router.push("/judge-dashboard")
        } else if (data.user.role === "Admin") {
          router.push("/admin-dashboard")
        }
      } else {
        setError(data.error || "Login failed. Please check your credentials.")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* School Branding Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Image
              src="\logo.png"
              alt="Shaanthi School Logo"
              width={120}
              height={120}
              className="shadow-lg"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#9B5A44] tracking-wide">SHAANTHI SCHOOL</h1>
            <div className="mt-2 p-3 bg-gradient-to-r from-[#F5BD3A] to-[#D99058] rounded-lg shadow-md">
              <p className="text-white font-semibold text-lg">AURA V - The Way to Shine in KREA</p>
            </div>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-2 border-[#9B5A44]/20">
          <CardHeader className="space-y-1 text-center bg-[#9B5A44] text-white rounded-t-lg">
            <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
            <CardDescription className="text-amber-100">Sign in to your Judge or Admin account</CardDescription>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[#9B5A44] font-medium">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B5A44]/60" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="pl-10 border-[#9B5A44]/30 focus:border-[#F5BD3A] focus:ring-[#F5BD3A]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#9B5A44] font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B5A44]/60" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 border-[#9B5A44]/30 focus:border-[#F5BD3A] focus:ring-[#F5BD3A]"
                  />
                </div>
              </div>
              {error && (
                <Alert variant="destructive" className="border-red-300 bg-red-50">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#9B5A44] to-[#D99058] hover:from-[#8B4A34] hover:to-[#C98048] text-white font-semibold py-3 shadow-lg transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-[#9B5A44]/70">
          <p>Science Fair Judging System</p>
        </div>
      </div>
    </div>
  )
}
