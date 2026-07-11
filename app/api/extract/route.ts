import { NextRequest, NextResponse } from "next/server";
import { extractLeadsWithGemini } from "@/lib/gemini";
import { RawRow } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing GEMINI_API_KEY. Set it in your environment variables." },
      { status: 500 },
    );
  }

  let body: { rows?: RawRow[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rows = body.rows;
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No rows provided. Upload a non-empty CSV first." }, { status: 400 });
  }
  if (rows.length > 2000) {
    return NextResponse.json(
      { error: "This demo caps uploads at 2000 rows per request. Split larger files." },
      { status: 400 },
    );
  }

  // Stream newline-delimited JSON: progress events while batches complete,
  // then a single final "result" event. Keeps the UI honest on large files
  // instead of one long silent spinner.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      try {
        const result = await extractLeadsWithGemini(rows, apiKey, (done, total) => {
          send({ type: "progress", done, total });
        });
        send({ type: "result", ...result });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error during AI extraction.";
        send({ type: "error", error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
  });
}