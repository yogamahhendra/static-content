import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { contents } from "@/lib/db/schema";
import { getFromStorage } from "@/lib/storage/s3";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ key: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { key } = await params;
    const db = getDb();

    // 1. Look up active content record
    const [content] = await db
      .select()
      .from(contents)
      .where(eq(contents.key, key))
      .limit(1);

    if (!content || !content.isActive) {
      return new NextResponse("Content Not Found or Inactive", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // 2. Conditional GET check (ETag / If-None-Match)
    const clientEtag = request.headers.get("if-none-match");
    if (clientEtag && content.checksum && clientEtag.replace(/"/g, "") === content.checksum) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: `"${content.checksum}"`,
          "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
        },
      });
    }

    // 3. Fetch from object storage
    const storageItem = await getFromStorage(content.storageKey);
    if (!storageItem || !storageItem.body) {
      console.error(`Object missing in storage for key: ${content.storageKey}`);
      return new NextResponse("Underlying file not found in storage", {
        status: 404,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Convert AWS SDK stream to Web ReadableStream
    const stream = storageItem.body.transformToWebStream();

    const headers = new Headers();
    headers.set("Content-Type", content.contentType || "application/octet-stream");
    if (content.fileSize) {
      headers.set("Content-Length", String(content.fileSize));
    }
    if (content.checksum) {
      headers.set("ETag", `"${content.checksum}"`);
    }

    // Caching & Security headers
    headers.set("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=86400");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Content-Disposition", `inline; filename="${content.key}.${content.fileExtension}"`);

    return new NextResponse(stream as any, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Public content delivery error:", error);
    return new NextResponse("Internal Server Error", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
