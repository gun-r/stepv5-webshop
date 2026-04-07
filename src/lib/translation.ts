import { Product } from "@/generated/prisma/client";

interface TranslateConfig {
  libreTranslateUrl: string;
  libreTranslateApiKey: string;
}

export async function translateText(
  text: string,
  targetLang: string,
  sourceLang: string,
  apiUrl: string,
  apiKey: string
): Promise<{ success: boolean; translated?: string; error?: string }> {
  if (!text || text.trim() === "") {
    return { success: true, translated: "" };
  }

  try {
    const url = `${apiUrl.replace(/\/$/, "")}/translate`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        api_key: apiKey,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg =
        (errorData as { error?: string }).error ||
        `HTTP ${response.status}: ${response.statusText}`;
      return { success: false, error: errorMsg };
    }

    const data = (await response.json()) as { translatedText: string };
    return { success: true, translated: data.translatedText };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Translation failed";
    return { success: false, error };
  }
}

export async function translateProduct(
  product: Product,
  targetLang: string,
  sourceLang: string,
  config: TranslateConfig,
  fields?: ("title" | "description" | "shortDescription")[]
): Promise<{
  success: boolean;
  title?: string;
  shortDescription?: string;
  description?: string;
  error?: string;
}> {
  const { libreTranslateUrl, libreTranslateApiKey } = config;
  const translateFields = fields ?? ["title", "description", "shortDescription"];

  if (!libreTranslateUrl) {
    return { success: false, error: "LibreTranslate URL not configured" };
  }

  let title: string | undefined;
  let shortDescription: string | undefined;
  let description: string | undefined;

  if (translateFields.includes("title")) {
    const r = await translateText(product.title, targetLang, sourceLang, libreTranslateUrl, libreTranslateApiKey);
    if (!r.success) return { success: false, error: r.error };
    title = r.translated;
  }

  if (translateFields.includes("shortDescription") && product.shortDescription) {
    const r = await translateText(product.shortDescription, targetLang, sourceLang, libreTranslateUrl, libreTranslateApiKey);
    if (!r.success) return { success: false, error: r.error };
    shortDescription = r.translated;
  }

  if (translateFields.includes("description") && product.description) {
    const r = await translateText(product.description, targetLang, sourceLang, libreTranslateUrl, libreTranslateApiKey);
    if (!r.success) return { success: false, error: r.error };
    description = r.translated;
  }

  return { success: true, title, shortDescription, description };
}
