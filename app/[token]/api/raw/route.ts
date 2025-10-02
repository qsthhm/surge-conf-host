import { NextResponse } from "next/server";
import { readCurrent } from "@/lib/store";

export async function GET() {
  const content = await readCurrent();
  return new NextResponse(content || "", {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Disposition": "attachment; filename=\"surge.conf\""
    },
  });
}
