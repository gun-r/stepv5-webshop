import { Product } from "@/generated/prisma/client";

const MYMEMORY_URL = "https://api.mymemory.translated.net/get";

export async function translateText(
  text: string,
  targetLang: string,
  sourceLang: string,
  email?: string
): Promise<{ success: boolean; translated?: string; error?: string }> {
  if (!text || text.trim() === "") {
    return { success: true, translated: "" };
  }

  try {
    const params = new URLSearchParams({
      q: text,
      langpair: `${sourceLang}|${targetLang}`,
      ...(email ? { de: email } : {}),
    });

    const response = await fetch(`${MYMEMORY_URL}?${params.toString()}`);

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const data = await response.json() as {
      responseStatus: number;
      responseData: { translatedText: string };
      responseDetails?: string;
    };

    if (data.responseStatus !== 200) {
      return { success: false, error: data.responseDetails || `MyMemory error ${data.responseStatus}` };
    }

    return { success: true, translated: data.responseData.translatedText };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Translation failed";
    return { success: false, error };
  }
}

export async function translateProduct(
  product: Product,
  targetLang: string,
  sourceLang: string,
  email?: string,
  fields?: ("title" | "description" | "shortDescription")[]
): Promise<{
  success: boolean;
  title?: string;
  shortDescription?: string;
  description?: string;
  error?: string;
}> {
  const translateFields = fields ?? ["title", "description", "shortDescription"];

  let title: string | undefined;
  let shortDescription: string | undefined;
  let description: string | undefined;

  if (translateFields.includes("title")) {
    const r = await translateText(product.title, targetLang, sourceLang, email);
    if (!r.success) return { success: false, error: r.error };
    title = r.translated;
  }

  if (translateFields.includes("shortDescription") && product.shortDescription) {
    const r = await translateText(product.shortDescription, targetLang, sourceLang, email);
    if (!r.success) return { success: false, error: r.error };
    shortDescription = r.translated;
  }

  if (translateFields.includes("description") && product.description) {
    const r = await translateText(product.description, targetLang, sourceLang, email);
    if (!r.success) return { success: false, error: r.error };
    description = r.translated;
  }

  return { success: true, title, shortDescription, description };
}
