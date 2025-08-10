import { NextResponse } from "next/server"
import { googleSheetsService } from "@/lib/google-sheets"

export async function POST(request: Request) {
  try {
    const { className, newSheetId } = await request.json()

    if (!className || !newSheetId) {
      return NextResponse.json({ success: false, error: "Class name and new sheet ID are required" }, { status: 400 })
    }

    // In a real application, you would persist this change to a database
    // or update environment variables and trigger a redeploy.
    // For this demonstration, we're updating the in-memory SPREADSHEET_CONFIG.
    googleSheetsService.updateClassSpreadsheetId(className, newSheetId)

    return NextResponse.json({
      success: true,
      message: `Sheet ID for ${className} updated to ${newSheetId} (simulated backend update).`,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Error configuring sheet:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to configure sheet.",
      },
      { status: 500 },
    )
  }
}
