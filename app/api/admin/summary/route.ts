import { NextResponse } from "next/server";
import { googleSheetsService } from "@/lib/google-sheets";
import { SPREADSHEET_CONFIG } from "@/lib/spreadsheet-config";

export const dynamic = 'force-dynamic';  // Prevent static caching
export const revalidate = 0;  // Prevent revalidation caching

export async function GET() {
  try {
    const sheetsService = googleSheetsService;
    const adminMasterSheetId = SPREADSHEET_CONFIG.ADMIN_MASTER.id;
    const summarySheetName = "Summary";
    const summaryRange = `${summarySheetName}!A:H`;

    const data = await sheetsService.getSheetData(adminMasterSheetId, summaryRange);
    
    // Add cache prevention headers to the response
    const headers = {
      'Cache-Control': 'no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    if (!data.values || data.values.length <= 1) {
      return NextResponse.json({ success: true, summary: [] }, { headers });
    }

    const summary = data.values.slice(1).map(row => ({
      standard: row[0] || '',
      rank: Number.parseInt(row[1]) || 0,
      projectId: row[2] || '',
      projectTitle: row[3] || '',
      theme: row[4] || '',
      projectAvgScore: Number.parseFloat(row[5]) || 0,
      studentNames: row[7] || '', // Fixed: Changed to index 7 for studentNames
    }));

    return NextResponse.json({
      success: true,
      summary,
      timestamp: new Date().toISOString(),
    }, { headers });

  } catch (error) {
    console.error("Admin summary API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Server error while fetching admin summary",
      },
      { status: 500 }
    );
  }
}
