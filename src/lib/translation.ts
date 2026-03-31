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
  config: TranslateConfig
): Promise<{
  success: boolean;
  title?: string;
  description?: string;
  error?: string;
}> {
  const { libreTranslateUrl, libreTranslateApiKey } = config;

  if (!libreTranslateUrl) {
    return { success: false, error: "LibreTranslate URL not configured" };
  }

  const titleResult = await translateText(
    product.title,
    targetLang,
    sourceLang,
    libreTranslateUrl,
    libreTranslateApiKey
  );

  if (!titleResult.success) {
    return { success: false, error: titleResult.error };
  }

  let descriptionResult: { success: boolean; translated?: string; error?: string } = {
    success: true,
    translated: "",
  };

  if (product.description) {
    descriptionResult = await translateText(
      product.description,
      targetLang,
      sourceLang,
      libreTranslateUrl,
      libreTranslateApiKey
    );
    if (!descriptionResult.success) {
      return { success: false, error: descriptionResult.error };
    }
  }

  return {
    success: true,
    title: titleResult.translated,
    description: descriptionResult.translated || undefined,
  };
}
