"use server";

import { createClient } from "@/lib/supabase/server";
import { embedText } from "@/lib/voyage";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export type UploadCVState = {
  error?: string;
  success?: boolean;
};

/**
 * Upload a PDF CV: validate → extract text → store file → embed → persist.
 *
 * Uses the service-role client for Storage (simpler than wrestling with
 * storage RLS on the user's JWT) and the user's own client for the cvs
 * table INSERT (RLS ensures they can only write their own rows).
 */
export async function uploadCV(
  _prevState: UploadCVState,
  formData: FormData,
): Promise<UploadCVState> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) {
    return { error: "You must be signed in to upload a CV." };
  }

  // 1. Validate file
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { error: "Please select a PDF file to upload." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: "File is too large. Maximum size is 10 MB." };
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return { error: "Only PDF files are supported. Please upload a .pdf file." };
  }

  if (file.type && file.type !== "application/pdf") {
    return { error: "Only PDF files are supported. Please upload a .pdf file." };
  }

  // 2. Extract text from PDF using pdf2json (no worker dependency)
  let rawText: string;
  let pdfBuffer: ArrayBuffer;
  try {
    pdfBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(pdfBuffer);
    const pdf2json = await import("pdf2json");
    const PDFParser = pdf2json.default;
    rawText = await new Promise<string>((resolve, reject) => {
      const parser = new PDFParser();
      parser.on("pdfParser_dataReady", (pdfData: {
        Pages?: { Texts?: { R: { T: string }[] }[] }[];
      }) => {
        const parts: string[] = [];
        for (const page of pdfData.Pages ?? []) {
          for (const text of page.Texts ?? []) {
            parts.push(decodeURIComponent(text.R[0].T));
          }
        }
        resolve(parts.join(" "));
      });
      parser.on("pdfParser_dataError", (err: unknown) => reject(err));
      parser.parseBuffer(buffer);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[uploadCV] PDF extraction failed:", message);
    return {
      error: `Could not extract text from this PDF: ${message}. Make sure it's a valid, text-based PDF (not scanned images).`,
    };
  }

  if (!rawText || rawText.trim().length === 0) {
    return {
      error:
        "No text found in this PDF. It may be a scanned image or empty document.",
    };
  }

  // 3. Upload raw PDF to Supabase Storage
  const cvId = randomUUID();
  const storagePath = `${user.id}/${cvId}.pdf`;

  try {
    // Use the user's own client for storage upload — RLS policy allows
    // writing to {userId}/... paths, so service role isn't needed.
    const { error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("[uploadCV] Storage upload failed:", uploadError);
      return {
        error: `Failed to store your CV: ${uploadError.message}`,
      };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[uploadCV] Storage upload exception:", message);
    return {
      error: `Failed to store your CV: ${message}`,
    };
  }

  // 4. Embed text via Voyage AI
  let embedding: number[];
  try {
    const result = await embedText(rawText);
    embedding = result.vector;
  } catch (err) {
    console.error("[uploadCV] Voyage embedding failed:", err);
    return {
      error:
        "Failed to analyze your CV. The file was saved but search won't work until we can process it. Please try again or contact support.",
    };
  }

  // 5. Insert into cvs table
  const { error: insertError } = await supabase.from("cvs").insert({
    id: cvId,
    user_id: user.id,
    file_path: storagePath,
    original_filename: file.name,
    raw_text: rawText,
    embedding: embedding as unknown as string, // pgvector accepts number[] via Supabase JS
  });

  if (insertError) {
    console.error("[uploadCV] DB insert failed:", insertError);
    return {
      error:
        "Failed to save your CV data. The file was uploaded but the record couldn't be created. Please try again.",
    };
  }

  // 6. Success — redirect to profile
  revalidatePath("/app/profile");
  redirect("/app/profile");
}
