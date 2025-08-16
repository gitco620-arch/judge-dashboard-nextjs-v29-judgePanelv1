import { NextResponse } from "next/server"
import { googleSheetsService } from "@/lib/google-sheets"

export async function POST(request: Request) {
  console.log("API /api/auth called");
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Username and password are required" }, { status: 400 })
    }

    const sheetsService = googleSheetsService
    const credentials = await sheetsService.getCredentials()

    const user = credentials.find((cred) => cred.username === username && cred.password === password)

    if (user) {
      return NextResponse.json({ success: true, user: { username: user.username, role: user.role } })
    } else {
      return NextResponse.json({ success: false, error: "Invalid username or password" }, { status: 401 })
    }
  } catch (error) {
    console.error("Authentication API error:", error)
    return NextResponse.json({ success: false, error: "Server error during authentication" }, { status: 500 })
  }
}
