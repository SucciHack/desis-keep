/**
 * Converts hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Converts RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

/**
 * Darkens a color by a percentage (0-1)
 */
export function darkenColor(hex: string, amount: number = 0.3): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const r = Math.max(0, rgb.r * (1 - amount));
  const g = Math.max(0, rgb.g * (1 - amount));
  const b = Math.max(0, rgb.b * (1 - amount));

  return rgbToHex(r, g, b);
}

/**
 * Adjusts color for dark mode - darkens bright colors while maintaining distinction
 */
export function adjustColorForDarkMode(hex: string, isDark: boolean): string {
  if (!isDark) return hex;
  
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  // Calculate luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  // For very light colors (like white), darken significantly
  if (luminance > 0.9) {
    return darkenColor(hex, 0.7);
  }
  
  // For bright colors, darken moderately
  if (luminance > 0.6) {
    return darkenColor(hex, 0.4);
  }
  
  // For medium colors, darken slightly
  if (luminance > 0.3) {
    return darkenColor(hex, 0.2);
  }
  
  // For already dark colors, keep them or lighten slightly
  return hex;
}

/**
 * Gets text color (black or white) based on background luminance
 */
export function getContrastTextColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#000000";

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}
