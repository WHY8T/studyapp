import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const fileName = `${user.id}/${Date.now()}-${file.name}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("pdfs")
      .upload(fileName, fileBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload PDF" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("pdfs").getPublicUrl(fileName);

    // Parse PDF text using pdf-parse
    let text = "";
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const buffer = Buffer.from(fileBuffer);
      const pdfData = await pdfParse(buffer);
      text = pdfData.text;
    } catch (parseError) {
      console.error("PDF parse error:", parseError);
      // Return upload URL even if parsing fails
      return NextResponse.json({
        text: "",
        pdfUrl: urlData.publicUrl,
        filename: file.name,
        warning: "PDF uploaded but text extraction failed. Quiz generation may be limited.",
      });
    }

    return NextResponse.json({
      text,
      pdfUrl: urlData.publicUrl,
      filename: file.name,
      pageCount: text.split("\n\n").length,
      charCount: text.length,
    });
  } catch (error: any) {
    console.error("PDF parse route error:", error);
    return NextResponse.json({ error: error.message || "Failed to process PDF" }, { status: 500 });
  }
}
