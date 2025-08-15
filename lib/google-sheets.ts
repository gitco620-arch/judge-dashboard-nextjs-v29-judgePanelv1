import { GoogleAuth } from "google-auth-library"
import { google } from "googleapis"
import * as fs from "fs"
import * as path from "path"
import * as os from "os"

const CLASS_SHEET_IDS_PATH = path.resolve(process.cwd(), "lib/class-sheet-ids.json")

function loadClassSheetIds(): Record<string, string> {
  try {
    const raw = fs.readFileSync(CLASS_SHEET_IDS_PATH, "utf-8")
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function saveClassSheetIds(ids: Record<string, string>) {
  fs.writeFileSync(CLASS_SHEET_IDS_PATH, JSON.stringify(ids, null, 2), "utf-8")
}

export interface SheetCredential {
  username: string
  password: string
  role: string
}

export interface StudentProject {
  sno: string
  studentName: string
  grade: string
  projectTitle: string
  projectId: string
  theme?: string // Added theme field
}

export interface JudgeScore {
  sno: string
  studentName: string
  grade: string
  projectTitle: string
  projectId: string
  creativity: number | null
  scientificThought: number | null
  technicalSkills: number | null
  presentation: number | null
  status?: string // Added status field (e.g., "Present", "Absent")
  themeFit?: string | null // Added themeFit field
}

export interface SheetData {
  values: string[][]
  range: string
  spreadsheetId: string
}

interface ClassConfig {
  id: string
  baseSheet: string
  range: string
}

// Configuration for Google Sheets API
export const GOOGLE_SHEETS_CONFIG = {
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
}

// Spreadsheet configurations - changed to 'let' to allow dynamic updates for demonstration
const persistedIds = loadClassSheetIds()
export let SPREADSHEET_CONFIG = {
  CREDENTIALS: {
    id: process.env.CREDENTIALS_SPREADSHEET_ID || "1juP3Eg24GYgOmFcxpNMfbUSXK4m7xTqzlN-Cw9ndYQc", // REPLACE WITH YOUR CREDENTIALS SHEET ID
    range: "Sheet1!A:C", // Username, Password, Role
  },
  ADMIN_MASTER: {
    id: process.env.ADMIN_MASTER_SPREADSHEET_ID || "1snk-FZaxyZbSu_Ww-oPnam8JxZ2RLg3etI5TBkr-T1A", // New: Admin Master Sheet ID, defaults to credentials sheet
  },
  CLASSES: {
    "Class 4": {
      id: persistedIds["Class 4"], // REPLACE
      baseSheet: "BaseSheet",
      range: "Sheet1!A:F", // Updated range to include Theme (assuming column F)
    },
    "Class 5": {
      id: persistedIds["Class 5"], // REPLACE
      baseSheet: "BaseSheet",
      range: "Sheet1!A:F", // Updated range to include Theme (assuming column F)
    },
    "Class 6": {
      id: persistedIds["Class 6"], // REPLACE
      baseSheet: "BaseSheet",
      range: "Sheet1!A:F", // Updated range to include Theme (assuming column F)
    },
    "Class 7": {
      id: persistedIds["Class 7"], // REPLACE
      baseSheet: "BaseSheet",
      range: "Sheet1!A:F", // Updated range to include Theme (assuming column F)
    },
    "Class 8": {
      id: persistedIds["Class 8"], // REPLACE
      baseSheet: "BaseSheet",
      range: "Sheet1!A:F", // Updated range to include Theme (assuming column F)
    },
    "Class 9": {
      id: persistedIds["Class 9"], // REPLACE
      baseSheet: "BaseSheet",
      range: "Sheet1!A:F", // Updated range to include Theme (assuming column F)
    },
    "Class 10": {
      id: persistedIds["Class 10"], // REPLACE
      baseSheet: "BaseSheet",
      range: "Sheet1!A:F", // Updated range to include Theme (assuming column F)
    },
    "Class 11": {
      id: persistedIds["Class 11"], // REPLACE
      baseSheet: "BaseSheet",
      range: "Sheet1!A:F", // Updated range to include Theme (assuming column F)
    },
    "Class 12": {
      id: persistedIds["Class 12"], // REPLACE
      baseSheet: "BaseSheet",
      range: "Sheet1!A:F", // Updated range to include Theme (assuming column F)
    },
  },
}

export class GoogleSheetsService {
  private auth: GoogleAuth
  private sheets: any

  constructor() {
    try {
      const base64Key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;
      if (!base64Key) {
        throw new Error(
          "GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 environment variable is not set. Please configure your service account key as a Base64 encoded string."
        );
      }
      // Decode and write to a temp file in the OS temp directory
      const keyData = Buffer.from(base64Key, "base64").toString("utf8");
      const tmpDir = os.tmpdir();
      const keyPath = path.join(tmpDir, "service-account-key.json");
      fs.writeFileSync(keyPath, keyData);

      this.auth = new GoogleAuth({
        keyFile: keyPath,
        scopes: GOOGLE_SHEETS_CONFIG.scopes,
      });
      this.sheets = google.sheets({ version: "v4", auth: this.auth });
      console.log("🔗 Google Sheets API initialized with service account key from Base64.");
    } catch (err) {
      console.error("❌ Error initializing Google Sheets API:", err);
      throw err;
    }
  }

  async getSheetData(spreadsheetId: string, range: string): Promise<SheetData> {
    try {
      console.log(`🔗 Fetching data from Google Sheets: ${spreadsheetId}, Range: ${range}`)

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      })

      return {
        values: response.data.values || [],
        range,
        spreadsheetId,
      }
    } catch (error) {
      console.error("Error fetching sheet data:", error)
      throw new Error(
        `Failed to fetch data from spreadsheet ${spreadsheetId}. Please check permissions and spreadsheet ID.`,
      )
    }
  }

  async batchGetSheetData(spreadsheetId: string, ranges: string[]): Promise<{ [range: string]: string[][] }> {
    try {
      const response = await this.sheets.spreadsheets.values.batchGet({
        spreadsheetId,
        ranges,
      })
      const result: { [range: string]: string[][] } = {}
      ;(response.data.valueRanges || []).forEach((valueRange: any) => {
        result[valueRange.range] = valueRange.values || []
      })
      return result
    } catch (error) {
      console.error("Error in batchGetSheetData:", error)
      throw new Error(`Failed to batch get data from spreadsheet ${spreadsheetId}.`)
    }
  }

  async getCredentials(): Promise<SheetCredential[]> {
    try {
      const data = await this.getSheetData(SPREADSHEET_CONFIG.CREDENTIALS.id, SPREADSHEET_CONFIG.CREDENTIALS.range)

      if (!data.values || data.values.length === 0) {
        throw new Error("No credentials found in the spreadsheet")
      }

      // Skip header row and map to credential objects
      return data.values
        .slice(1)
        .map((row) => ({
          username: row[0] || "",
          password: row[1] || "",
          role: row[2] || "",
        }))
        .filter((cred) => cred.username && cred.password && cred.role)
    } catch (error) {
      console.error("Error fetching credentials:", error)
      throw new Error("Failed to fetch credentials from Google Sheets")
    }
  }

  async getProjectIds(className: string): Promise<string[]> {
    try {
      const classConfig = this.getClassConfig(className)

      if (!classConfig) {
        throw new Error(`No configuration found for class: ${className}`)
      }

      const data = await this.getSheetData(classConfig.id, classConfig.range)

      if (!data.values || data.values.length === 0) {
        return []
      }

      // Skip header row and extract Project IDs from column E (index 4)
      const projectIds = data.values
        .slice(1) // Skip header row
        .map((row) => row[4]) // Column E (Project ID) is at index 4
        .filter((id) => id && id.trim() !== "") // Remove empty cells
        .map((id) => id.trim()) // Clean whitespace

      // Return unique project IDs only
      return [...new Set(projectIds)]
    } catch (error) {
      console.error(`Error fetching project IDs for ${className}:`, error)
      throw new Error(`Failed to fetch project IDs for ${className} from Google Sheets`)
    }
  }

  async getStudentsByProjectId(className: string, projectId: string): Promise<StudentProject[]> {
    try {
      const classConfig = this.getClassConfig(className)

      if (!classConfig) {
        throw new Error(`No configuration found for class: ${className}`)
      }

      const data = await this.getSheetData(classConfig.id, classConfig.range)

      if (!data.values || data.values.length === 0) {
        return []
      }

      // Skip header row and filter by Project ID
      const students = data.values
        .slice(1) // Skip header row
        .filter((row) => row[4] && row[4].trim() === projectId.trim()) // Filter by Project ID
        .map((row) => ({
          sno: row[0] || "",
          studentName: row[1] || "",
          grade: row[2] || "",
          projectTitle: row[3] || "",
          projectId: row[4] || "",
          theme: row[5] || "", // Assuming Theme is in column F (index 5)
        }))
        .filter((student) => student.studentName && student.projectId)

      return students
    } catch (error) {
      console.error(`Error fetching students for project ${projectId}:`, error)
      throw new Error(`Failed to fetch students for project ${projectId} from Google Sheets`)
    }
  }

  async getJudgeScores(className: string, judgeName: string, projectId?: string): Promise<JudgeScore[]> {
    try {
      const classConfig = this.getClassConfig(className)
      if (!classConfig) {
        throw new Error(`No configuration found for class: ${className}`)
      }

      const judgeSheetName = `Judge_${judgeName}`
      const judgeRange = `${judgeSheetName}!A:K` // Updated range to include Theme Fit (assuming column K)

      try {
        const data = await this.getSheetData(classConfig.id, judgeRange)

        if (!data.values || data.values.length === 0) {
          return []
        }

        // Skip header row and optionally filter by Project ID
        let scores = data.values
          .slice(1) // Skip header row
          .map((row) => ({
            sno: row[0] || "",
            studentName: row[1] || "",
            grade: row[2] || "",
            projectTitle: row[3] || "",
            projectId: row[4] || "",
            creativity: row[5] ? Number.parseFloat(row[5]) : null,
            scientificThought: row[6] ? Number.parseFloat(row[6]) : null,
            technicalSkills: row[7] ? Number.parseFloat(row[7]) : null,
            presentation: row[8] ? Number.parseFloat(row[8]) : null,
            status: row[9] || "Present", // Assuming Status is in column J (index 9), default to "Present"
            themeFit: row[10] || null, // Assuming Theme Fit is in column K (index 10)
          }))

          console.log(`🔗 Fetched ${scores.length} scores from ${judgeSheetName} for class ${className}`)

        // Filter by project ID if specified
        if (projectId) {
          scores = scores.filter((score) => score.projectId.trim() === projectId.trim())
        }

        return scores
      } catch (error) {
        // Judge sheet doesn't exist yet or is empty, which is fine for initial fetch
        console.log(`Judge sheet ${judgeSheetName} doesn't exist yet or is empty.`)
        return []
      }
    } catch (error) {
      console.error(`Error fetching judge scores:`, error)
      throw new Error(`Failed to fetch judge scores from Google Sheets`)
    }
  }

  async saveJudgeScores(className: string, judgeName: string, scores: JudgeScore[]): Promise<void> {
    try {
      const classConfig = this.getClassConfig(className)
      if (!classConfig) {
        throw new Error(`No configuration found for class: ${className}`)
      }

      const judgeSheetName = `Judge_${judgeName}`
      const judgeHeaderRow = [
        "S.No.",
        "Name of the Student",
        "Grade",
        "Project Title",
        "Project ID",
        "Creativity & Imagination",
        "Scientific Thought",
        "Technical Skills",
        "Presentation",
        "Status",
        "Theme Fit", // Added Theme Fit to header
      ]

      // Ensure judge sheet exists and has header
      await this.ensureSheetExists(classConfig.id, judgeSheetName, judgeHeaderRow)

      // Prepare new score rows for appending
      const newRows = scores.map((score) => [
        score.sno,
        score.studentName,
        score.grade,
        score.projectTitle,
        score.projectId,
        score.creativity?.toString() || "",
        score.scientificThought?.toString() || "",
        score.technicalSkills?.toString() || "",
        score.presentation?.toString() || "",
        score.status || "Present", // Include status
        score.themeFit || "", // Include themeFit
      ])

      // Append new scores (never overwrite)
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: classConfig.id,
        range: `${judgeSheetName}!A:K`, // Updated range for appending
        valueInputOption: "USER_ENTERED",
        resource: {
          values: newRows,
        },
      })

      console.log(`✅ Appended ${newRows.length} new score rows to ${judgeSheetName}`)
    } catch (error) {
      console.error(`Error appending judge scores:`, error)
      throw new Error(`Failed to append judge scores to Google Sheets`)
    }
  }

  private async getExistingJudgeData(spreadsheetId: string, sheetName: string): Promise<string[][]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetName}!A:K`, // Updated range
      })
      return response.data.values || []
    } catch (error) {
      // Sheet doesn't exist or is empty
      return []
    }
  }

  private async ensureSheetExists(spreadsheetId: string, sheetName: string, headerRow?: string[]): Promise<void> {
    try {
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId,
        fields: "sheets.properties.title,sheets.properties.sheetId",
      })

      const sheetExists = spreadsheet.data.sheets?.some((sheet: any) => sheet.properties.title === sheetName)

      if (!sheetExists) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: spreadsheetId,
          resource: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheetName,
                  },
                },
              },
            ],
          },
        })
        console.log(`✅ Created new sheet: ${sheetName} in spreadsheet ${spreadsheetId}`)

        // If header row is provided, write it
        if (headerRow && headerRow.length > 0) {
          await this.sheets.spreadsheets.values.append({
            spreadsheetId: spreadsheetId,
            range: `${sheetName}!A1`,
            valueInputOption: "USER_ENTERED",
            resource: {
              values: [headerRow],
            },
          })
          console.log(`✅ Added header to new sheet: ${sheetName}`)
        }
      }
    } catch (error) {
      console.error(`Error ensuring sheet ${sheetName} exists in ${spreadsheetId}:`, error)
      throw new Error(`Failed to create or verify sheet: ${sheetName}`)
    }
  }

  async getAllSheetTitles(spreadsheetId: string): Promise<string[]> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId,
        fields: "sheets.properties.title",
      })
      return response.data.sheets?.map((sheet: any) => sheet.properties.title) || []
    } catch (error) {
      console.error(`Error fetching sheet titles for ${spreadsheetId}:`, error)
      throw new Error(`Failed to fetch sheet titles for spreadsheet ${spreadsheetId}.`)
    }
  }

  async getAllJudgeSheetNames(classSpreadsheetId: string): Promise<string[]> {
    const allSheetTitles = await this.getAllSheetTitles(classSpreadsheetId)
    return allSheetTitles.filter((title) => title.startsWith("Judge_"))
  }

  async getProjectDetailsMap(
    className: string,
  ): Promise<Map<string, { title: string; theme: string; studentNames: Set<string> }>> {
    const classConfig = this.getClassConfig(className)
    if (!classConfig) {
      throw new Error(`No configuration found for class: ${className}`)
    }

    const data = await this.getSheetData(classConfig.id, classConfig.range) // Reads Sheet1!A:F

    const projectMap = new Map<string, { title: string; theme: string; studentNames: Set<string> }>()
    if (data.values && data.values.length > 1) {
      // Skip header
      data.values.slice(1).forEach((row) => {
        const projectId = row[4]?.trim() // Column E
        const projectTitle = row[3]?.trim() // Column D
        const theme = row[5]?.trim() // Column F
        const studentName = row[1]?.trim() // Column B

        if (projectId) {
          if (!projectMap.has(projectId)) {
            projectMap.set(projectId, {
              title: projectTitle || "",
              theme: theme || "",
              studentNames: new Set<string>(),
            })
          }
          if (studentName) {
            projectMap.get(projectId)?.studentNames.add(studentName)
          }
        }
      })
    }
    return projectMap
  }

  async processClassScores(className: string): Promise<void> {
    const classConfig = this.getClassConfig(className)
    if (!classConfig) {
      throw new Error(`No configuration found for class: ${className}`)
    }

    const classSpreadsheetId = classConfig.id
    const projectDetailsMap = await this.getProjectDetailsMap(className)
    console.log(`[${className}] Found ${projectDetailsMap.size} unique projects from BaseSheet.`)

    const judgeSheetNames = await this.getAllJudgeSheetNames(classSpreadsheetId)
    console.log(`[${className}] Found ${judgeSheetNames.length} judge sheets.`)

    // Map to store the latest score for each project by each judge
    const latestProjectScoresByJudge = new Map<string, Map<string, JudgeScore>>() // projectId -> (judgeName -> latestScore)

        const judgeRanges = judgeSheetNames.map(judgeSheetName => `${judgeSheetName}!A:K`);
        console.log("judgeRangeMAddy");
    console.log(`[${className}] Fetching data for judgeRangeMAddy sheets: ${judgeRanges}`);

    const batchData = await this.batchGetSheetData(classSpreadsheetId, judgeRanges);
    console.log("batchData:", JSON.stringify(batchData, null, 2));
    console.log(`[${className}] FetchedMaddy data for ${judgeRanges.length} ${judgeRanges} ${batchData} judge sheets in batch.`)
    
    for (const judgeSheetName of judgeSheetNames) {
      console.log(`[${className}] Processing judge sheet maddy: ${judgeSheetName}`);
      const judgeName = judgeSheetName.replace("Judge_", "");
      const values = batchData[`${judgeSheetName}!A1:K1000`] || [];
      console.log(`[${className}] FoundMAddys ${values.length} rows in sheet ${judgeSheetName} for Judge ${judgeName}.`);
      if (values.length <= 1) continue; // skip if only header or empty
    
      // Parse scores as in getJudgeScores
      const scoresForJudge = values
        .slice(1)
        .map((row) => ({
          sno: row[0] || "",
          studentName: row[1] || "",
          grade: row[2] || "",
          projectTitle: row[3] || "",
          projectId: row[4] || "",
          creativity: row[5] ? Number.parseFloat(row[5]) : null,
          scientificThought: row[6] ? Number.parseFloat(row[6]) : null,
          technicalSkills: row[7] ? Number.parseFloat(row[7]) : null,
          presentation: row[8] ? Number.parseFloat(row[8]) : null,
          status: row[9] || "Present",
          themeFit: row[10] || null,
        }))

    console.log(`[${className}] FoundMaddy ${scoresForJudge.length} scores for Judge ${judgeName} in sheet ${judgeSheetName}.`);
      
    for (const score of scoresForJudge) {
        const pId = score.projectId.trim();
        console.log(`[${className}] Processing score for Project ${pId} by Judge ${judgeName}:`, score);
        if (!latestProjectScoresByJudge.has(pId)) {
          latestProjectScoresByJudge.set(pId, new Map<string, JudgeScore>());
        }
        latestProjectScoresByJudge.get(pId)?.set(judgeName, score);
      }
    }
    console.log(`[${className}] Collected latest scores for projects from each judge.`)
    console.log(
      `[${className}] latestProjectScoresByJudge for a sample project (e.g., P4001):`,
      latestProjectScoresByJudge.get("P4001"),
    )

    // Aggregate scores per project
    const projectAggregatedScores: {
      [projectId: string]: {
        projectTitle: string
        theme: string
        creativitySum: number
        scientificThoughtSum: number
        technicalSkillsSum: number
        presentationSum: number
        judgeCount: number // Number of judges who scored this project as Present
        absentCount: number // Number of judges who marked this project Absent
        studentNames: string[] // To collect all student names for this project
      }
    } = {}

    // Initialize projectAggregatedScores with details from BaseSheet
    for (const [pId, details] of projectDetailsMap.entries()) {
      projectAggregatedScores[pId] = {
        projectTitle: details.title,
        theme: details.theme,
        creativitySum: 0,
        scientificThoughtSum: 0,
        technicalSkillsSum: 0,
        presentationSum: 0,
        judgeCount: 0,
        absentCount: 0,
        studentNames: Array.from(details.studentNames).sort(),
      }
    }

    // Populate aggregated scores from judge submissions
    for (const [pId, judgeScoresMap] of latestProjectScoresByJudge.entries()) {
      console.log(`[${className}] Processing scores for Project ${pId} from judges:`, Array.from(judgeScoresMap.keys()))
      console.log(`[${className}] judgeScoresMap for Project ${pId} has ${judgeScoresMap.size} entries.`)
      if (!projectAggregatedScores[pId]) {
        // This project was scored but not found in BaseSheet (e.g., if BaseSheet is incomplete)
        // Try to get details from the first score entry for this project
        const firstScore = Array.from(judgeScoresMap.values())[0]
        projectAggregatedScores[pId] = {
          projectTitle: firstScore?.projectTitle || "",
          theme: projectDetailsMap.get(pId)?.theme || "", // Fallback to BaseSheet theme if available
          creativitySum: 0,
          scientificThoughtSum: 0,
          technicalSkillsSum: 0,
          presentationSum: 0,
          judgeCount: 0,
          absentCount: 0,
          studentNames: [], // Cannot reliably get all student names if not in BaseSheet
        }
        console.warn(
          `[${className}] Project ${pId} found in judge sheets but not in BaseSheet. Student names might be incomplete.`,
        )
      }
      for (const [judgeName, score] of judgeScoresMap.entries()) {
        if (score.status === "Absent") {
          console.log(`[${className}] Judge ${judgeName} marked Project ${pId} as Absent.`)
          projectAggregatedScores[pId].absentCount++
        } else {
          // Present
          console.log(
            `[${className}] Adding score for Project ${pId} by Judge ${judgeName}: Creativity=${score.creativity}, ScientificThought=${score.scientificThought}, TechnicalSkills=${score.technicalSkills}, Presentation=${score.presentation}`,
          )
          projectAggregatedScores[pId].judgeCount++
          projectAggregatedScores[pId].creativitySum += score.creativity || 0
          projectAggregatedScores[pId].scientificThoughtSum += score.scientificThought || 0
          projectAggregatedScores[pId].technicalSkillsSum += score.technicalSkills || 0
          projectAggregatedScores[pId].presentationSum += score.presentation || 0
        }
      }
    }
    console.log(`[${className}] Aggregation complete for project scores.`)
    console.log(
      `[${className}] projectAggregatedScores for a sample project (e.g., P4001):`,
      projectAggregatedScores["P4001"],
    )

    // Calculate project averages and prepare rows for "Score" tab
    const scoreTabRows: string[][] = []
    scoreTabRows.push([
      "Project ID",
      "Project Title",
      "Theme",
      "Avg Creativity",
      "Avg Scientific Thought",
      "Avg Technical Skills",
      "Avg Presentation",
      "Project Average Score",
      "Student Names",
    ]) // New Header for Score tab

    const projectsForScoreTab: Array<{
      projectId: string
      projectTitle: string
      theme: string
      avgCreativity: number
      avgScientificThought: number
      avgTechnicalSkills: number
      avgPresentation: number
      projectAvgScore: number
      studentNames: string
    }> = []

    for (const pId in projectAggregatedScores) {
      const projectData = projectAggregatedScores[pId]
      let avgCreativity = 0
      let avgScientificThought = 0
      let avgTechnicalSkills = 0
      let avgPresentation = 0
      let projectAvgScore = 0

      if (projectData.judgeCount > 0) {
        avgCreativity = projectData.creativitySum / projectData.judgeCount
        avgScientificThought = projectData.scientificThoughtSum / projectData.judgeCount
        avgTechnicalSkills = projectData.technicalSkillsSum / projectData.judgeCount
        avgPresentation = projectData.presentationSum / projectData.judgeCount
        projectAvgScore = (avgCreativity + avgScientificThought + avgTechnicalSkills + avgPresentation) / 4
        console.log("jaguuu",judgeSheetNames,avgCreativity, avgScientificThought, avgTechnicalSkills, avgPresentation, projectAvgScore)
      } else if (projectData.absentCount > 0 && projectData.judgeCount === 0) {
        // All judges marked project absent, so all scores are 0
        avgCreativity = 0
        avgScientificThought = 0
        avgTechnicalSkills = 0
        avgPresentation = 0
        projectAvgScore = 0
      }
      // If no judges scored the project (judgeCount and absentCount are 0), all averages remain 0 (initialized)

      projectsForScoreTab.push({
        projectId: pId,
        projectTitle: projectData.projectTitle,
        theme: projectData.theme,
        avgCreativity: avgCreativity,
        avgScientificThought: avgScientificThought,
        avgTechnicalSkills: avgTechnicalSkills,
        avgPresentation: avgPresentation,
        projectAvgScore: projectAvgScore,
        studentNames: projectData.studentNames.join(", "), // Join student names
      })
    }

    // Sort projects for the Score tab by Project ID for consistent ordering
    projectsForScoreTab.sort((a, b) => a.projectId.localeCompare(b.projectId))

    projectsForScoreTab.forEach((project) => {
      scoreTabRows.push([
        project.projectId,
        project.projectTitle,
        project.theme,
        project.avgCreativity.toFixed(2),
        project.avgScientificThought.toFixed(2),
        project.avgTechnicalSkills.toFixed(2),
        project.avgPresentation.toFixed(2),
        project.projectAvgScore.toFixed(2),
        project.studentNames,
      ])
    })
    console.log(`[${className}] Prepared ${scoreTabRows.length - 1} rows for "Score" tab (excluding header).`)
    console.log(`[${className}] Final scoreTabRows before writing:`, scoreTabRows)

    const scoreSheetName = "Score"
    await this.ensureSheetExists(classSpreadsheetId, scoreSheetName, scoreTabRows[0]) // Pass header for creation

    // Clear existing content before writing new data (excluding header)
    await this.sheets.spreadsheets.values.clear({
      spreadsheetId: classSpreadsheetId,
      range: `${scoreSheetName}!A2:I`, // Clear from row 2 onwards, up to column I
    })

    // Write new data (including header)
    if (scoreTabRows.length > 1) {
      // Only update if there's data beyond the header
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: classSpreadsheetId,
        range: `${scoreSheetName}!A1`, // Start from A1 to include header
        valueInputOption: "USER_ENTERED",
        resource: {
          values: scoreTabRows,
        },
      })
      console.log(`✅ Updated "Score" tab for ${className} with ${scoreTabRows.length - 1} project average entries.`)
    } else {
      console.log(`[${className}] No project average scores to write to "Score" tab.`)
    }
  }

  async getTopProjects(className: string): Promise<
    Array<{
      projectId: string
      projectTitle: string
      theme: string
      projectAvgScore: number
      standard: string
      rank: number
      studentNames: string
    }>
  > {
    const classConfig = this.getClassConfig(className)
    if (!classConfig) {
      throw new Error(`No configuration found for class: ${className}`)
    }

    const scoreSheetName = "Score"
    const scoreRange = `${scoreSheetName}!A:I` // Updated range for new Score tab columns

    try {
      const data = await this.getSheetData(classConfig.id, scoreRange)
      console.log(`[${className}] Read "Score" tab for top projects. Rows fetched: ${data.values.length}.`)

      if (!data.values || data.values.length <= 1) {
        // No data or only header
        console.log(`[${className}] "Score" tab is empty or only has header. No projects to rank.`)
        return []
      }

      const projects: Array<{
        projectId: string
        projectTitle: string
        theme: string
        projectAvgScore: number
        studentNames: string
      }> = []

      data.values.slice(1).forEach((row) => {
        const projectId = row[0]?.trim() // Project ID is now column A
        const projectTitle = row[1]?.trim() // Project Title is now column B
        const theme = row[2]?.trim() // Theme is now column C
        const projectAvgScore = Number.parseFloat(row[7]) || 0 // Project Average Score is now column H (index 7)
        const studentNames = row[8]?.trim() || "" // Student Names is now column I (index 8)

        if (projectId) {
          projects.push({
            projectId: projectId,
            projectTitle: projectTitle,
            theme: theme,
            projectAvgScore: projectAvgScore,
            studentNames: studentNames,
          })
        } else {
          console.warn(
            `[${className}] Skipping row in "Score" tab for top projects due to missing Project ID: ${row.join(", ")}`,
          )
        }
      })
      console.log(`[${className}] Parsed ${projects.length} projects from "Score" tab.`)

      // Sort by project average score descending
      projects.sort((a, b) => b.projectAvgScore - a.projectAvgScore)
      console.log(`[${className}] Projects sorted by average score.`)

      const topProjects: Array<{
        projectId: string
        projectTitle: string
        theme: string
        projectAvgScore: number
        standard: string
        rank: number
        studentNames: string
      }> = []
      let currentRank = 1
      let projectsAdded = 0

      for (let i = 0; i < projects.length; i++) {
        const project = projects[i]
        if (projectsAdded < 3) {
          topProjects.push({ ...project, standard: className, rank: currentRank })
          projectsAdded++
        } else if (project.projectAvgScore === topProjects[topProjects.length - 1].projectAvgScore) {
          // Handle ties for 3rd place
          topProjects.push({ ...project, standard: className, rank: currentRank })
        } else {
          break // Stop after top 3 (and ties)
        }
        // Update rank for next distinct score, only if current project's score is different from the last added project's score
        if (i < projects.length - 1 && projects[i + 1].projectAvgScore < project.projectAvgScore) {
          currentRank = topProjects.length + 1
        }
      }
      console.log(`[${className}] Identified ${topProjects.length} top projects.`)
      return topProjects
    } catch (error) {
      console.error(`Error getting top projects for ${className}:`, error)
      throw new Error(`Failed to get top projects for ${className}.`)
    }
  }

  async updateAdminSummary(
    summaryData: Array<{
      standard: string
      rank: number
      projectId: string
      projectTitle: string
      theme: string
      projectAvgScore: number
      studentNames: string
    }>,
  ): Promise<void> {
    const adminMasterSheetId = SPREADSHEET_CONFIG.ADMIN_MASTER.id
    const summarySheetName = "Summary"
    const summaryHeader = [
      "Standard",
      "Rank",
      "Project ID",
      "Project Title",
      "Theme",
      "Project Avg Score",
      "Student Names",
    ] // Added Student Names

    await this.ensureSheetExists(adminMasterSheetId, summarySheetName, summaryHeader)

    // Clear existing content in Summary tab (excluding header)
    await this.sheets.spreadsheets.values.clear({
      spreadsheetId: adminMasterSheetId,
      range: `${summarySheetName}!A2:G`, // Updated range for clearing (A-G for 7 columns)
    })

    if (summaryData.length === 0) {
      console.log("No summary data to append to Admin Master Sheet.")
      return
    }

    const rowsToAppend = summaryData.map((data) => [
      data.standard,
      data.rank.toString(),
      data.projectId,
      data.projectTitle,
      data.theme,
      data.projectAvgScore.toFixed(2),
      data.studentNames, // Include student names
    ])

    await this.sheets.spreadsheets.values.append({
      spreadsheetId: adminMasterSheetId,
      range: `${summarySheetName}!A2`, // Append starting from A2 (after header)
      valueInputOption: "USER_ENTERED",
      resource: {
        values: rowsToAppend,
      },
    })
    console.log(`✅ Appended ${rowsToAppend.length} rows to "Summary" tab in Admin Master Sheet.`)
  }

  getClassConfig(className: string): ClassConfig | undefined {
    return SPREADSHEET_CONFIG.CLASSES[className as keyof typeof SPREADSHEET_CONFIG.CLASSES]
  }

  getSpreadsheetId(className: string): string {
    const classConfig = this.getClassConfig(className)
    return classConfig?.id || ""
  }

  // New function to update a class's spreadsheet ID
  updateClassSpreadsheetId(className: string, newId: string): void {
    if (SPREADSHEET_CONFIG.CLASSES[className as keyof typeof SPREADSHEET_CONFIG.CLASSES]) {
      // Update in-memory config
      SPREADSHEET_CONFIG = {
        ...SPREADSHEET_CONFIG,
        CLASSES: {
          ...SPREADSHEET_CONFIG.CLASSES,
          [className]: {
            ...SPREADSHEET_CONFIG.CLASSES[className as keyof typeof SPREADSHEET_CONFIG.CLASSES],
            id: newId,
          },
        },
      }
      // Persist to file
      const ids = loadClassSheetIds()
      ids[className] = newId
      saveClassSheetIds(ids)
      console.log(`[Backend Simulation] Updated SPREADSHEET_CONFIG for ${className} to ID: ${newId} and persisted to file`)
    } else {
      console.warn(`[Backend Simulation] Class ${className} not found in SPREADSHEET_CONFIG.`)
    }
  }
}

// Export singleton instance
export const googleSheetsService = new GoogleSheetsService()

const sheetTitlesCache: { [spreadsheetId: string]: string[] } = {};

async function getAllSheetTitlesCached(spreadsheetId: string): Promise<string[]> {
  if (sheetTitlesCache[spreadsheetId]) {
    return sheetTitlesCache[spreadsheetId];
  }
  const titles = await googleSheetsService.getAllSheetTitles(spreadsheetId);
  sheetTitlesCache[spreadsheetId] = titles;
  return titles;
}
