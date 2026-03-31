import { Site, Product, ProductTranslation } from "@/generated/prisma/client";

interface WooProduct {
  name: string;
  description: string;
  regular_price: string;
  sale_price?: string;
  sku?: string;
  images?: { src: string }[];
  categories?: { name: string }[];
  tags?: { name: string }[];
  status?: string;
}

function getAuthHeader(site: Site): string {
  const credentials = `${site.consumerKey}:${site.consumerSecret}`;
  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}

function buildWooPayload(
  product: Product,
  translation?: ProductTranslation | null
): WooProduct {
  const images = JSON.parse(product.images || "[]") as string[];
  const categories = JSON.parse(product.categories || "[]") as string[];
  const tags = JSON.parse(product.tags || "[]") as string[];

  return {
    name: translation?.title || product.title,
    description: translation?.description || product.description || "",
    regular_price: product.price,
    sale_price: product.salePrice || undefined,
    sku: product.sku || undefined,
    images: images.map((src) => ({ src })),
    categories: categories.map((name) => ({ name })),
    tags: tags.map((name) => ({ name })),
    status: product.status === "published" ? "publish" : "draft",
  };
}

export async function syncProductToSite(
  product: Product,
  site: Site,
  wooProductId: number | null,
  translation?: ProductTranslation | null
): Promise<{ success: boolean; wooProductId?: number; error?: string }> {
  const baseUrl = site.url.replace(/\/$/, "");
  const apiUrl = `${baseUrl}/wp-json/wc/v3/products`;
  const authHeader = getAuthHeader(site);
  const payload = buildWooPayload(product, translation);

  try {
    let response: Response;
    if (wooProductId) {
      response = await fetch(`${apiUrl}/${wooProductId}`, {
        method: "PUT",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } else {
      response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg =
        (errorData as { message?: string }).message ||
        `HTTP ${response.status}: ${response.statusText}`;
      return { success: false, error: errorMsg };
    }

    const data = (await response.json()) as { id: number };
    return { success: true, wooProductId: data.id };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error };
  }
}

export async function deleteProductFromSite(
  wooProductId: number,
  site: Site
): Promise<{ success: boolean; error?: string }> {
  const baseUrl = site.url.replace(/\/$/, "");
  const apiUrl = `${baseUrl}/wp-json/wc/v3/products/${wooProductId}?force=true`;
  const authHeader = getAuthHeader(site);

  try {
    const response = await fetch(apiUrl, {
      method: "DELETE",
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg =
        (errorData as { message?: string }).message ||
        `HTTP ${response.status}: ${response.statusText}`;
      return { success: false, error: errorMsg };
    }

    return { success: true };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error };
  }
}

export async function testSiteConnection(
  site: Site
): Promise<{ success: boolean; message: string }> {
  const baseUrl = site.url.replace(/\/$/, "");
  const apiUrl = `${baseUrl}/wp-json/wc/v3/products?per_page=1`;
  const authHeader = getAuthHeader(site);

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg =
        (errorData as { message?: string }).message ||
        `HTTP ${response.status}: ${response.statusText}`;
      return { success: false, message: errorMsg };
    }

    return { success: true, message: "Connection successful!" };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Connection failed";
    return { success: false, message: error };
  }
}
