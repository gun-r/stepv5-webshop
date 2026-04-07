import { readFile } from "fs/promises";
import { join, extname } from "path";
import { Site, Product, ProductTranslation } from "@/generated/prisma/client";

interface WooProduct {
  name: string;
  type: string;
  description: string;
  short_description: string;
  regular_price: string;
  sale_price?: string;
  sku?: string;
  manage_stock: boolean;
  stock_quantity?: number | null;
  images?: { src: string }[];
  categories?: { id: number }[];
  tags?: { id: number }[];
  status?: string;
  attributes?: WooAttribute[];
}

interface WooAttribute {
  name: string;
  options: string[];
  variation: boolean;
  visible: boolean;
}

interface VariationAttribute { name: string; options: string[]; }
interface VariationItem {
  id: string;
  attr: Record<string, string>;
  price: string;
  salePrice: string;
  sku: string;
  manageStock: boolean;
  stock: number | null;
}
interface VariationsData { attributes: VariationAttribute[]; items: VariationItem[]; }

function getAuthHeader(site: Site): string {
  const credentials = `${site.consumerKey}:${site.consumerSecret}`;
  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}

function parseVariations(variationsStr: string): VariationsData {
  try {
    const data = JSON.parse(variationsStr || "{}") as VariationsData;
    if (!data?.attributes) return { attributes: [], items: [] };
    return data;
  } catch {
    return { attributes: [], items: [] };
  }
}

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp",
};

/**
 * For local /uploads/ paths: upload the file directly to the WordPress
 * media library and return the public https:// URL.
 */
async function resolveImageUrl(src: string, site: Site): Promise<string | null> {
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (!site.wpUsername || !site.wpAppPassword) return null;

  try {
    const localPath = join(process.cwd(), "public", src.replace(/^\//, ""));
    const buffer = await readFile(localPath);
    const filename = src.split("/").pop() || "image.jpg";
    const ext = extname(filename).toLowerCase();
    const mimeType = MIME_MAP[ext] || "image/jpeg";

    const wpBase = site.url.replace(/\/$/, "");
    const mediaUrl = `${wpBase}/wp-json/wp/v2/media`;
    const auth = Buffer.from(`${site.wpUsername}:${site.wpAppPassword}`).toString("base64");

    const res = await fetch(mediaUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": mimeType,
      },
      body: buffer,
    });

    if (!res.ok) return null;
    const data = (await res.json()) as { source_url: string };
    return data.source_url;
  } catch {
    return null;
  }
}

/**
 * Resolve a list of term names (categories or tags) to WooCommerce IDs.
 * Searches for existing terms first; creates any that are missing.
 */
async function resolveWooTerms(
  names: string[],
  endpoint: string, // e.g. ".../wc/v3/products/categories"
  authHeader: string
): Promise<{ id: number }[]> {
  if (names.length === 0) return [];

  const ids: { id: number }[] = [];

  for (const name of names) {
    if (!name.trim()) continue;
    try {
      // Search for existing term
      const searchRes = await fetch(
        `${endpoint}?search=${encodeURIComponent(name.trim())}&per_page=10`,
        { headers: { Authorization: authHeader } }
      );
      if (searchRes.ok) {
        const found = (await searchRes.json()) as { id: number; name: string }[];
        const match = found.find(
          (t) => t.name.toLowerCase() === name.trim().toLowerCase()
        );
        if (match) {
          ids.push({ id: match.id });
          continue;
        }
      }

      // Create new term
      const createRes = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (createRes.ok) {
        const created = (await createRes.json()) as { id: number };
        ids.push({ id: created.id });
      }
    } catch {
      // Best effort — skip term on error
    }
  }

  return ids;
}

async function buildWooPayload(
  product: Product,
  site: Site,
  translation?: ProductTranslation | null
): Promise<WooProduct> {
  const images = JSON.parse(product.images || "[]") as string[];
  const categories = JSON.parse(product.categories || "[]") as string[];
  const tags = JSON.parse(product.tags || "[]") as string[];
  const variations = parseVariations(product.variations || "{}");

  const isVariable = product.productType === "variable";
  const baseUrl = site.url.replace(/\/$/, "");
  const authHeader = getAuthHeader(site);

  // Resolve images
  const resolvedImages = (
    await Promise.all(images.map((src) => resolveImageUrl(src, site)))
  ).filter((src): src is string => src !== null);

  // Resolve categories and tags to WooCommerce IDs
  const [resolvedCategories, resolvedTags] = await Promise.all([
    resolveWooTerms(categories, `${baseUrl}/wp-json/wc/v3/products/categories`, authHeader),
    resolveWooTerms(tags, `${baseUrl}/wp-json/wc/v3/products/tags`, authHeader),
  ]);

  const payload: WooProduct = {
    name: translation?.title || product.title,
    type: isVariable ? "variable" : "simple",
    description: translation?.description || product.description || "",
    short_description: translation?.shortDescription || product.shortDescription || "",
    regular_price: isVariable ? "" : (translation?.price || product.price),
    sale_price: !isVariable ? (translation?.salePrice || product.salePrice || undefined) : undefined,
    sku: product.sku || undefined,
    manage_stock: !isVariable && product.manageStock,
    stock_quantity: !isVariable && product.manageStock ? product.stockQuantity : null,
    images: resolvedImages.map((src) => ({ src })),
    categories: resolvedCategories,
    tags: resolvedTags,
    status: product.status === "published" ? "publish" : "draft",
  };

  if (isVariable && variations.attributes.length > 0) {
    payload.attributes = variations.attributes.map((attr) => ({
      name: attr.name,
      options: attr.options,
      variation: true,
      visible: true,
    }));
  }

  return payload;
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
  const payload = await buildWooPayload(product, site, translation);

  try {
    let response: Response;
    if (wooProductId) {
      response = await fetch(`${apiUrl}/${wooProductId}`, {
        method: "PUT",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      response = await fetch(apiUrl, {
        method: "POST",
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
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

    if (product.productType === "variable") {
      await syncVariationsToWoo(product, data.id, baseUrl, authHeader);
    }

    return { success: true, wooProductId: data.id };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error };
  }
}

async function syncVariationsToWoo(
  product: Product,
  wooProductId: number,
  baseUrl: string,
  authHeader: string
): Promise<void> {
  const variations = parseVariations(product.variations || "{}");
  if (variations.items.length === 0) return;

  const varUrl = `${baseUrl}/wp-json/wc/v3/products/${wooProductId}/variations`;

  try {
    const existing = await fetch(`${varUrl}?per_page=100`, {
      headers: { Authorization: authHeader },
    });
    if (existing.ok) {
      const existingVars = (await existing.json()) as { id: number }[];
      for (const v of existingVars) {
        await fetch(`${varUrl}/${v.id}?force=true`, {
          method: "DELETE",
          headers: { Authorization: authHeader },
        });
      }
    }
  } catch { /* best effort */ }

  for (const item of variations.items) {
    const varPayload = {
      regular_price: item.price || "0",
      sale_price: item.salePrice || undefined,
      sku: item.sku || undefined,
      manage_stock: item.manageStock,
      stock_quantity: item.manageStock ? item.stock : null,
      attributes: Object.entries(item.attr).map(([name, option]) => ({ name, option })),
    };
    await fetch(varUrl, {
      method: "POST",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
      body: JSON.stringify(varPayload),
    }).catch(() => { /* best effort per variation */ });
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
      headers: { Authorization: authHeader },
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
      headers: { Authorization: authHeader },
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
