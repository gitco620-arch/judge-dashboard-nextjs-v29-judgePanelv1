import { type NextRequest, NextResponse } from "next/server"
import { googleSheetsService } from "@/lib/google-sheets"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const className = searchParams.get("class")
    const projectId = searchParams.get("project")

    if (!className || !projectId) {
      return NextResponse.json(
        { success: false, error: "Class and project parameters are required" },
        { status: 400 },
      )
    }

    // Initialize Google Sheets service
    const sheetsService = googleSheetsService

    try {
      const students = await sheetsService.getStudentsByProjectId(className, projectId)

      return NextResponse.json({
        success: true,
        students,
        class: className,
        projectId,
        source: "BaseSheet",
        timestamp: new Date().toISOString(),
      })
    } catch (sheetsError) {
      console.error("Google Sheets API error:", sheetsError)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch students for project ${projectId}. Please check spreadsheet ID and permissions.`,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Students API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Server error while fetching students",
      },
      { status: 500 },
    )
  }
}
