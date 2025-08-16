import { NextResponse } from "next/server";
import { googleSheetsService } from "@/lib/google-sheets";
import { SPREADSHEET_CONFIG } from "@/lib/spreadsheet-config"; // Adjust the path as needed

import { type TopProjectSummary } from "@/app/admin-dashboard/page";

export async function POST(request: Request) {
  try {
    const sheetsService = googleSheetsService;
    const classes = Object.keys(SPREADSHEET_CONFIG.CLASSES);
    const allTopProjects: TopProjectSummary[] = [];

    for (const className of classes) {
      console.log(`Processing scores for ${className}...`);
      await sheetsService.processClassScores(className);
      const topProjects = await sheetsService.getTopProjects(className);
      allTopProjects.push(...topProjects);
    }

    // Sort all top projects by standard and then by rank
    allTopProjects.sort((a, b) => {
      if (a.standard < b.standard) return -1;
      if (a.standard > b.standard) return 1;
      return a.rank - b.rank;
    });

    await sheetsService.updateAdminSummary(allTopProjects);

    return NextResponse.json({
      success: true,
      message: "Scores and top projects updated for all standards.",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error processing all scores:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process all scores.",
      },
      { status: 500 },
    );
  }
}
