/**
 * Proton Vehicle Art & Image Resolution Helper
 * Provides curated authentic photographic assets and safe URL resolution
 * for Proton models (S70, X70, X50, etc.) across various colors.
 */

export function getDefaultCarImage(carType?: string | null, colorName?: string | null): string | null {
  const model = (carType || "").toUpperCase();
  const color = (colorName || "").toLowerCase();

  if (model.includes("S70")) {
    if (color.includes("blue") || color.includes("marine")) {
      return "/vehicles/s70-blue.jpg";
    }
    // S70 Armour Silver (or default S70)
    return "/vehicles/s70-silver.jpg";
  }

  if (model.includes("X70")) {
    return "/vehicles/x70.jpg";
  }

  if (model.includes("X50")) {
    return "/vehicles/x50.jpg";
  }

  return null;
}

export function sanitizeCarImageUrl(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined" || trimmed === "--") return null;
  // Upgrade insecure HTTP links from ACO Tech / Proton domains to HTTPS to prevent mixed-content blocking
  if (trimmed.startsWith("http://") && (trimmed.includes("acotech.my") || trimmed.includes("proton"))) {
    return trimmed.replace(/^http:\/\//i, "https://");
  }
  return trimmed;
}
