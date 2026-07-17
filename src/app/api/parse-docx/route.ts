import { NextResponse } from "next/server";
import mammoth from "mammoth";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await mammoth.convertToHtml({ buffer });

    return NextResponse.json({
      html: result.value,
      messages: result.messages
    });
  } catch (error) {
    console.error("Error parsing DOCX:", error);
    return NextResponse.json(
      { error: "Failed to parse DOCX file" },
      { status: 500 }
    );
  }
}
