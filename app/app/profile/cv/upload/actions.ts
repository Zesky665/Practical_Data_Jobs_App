"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
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

  // 2. Extract text from PDF using pdfjs-dist
  let rawText: string;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    // Polyfill Promise.withResolvers (Node 20 doesn't have it; pdfjs-dist v4 needs it)
    if (!(Promise as unknown as { withResolvers?: unknown }).withResolvers) {
      (Promise as unknown as Record<string, unknown>).withResolvers = function <T>() {
        let resolve!: (value: T | PromiseLike<T>) => void;
        let reject!: (reason?: unknown) => void;
        const promise = new Promise<T>((res, rej) => {
          resolve = res;
          reject = rej;
        });
        return { promise, resolve, reject };
      };
    }

    const pdfjs = await import("pdfjs-dist");
    const doc = await pdfjs.getDocument({ data: uint8Array }).promise;
    const parts: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      parts.push(pageText);
    }
    rawText = parts.join("\n\n");
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
    const serviceClient = createServiceClient();
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await serviceClient.storage
      .from("cvs")
      .upload(storagePath, arrayBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("[uploadCV] Storage upload failed:", uploadError);
      return {
        error:
          "Failed to store your CV file. Please try again. If the problem persists, contact support.",
      };
    }
  } catch (err) {
    console.error("[uploadCV] Storage upload exception:", err);
    return {
      error:
        "Failed to store your CV file. Please try again.",
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
