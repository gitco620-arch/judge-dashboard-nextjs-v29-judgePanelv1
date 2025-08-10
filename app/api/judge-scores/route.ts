import { type NextRequest, NextResponse } from "next/server"
import { GoogleSheetsService } from "@/lib/google-sheets"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const className = searchParams.get("class")
    const judgeName = searchParams.get("judge")
    const projectId = searchParams.get("project")

    if (!className || !judgeName) {
      return NextResponse.json(
        { success: false, error: "Class and judge parameters are required" },
        { status: 400 },
      )
    }

    // Initialize Google Sheets service
    const sheetsService = new GoogleSheetsService()

    try {
      // Fetch existing scores from judge sheet
      const scores = await sheetsService.getJudgeScores(className, judgeName, projectId === "all" ? undefined : projectId)

      // Assuming Theme Fit is in column K (index 10)
      const scoresWithThemeFit = scores.map(row => ({
        ...row,
        themeFit: row[10] || null,
      }))

      return NextResponse.json({
        success: true,
        scores: scoresWithThemeFit,
        class: className,
        judge: judgeName,
        projectId: projectId || "all",
        source: `Judge_${judgeName} sheet`,
        timestamp: new Date().toISOString(),
      })
    } catch (sheetsError) {
      console.error("Google Sheets API error:", sheetsError)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch scores from Judge_${judgeName} sheet.`,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Judge scores API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Server error while fetching judge scores",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { class: className, judge: judgeName, scores, append, themeFit } = await request.json()

    if (!className || !judgeName || !scores || !Array.isArray(scores)) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Initialize Google Sheets service
    const sheetsService = new GoogleSheetsService()

    try {
      // Save scores to judge sheet (append mode)
      await sheetsService.saveJudgeScores(className, judgeName, scores) // 'append' flag is handled internally now

      // Get total rows after append for confirmation
      const allScores = await sheetsService.getJudgeScores(className, judgeName)

      return NextResponse.json({
        success: true,
        message: append
          ? `Scores appended successfully to Judge_${judgeName} sheet`
          : `Scores saved successfully to Judge_${judgeName} sheet`,
        class: className,
        judge: judgeName,
        studentsScored: scores.length,
        totalRows: allScores.length,
        appendMode: append || false,
        timestamp: new Date().toISOString(),
      })
    } catch (sheetsError) {
      console.error("Google Sheets API error:", sheetsError)
      return NextResponse.json(
        {
          success: false,
          error: append
            ? `Failed to append scores to Judge_${judgeName} sheet. Please check permissions.`
            : `Failed to save scores to Judge_${judgeName} sheet. Please check permissions.`,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Save judge scores API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Server error while saving judge scores",
      },
      { status: 500 },
    )
  }
}
