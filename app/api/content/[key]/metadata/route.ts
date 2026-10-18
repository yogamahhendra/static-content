import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { contents, categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ key: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { key } = await params;
    const db = getDb();

    const [content] = await db
      .select({
        key: contents.key,
        title: contents.title,
        description: contents.description,
        contentType: contents.contentType,
        fileExtension: contents.fileExtension,
        fileSize: contents.fileSize,
        checksum: contents.checksum,
        isActive: contents.isActive,
        updatedAt: contents.updatedAt,
        category: {
          name: categories.name,
          slug: categories.slug,
        },
      })
      .from(contents)
      .innerJoin(categories, eq(contents.categoryId, categories.id))
      .where(eq(contents.key, key))
      .limit(1);

    if (!content || !content.isActive) {
      return NextResponse.json({ error: "Content not found or inactive" }, { status: 404 });
    }

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const publicUrl = `${protocol}://${host}/api/content/${content.key}`;

    return NextResponse.json(
      {
        ...content,
        publicUrl,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3, s-maxage=5",
        },
      }
    );
  } catch (error: any) {
    console.error("Public metadata error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
