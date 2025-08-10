import { NextResponse } from "next/server";
import { GoogleSheetsService, SPREADSHEET_CONFIG } from "@/lib/google-sheets";

export async function GET() {
  try {
    const sheetsService = new GoogleSheetsService();
    const adminMasterSheetId = SPREADSHEET_CONFIG.ADMIN_MASTER.id;
    const summarySheetName = "Summary";
    const summaryRange = `${summarySheetName}!A:H`; // Standard, Rank, Project ID, Project Title, Theme, Project Average Score

    try {
      const data = await sheetsService.getSheetData(adminMasterSheetId, summaryRange);
      console.log("Fetched admin summary data:", data);

      if (!data.values || data.values.length <= 1) { // No data or only header
        return NextResponse.json({ success: true, summary: [] });
      }

      const summary = data.values.slice(1).map(row => ({
        standard: row[0] || '',
        rank: Number.parseInt(row[1]) || 0,
        projectId: row[2] || '',
        projectTitle: row[3] || '',
        theme: row[4] || '',
        projectAvgScore: Number.parseFloat(row[5]) || 0,
        f: row[6] || '', // Assuming 'f' is the 7th column
        studentNames: row[6] || '', // Assuming 'studentNames' is the 8th column
      }));

      console.log("Admin summary processed:", summary);

      console.log("Admin summary fetched successfully:", summary);

      return NextResponse.json({
        success: true,
        summary,
        timestamp: new Date().toISOString(),
      });
    } catch (sheetsError) {
      console.error("Google Sheets API error fetching admin summary:", sheetsError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch admin summary. Please ensure the 'Summary' tab exists in your Admin Master Sheet and permissions are correct.`,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Admin summary API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Server error while fetching admin summary",
      },
      { status: 500 },
    );
  }
}
