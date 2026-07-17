import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const bucket = formData.get("bucket") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!bucket || (bucket !== "templates" && bucket !== "correspondences")) {
      return NextResponse.json(
        { error: "Invalid or missing bucket name" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${timestamp}_${sanitizedName}`;

    // Initialize Supabase Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY)");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Read file bytes
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Supabase Storage bucket
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Supabase storage upload error:", error);
      throw error;
    }

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filename);

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      name: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
