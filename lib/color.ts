import { extractCarType } from "./car-type";

export function resolveProtonColorName(rawColor: string | null | undefined, carType?: string): string {
  if (!rawColor) return "";
  const cleaned = rawColor.trim();
  if (!cleaned) return "";

  const code = cleaned.toUpperCase().replace(/[\s_-]+/g, "");
  const model = (carType || "").toUpperCase();
  const isS70 = model.includes("S70");
  const isX50 = model.includes("X50");
  const isX70 = model.includes("X70");
  const isX90 = model.includes("X90");

  // Check known full color names first
  const lower = cleaned.toLowerCase();
  if (lower.includes("snow white") || lower === "white" || lower === "solid white") return "Snow White";
  if (lower.includes("armour silver") || lower.includes("armor silver") || lower === "silver") return "Armour Silver";
  if (lower.includes("jet grey") || lower.includes("jet gray")) return "Jet Grey";
  if (lower.includes("space grey") || lower.includes("space gray")) return "Space Grey";
  if (lower.includes("ruby red")) return "Ruby Red";
  if (lower.includes("passion red")) return "Passion Red";
  if (lower.includes("deep marine blue")) return "Deep Marine Blue";
  if (lower.includes("marine blue")) return "Marine Blue";
  if (lower.includes("ocean blue")) return "Ocean Blue";
  if (lower.includes("teal bayou green") || lower.includes("bayou green") || lower.includes("teal green")) return "Teal Bayou Green";
  if (lower.includes("citric orange")) return "Citric Orange";
  if (lower.includes("cinnamon brown")) return "Cinnamon Brown";
  if (lower.includes("rosewood maroon") || lower.includes("maroon")) return "Rosewood Maroon";
  if (lower.includes("quartz black") || lower.includes("space black") || lower === "black") return "Quartz Black";

  // Code-based mapping for Proton Connected Services / ACO Tech ATLAS & ECARX
  // White
  if (["WH01", "WH02", "W01", "W02", "WH", "WHT", "SW", "01", "1"].includes(code)) {
    return "Snow White";
  }

  // Silver
  if (["SI01", "SI02", "S01", "S02", "SI", "SLV", "AS", "02", "2"].includes(code)) {
    return "Armour Silver";
  }

  // Grey
  if (["GR01", "G01", "JG", "03", "3"].includes(code)) {
    return isS70 ? "Space Grey" : "Jet Grey";
  }
  if (["GR02", "G02", "SG", "SPG"].includes(code)) {
    return isS70 ? "Teal Bayou Green" : "Space Grey";
  }

  // Red
  if (["RE01", "R01", "RR", "PR", "04", "4"].includes(code)) {
    return isX50 || isS70 ? "Passion Red" : "Ruby Red";
  }
  if (["RE02", "R02"].includes(code)) {
    return isX70 ? "Passion Red" : "Ruby Red";
  }

  // Blue
  if (["BL01", "B01", "MB", "OB", "05", "5"].includes(code)) {
    return isX50 ? "Ocean Blue" : "Marine Blue";
  }
  if (["BL02", "B02"].includes(code)) {
    return isX90 ? "Deep Marine Blue" : "Ocean Blue";
  }
  if (["DMB", "BL03"].includes(code)) {
    return "Deep Marine Blue";
  }

  // Green / Teal
  if (["TE01", "TE02", "TBG", "TB01", "07", "7"].includes(code)) {
    return "Teal Bayou Green";
  }

  // Orange
  if (["OR01", "OR02", "O01", "CO", "06", "6"].includes(code)) {
    return isX70 ? "Cinnamon Brown" : "Citric Orange";
  }

  // Brown
  if (["BR01", "BR02", "CB", "BRN"].includes(code)) {
    return "Cinnamon Brown";
  }

  // Maroon
  if (["RM01", "RM", "MAR"].includes(code)) {
    return "Rosewood Maroon";
  }

  // Black
  if (["BK01", "BK02", "QB", "BLK", "08", "8"].includes(code)) {
    return "Quartz Black";
  }

  // Prefix matching fallback for code-like inputs
  if (code.startsWith("WH") || code.startsWith("WHT")) return "Snow White";
  if (code.startsWith("SI") || code.startsWith("SLV")) return "Armour Silver";
  if (code.startsWith("GR") || code.startsWith("GRY")) return isS70 ? "Space Grey" : "Jet Grey";
  if (code.startsWith("RE") || code.startsWith("RED")) return isX50 || isS70 ? "Passion Red" : "Ruby Red";
  if (code.startsWith("BL") || code.startsWith("BLU")) return isX50 ? "Ocean Blue" : "Marine Blue";
  if (code.startsWith("TE")) return "Teal Bayou Green";
  if (code.startsWith("OR") || code.startsWith("ORG")) return "Citric Orange";
  if (code.startsWith("BR") || code.startsWith("BRN")) return "Cinnamon Brown";
  if (code.startsWith("BK") || code.startsWith("BLK")) return "Quartz Black";

  // If already a regular word / phrase with letters and spaces, format as Title Case
  if (!/^[A-Z0-9_-]{2,6}$/.test(cleaned) && /^[a-zA-Z\s]+$/.test(cleaned)) {
    return cleaned
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  return cleaned;
}
