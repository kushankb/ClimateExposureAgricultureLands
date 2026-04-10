/**
 * Tileset IDs & Layer Configuration
 * -----------------------------------------
 * Breadbaskets  = Mapbox-hosted vector tileset (dot layer by food group)
 * Weather extremes + farm size = static PNG raster tiles shipped with the app
 * Each climate variable has p05/p50/p95 tile directories; percentile selector switches them.
 */

// -- Food group colour palette (bright for dark backgrounds) -----------------
export const FOOD_GROUP_COLORS = {
  starches:             { color: "#f5c542", label: "Starches",            desc: "Wheat, rice, maize, potatoes, cassava & other starchy staples" },
  meat_and_fish:        { color: "#ff6b6b", label: "Meat & Fish",         desc: "Beef, pork, poultry, seafood & other animal proteins" },
  dairy_and_eggs:       { color: "#fff06a", label: "Dairy & Eggs",        desc: "Milk, cheese, butter, yoghurt & eggs" },
  fruits:               { color: "#7dde60", label: "Fruits",              desc: "Tropical, temperate & citrus fruits (bananas, apples, oranges, etc.)" },
  vegetables:           { color: "#3dcc3d", label: "Vegetables",          desc: "Leafy greens, tomatoes, onions, peppers & other vegetables" },
  oils_and_oilseed:     { color: "#e89840", label: "Oils & Oilseeds",    desc: "Soybean, palm, rapeseed, sunflower & other oil crops" },
  pulses:               { color: "#c4855c", label: "Pulses",             desc: "Lentils, chickpeas, beans, peas & other legumes" },
  sugar_and_sweeteners: { color: "#d49ce8", label: "Sugar & Sweeteners", desc: "Sugarcane, sugar beet & other sweetener crops" },
  treenuts:             { color: "#5ea54a", label: "Tree Nuts",           desc: "Almonds, cashews, walnuts, pistachios & other tree nuts" },
  other:                { color: "#aaaaaa", label: "Other",               desc: "Spices, cocoa, coffee, tea & other crops" },
};

// Integer codes used in the compact vector tiles (must match process_breadbaskets.py)
// Order matches FOOD_GROUP_MAP in the python script.
export const FOOD_GROUP_CODES = {
  dairy_and_eggs:       0,
  fruits:               1,
  meat_and_fish:        2,
  oils_and_oilseed:     3,
  other:                4,
  pulses:               5,
  starches:             6,
  sugar_and_sweeteners: 7,
  treenuts:             8,
  vegetables:           9,
};
export const FOOD_GROUP_BY_CODE = Object.fromEntries(
  Object.entries(FOOD_GROUP_CODES).map(([k, v]) => [v, k])
);

// -- Breadbasket (vector tile -- toggleable base layer) -----------------------
// The packed tile has a single integer property `c` where:
//   c = z*100 + s*10 + r   (z=zscore code, s=share code, r=rank code, 0-9 each)
export const BREADBASKET = {
  id: "kushankb.breadbaskets4",
  layer: "breadbaskets",
  label: "Food Breadbaskets",
  groupKey: "zscore",     // default method key — overridden by selected method
  valueKey: "c",
};

// Mapbox GL JS expression that extracts the integer code for a given method
// from the packed `c` property.
export function methodCodeExpr(methodKey) {
  if (methodKey === "zscore") {
    return ["floor", ["/", ["get", "c"], 100]];
  }
  if (methodKey === "share") {
    return ["floor", ["/", ["%", ["get", "c"], 100], 10]];
  }
  // rank
  return ["%", ["get", "c"], 10];
}

// JS-side decoder for popups etc.
export function decodePackedC(c, methodKey) {
  if (c == null) return null;
  if (methodKey === "zscore") return Math.floor(c / 100);
  if (methodKey === "share")  return Math.floor((c % 100) / 10);
  return c % 10; // rank
}

// -- Breadbasket classification methods ----------------------------------------
// Each method defines how the "dominant food group" is determined per pixel.
// `groupKey` is the vector-tile property that holds the dominant food group name.
export const BREADBASKET_METHODS = {
  zscore: {
    key: "zscore",
    label: "Z-Score",
    groupKey: "zscore",
    short: "Most unusually high food group",
    description:
      "Which food group is most unusually high at this pixel, relative to its own global distribution?",
  },
  rank: {
    key: "rank",
    label: "Rank-Based",
    groupKey: "rank",
    short: "How specialized a location is",
    description:
      "How strongly specialized a location is. High margin = monoculture-like; low margin = diversified.",
  },
};

// -- Admin boundaries (vector tiles -- click/hover interaction) ───────────────
// Country boundaries shown z0–z3, state/province boundaries shown z4+
export const COUNTRY_BOUNDARIES = {
  id: "kushankb.01l11tz3",
  layer: "countries",
  label: "Countries",
  idKey: "iso3",
};

export const ADMIN2_STATES = {
  id: "kushankb.69o1u9mn",
  layer: "admin2",
  label: "States / Provinces",
  idKey: "ID",
};

// -- Layer descriptions (for button hover tooltips) ---------------------------
// Each entry has `text` (main description) and optional `source` (citation).
export const LAYER_DESCRIPTIONS = {
  breadbaskets: {
    text: "Food-producing areas coloured by the food group most concentrated in each location relative to global averages. Shows regional specialisation, not absolute production.",
    source: "Plotline breadbasket dataset · Z-score classification",
  },
  CDD: {
    text: "Change in maximum consecutive dry days during the growing season under 2\u00b0C warming. Positive = more drought stress.",
    source: "Bajaj et al. 2025, Environ. Res. Lett.",
  },
  FD: {
    text: "Absolute change in frost days (Tmin < 0\u00b0C) during the growing season under 2\u00b0C warming. Negative = fewer frosts.",
    source: "Bajaj et al. 2025, Environ. Res. Lett.",
  },
  Rx5: {
    text: "Change in maximum 5-day cumulative precipitation during the growing season under 2\u00b0C warming. Positive = heavier extreme rainfall.",
    source: "Bajaj et al. 2025, Environ. Res. Lett.",
  },
  Tx35: {
    text: "Change in days when Tmax exceeds 35\u00b0C during the growing season under 2\u00b0C warming. Positive = more extreme heat days.",
    source: "Bajaj et al. 2025, Environ. Res. Lett.",
  },
  farmsize: {
    text: "Dominant farm size (hectares). Smaller values indicate smallholder-dominated areas.",
    source: "Mehrabi & Ricciardi 2024 (doi:10.7927/WVJE-SN95)",
  },
};

// -- Raster overlays (weather extremes + farm size) ---------------------------
// All raster tiles are static PNGs in public/tiles/{tileDir}/{z}/{x}/{y}.png
// Climate variables have 3 tile directories (p05/p50/p95); farm size has one.
export const RASTER_OVERLAYS = {
  CDD: {
    tileDir: {
      p05: "CDD_p05",
      p50: "CDD_p50",
      p95: "CDD_p95",
    },
    label: "Consecutive Dry Days",
    description: "% change in CDD during growing season (CMIP6 SSP2-4.5)",
    unit: "% change",
    legendColors: [
      { value: -50,  color: "#2166ac", label: "-50%" },
      { value:   0,  color: "#f7f7f7", label: "0%" },
      { value:  50,  color: "#d73027", label: "+50%" },
      { value: 100,  color: "#7f0000", label: "+100%" },
    ],
  },
  FD: {
    tileDir: {
      p05: "FD_p05",
      p50: "FD_p50",
      p95: "FD_p95",
    },
    label: "Frost Days",
    description: "Absolute change in frost days (CMIP6 SSP2-4.5)",
    unit: "days change",
    legendColors: [
      { value: -100, color: "#08306b", label: "-100d" },
      { value: -50,  color: "#2171b5", label: "-50d" },
      { value: -20,  color: "#6baed6", label: "-20d" },
      { value:   0,  color: "#f7fbff", label: "0d" },
    ],
  },
  Rx5: {
    tileDir: {
      p05: "Rx5_p05",
      p50: "Rx5_p50",
      p95: "Rx5_p95",
    },
    label: "Max 5-Day Rainfall",
    description: "% change in max 5-day precipitation (CMIP6 SSP2-4.5)",
    unit: "% change",
    legendColors: [
      { value: -30,  color: "#f7fcf0", label: "-30%" },
      { value:   0,  color: "#c7e9c0", label: "0%" },
      { value:  30,  color: "#238b45", label: "+30%" },
      { value:  60,  color: "#00441b", label: "+60%" },
    ],
  },
  Tx35: {
    tileDir: {
      p05: "Tx35_p05",
      p50: "Tx35_p50",
      p95: "Tx35_p95",
    },
    label: "Days Tmax > 35\u00b0C",
    description: "Projected days with Tmax > 35\u00b0C (CMIP6 SSP2-4.5, absolute)",
    unit: "days change",
    legendColors: [
      { value:   0,  color: "#fff5f0", label: "0d" },
      { value:  30,  color: "#fb6a4a", label: "30d" },
      { value:  60,  color: "#cb181d", label: "60d" },
      { value: 120,  color: "#67000d", label: "120d" },
    ],
  },
  farmsize: {
    tileDir: "farmsize",  // single directory, no percentile variants
    label: "Farm Size",
    description: "Dominant farm size (ha) -- Mehrabi & Ricciardi 2024",
    unit: "ha",
    legendColors: [
      { value:   1,  color: "#f7f4f9", label: "1 ha" },
      { value:  20,  color: "#c994c7", label: "20 ha" },
      { value: 500,  color: "#ce1256", label: "500 ha" },
      { value: 5000, color: "#49006a", label: "5000 ha" },
    ],
  },
};

// Helper: get tile directory name for a given variable + percentile
export function getTileDir(key, percentile = "p50") {
  const cfg = RASTER_OVERLAYS[key];
  if (!cfg) return null;
  if (typeof cfg.tileDir === "string") return cfg.tileDir;
  return cfg.tileDir[percentile] || cfg.tileDir.p50;
}
