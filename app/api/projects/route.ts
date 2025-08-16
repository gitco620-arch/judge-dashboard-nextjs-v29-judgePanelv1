import { type NextRequest, NextResponse } from "next/server"
import { googleSheetsService } from "@/lib/google-sheets"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const className = searchParams.get("class")

    if (!className) {
      return NextResponse.json({ success: false, error: "Class parameter is required" }, { status: 400 })
    }

    // Initialize Google Sheets service
    const sheetsService = googleSheetsService

    try {
      const projects = await sheetsService.getProjectIds(className)
      const spreadsheetId = sheetsService.getSpreadsheetId(className)
      const classConfig = sheetsService.getClassConfig(className)

      return NextResponse.json({
        success: true,
        projects,
        class: className,
        spreadsheetId,
        range: classConfig?.range,
        source: "BaseSheet",
        timestamp: new Date().toISOString(),
      })
    } catch (sheetsError) {
      console.error("Google Sheets API error:", sheetsError)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch projects for ${className}. Please check spreadsheet ID and permissions.`,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Projects API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Server error while fetching projects",
      },
      { status: 500 },
    )
  }
}
