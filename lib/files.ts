import "server-only";

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_TYPES: Record<string, "pdf" | "txt" | "docx" | "md"> = {
  "application/pdf": "pdf",
  "text/plain": "txt",
  "text/markdown": "md",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export function detectType(file: File): "pdf" | "txt" | "docx" | "md" | null {
  const byMime = ALLOWED_TYPES[file.type];
  if (byMime) return byMime;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "txt") return "txt";
  if (ext === "md") return "md";
  if (ext === "docx") return "docx";
  return null;
}

export async function extractText(file: File, type: "pdf" | "txt" | "docx" | "md"): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (type === "txt" || type === "md") return buffer.toString("utf8");
  if (type === "pdf") {
    const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default as (b: Buffer) => Promise<{ text: string }>;
    const data = await pdfParse(buffer);
    return data.text;
  }
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export function cleanText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
