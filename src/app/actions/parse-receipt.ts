"use server";

import { workspace, services } from "@/lib/server";
import { receipts, profiles } from "@/lib/db/schema";
import { putReceipt, deleteReceipt } from "@/lib/storage";
import { and, eq, sql } from "drizzle-orm";
import { parseReceiptFields } from "@/lib/receipt-fields";
import { validateReceipt } from "@/lib/file-validation";

export type FieldConfidence = "high" | "medium" | "low";

/** Coerce whatever the model returns into our three-level enum (low = safe default). */
function normalizeConfidence(raw: unknown): FieldConfidence {
  return raw === "high" || raw === "medium" ? raw : "low";
}

export async function parseReceipt(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "No valid file provided" };
  }

  // Security: validate by real magic bytes + size — the browser Content-Type and
  // file extension are spoofable, so we never trust them for an upload.
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const check = validateReceipt(file.size, head);
  if (!check.ok) {
    return { error: check.error };
  }
  const sniffedMime = check.mime as string;

  const ws = await workspace();
  await ws.requireAccess();
  const { env } = await services();
  const receiptPath = `${ws.companyId}/${ws.user.id}/${crypto.randomUUID()}.${sniffedMime.split("/")[1]}`;
  let reserved = false;
  try {
    await ws.db.transaction(async (tx) => {
      await tx
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.id, ws.user.id))
        .for("update");
      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(receipts)
        .where(
          and(
            eq(receipts.user_id, ws.user.id),
            sql`${receipts.created_at} > now() - interval '1 hour'`,
          ),
        );
      if (count >= 50) throw new Error("Receipt upload limit reached");
      await tx.insert(receipts).values({
        path: receiptPath,
        company_id: ws.companyId,
        user_id: ws.user.id,
        mime: sniffedMime,
        size: file.size,
      });
    });
    reserved = true;
    await putReceipt(env, receiptPath, await file.arrayBuffer(), sniffedMime);
  } catch {
    if (reserved) {
      await ws.db
        .delete(receipts)
        .where(
          and(
            eq(receipts.path, receiptPath),
            eq(receipts.company_id, ws.companyId),
          ),
        );
      try {
        await deleteReceipt(env, receiptPath);
      } catch {
        console.error("Receipt cleanup failed");
      }
    }
    return {
      error:
        "Receipt could not be saved. Try again later or enter the expense manually.",
    };
  }
  const receiptUrl = "/api/receipts?path=" + encodeURIComponent(receiptPath);

  // 2. Process with Gemini Vision
  const apiKey = env.GEMINI_API_KEY as string | undefined;
  if (!apiKey) {
    return {
      error:
        "Receipt saved. Automatic extraction is unavailable; enter the details below.",
      receiptPath,
      receiptUrl,
    };
  }

  try {
    const bytes = await file.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString("base64");

    // We ask the model to self-report per-field confidence and overall
    // legibility. This is NOT a claim of correctness — it drives the review
    // UX: low-confidence fields are flagged so the human verifies them before
    // the expense is saved. The receipt image is always stored as the source
    // of truth; the extracted values are a draft the submitter confirms.
    const prompt =
      "You are extracting expense data from a photo of a receipt. Return ONLY a raw JSON " +
      "object (no Markdown, no code fences) with these exact keys:\n" +
      "- vendor (string): merchant/store name, '' if you cannot read it\n" +
      "- amount (number): the FINAL total paid, 0 if you cannot read it\n" +
      "- description (string): a short 2-4 word category, e.g. 'Hardware supplies', 'Lunch meeting'\n" +
      '- confidence (object): { "vendor": level, "amount": level, "description": level } ' +
      "where each level is exactly 'high', 'medium', or 'low', reflecting how clearly you could read that field\n" +
      "- legible (boolean): true if this is a clearly readable receipt, false if it is blurry, cropped, or not a receipt\n" +
      "If a value is unreadable, return the empty/zero value AND set its confidence to 'low'.";

    const model = String(env.GEMINI_MODEL ?? "gemini-2.5-flash");
    if (!/^[a-zA-Z0-9._-]+$/.test(model))
      throw new Error("Invalid extraction model");
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inlineData: { mimeType: sniffedMime, data: base64Image } },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: 512,
          },
        }),
      },
    );

    if (!res.ok) throw new Error(`Receipt extraction failed (${res.status})`);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    const jsonText = data.candidates[0].content.parts[0].text;
    const parsed = JSON.parse(jsonText);
    const validated = parseReceiptFields(parsed);

    return {
      success: true,
      receiptPath,
      receiptUrl,
      parsedData: {
        vendor: validated.vendor,
        amount: validated.amount,
        description: validated.description,
      },
      confidence: {
        vendor: normalizeConfidence(parsed.confidence?.vendor),
        amount: normalizeConfidence(parsed.confidence?.amount),
        description: normalizeConfidence(parsed.confidence?.description),
      },
      // Default to legible only when the model explicitly says so isn't false —
      // a missing flag shouldn't nag the user, but an explicit false should.
      legible: parsed.legible !== false,
    };
  } catch (err: unknown) {
    console.error("Receipt extraction failed", {
      name: err instanceof Error ? err.name : "unknown",
    });
    return {
      error: "Failed to parse receipt with AI. You can still submit manually.",
      receiptPath,
      receiptUrl,
    };
  }
}
