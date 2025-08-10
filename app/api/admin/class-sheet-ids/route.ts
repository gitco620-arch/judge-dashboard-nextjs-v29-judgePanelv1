import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export async function GET() {
  const filePath = path.resolve(process.cwd(), "config/class-sheet-ids.json");
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const ids = JSON.parse(raw);
    return NextResponse.json({ success: true, ids });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Could not load class sheet IDs." }, { status: 500 });
  }
}