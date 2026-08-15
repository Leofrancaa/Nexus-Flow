export type MerchantBrand = {
  id: string;
  label: string;
  terms: readonly string[];
  prefixes?: readonly string[];
  asset?: string;
  slug?: string;
  color: string;
  wide?: boolean;
  fallback: string;
};

/**
 * Marcas locais ficam primeiro: são as mais frequentes no extrato brasileiro
 * e continuam funcionando sem depender de CDN. As demais mantêm ícones remotos
 * leves, sempre com monograma de fallback.
 */
export const MERCHANT_BRANDS: readonly MerchantBrand[] = [
  { id: "chatgpt", label: "ChatGPT", terms: ["chatgpt", "chatgp", "openai"], asset: "/merchant-logos/openai.svg", color: "#ffffff", fallback: "AI" },
  { id: "claude", label: "Claude", terms: ["claude", "anthropic"], asset: "/merchant-logos/claude.svg", color: "#d97757", fallback: "CL" },
  { id: "ifood", label: "iFood", terms: ["ifood"], prefixes: ["ifd*", "ifd "], asset: "/merchant-logos/ifood.svg", color: "#ea1d2c", fallback: "iF" },
  { id: "mercado-livre", label: "Mercado Livre", terms: ["mercado livre", "mercadolivre"], asset: "/merchant-logos/mercado-livre.svg", color: "#ffe600", wide: true, fallback: "ML" },
  { id: "amazon", label: "Amazon", terms: ["amazon", "amzn", "amazonmktplc"], asset: "/merchant-logos/amazon.svg", color: "#ff9900", wide: true, fallback: "AZ" },
  { id: "adidas", label: "Adidas", terms: ["adidas"], asset: "/merchant-logos/adidas.svg", color: "#ffffff", fallback: "AD" },
  { id: "hiperideal", label: "Hiperideal", terms: ["hiperideal", "hiper ideal"], asset: "/merchant-logos/hiperideal.svg", color: "#22c55e", fallback: "HI" },
  { id: "cacau-show", label: "Cacau Show", terms: ["cacau show", "cacaushow"], asset: "/merchant-logos/cacau-show.svg", color: "#d9a441", fallback: "CS" },
  { id: "senai", label: "SENAI", terms: ["senai"], asset: "/merchant-logos/senai.svg", color: "#e31b23", wide: true, fallback: "SE" },
  { id: "subway", label: "Subway", terms: ["subway"], asset: "/merchant-logos/subway.svg", color: "#008c15", wide: true, fallback: "SW" },
  { id: "byd", label: "BYD", terms: ["byd auto", "salario byd", "salário byd", "byd"], asset: "/merchant-logos/byd.svg", color: "#d70c19", wide: true, fallback: "BY" },
  { id: "delivery", label: "Delivery", terms: ["delivery", "deliver", "aiqfome", "ze delivery", "zé delivery"], asset: "/merchant-logos/delivery.svg", color: "#ff6b35", fallback: "DL" },
  { id: "google", label: "Google", terms: ["google"], slug: "google", color: "#ffffff", fallback: "G" },
  { id: "uber", label: "Uber", terms: ["uber"], slug: "uber", color: "#ffffff", fallback: "UB" },
  { id: "mercado-pago", label: "Mercado Pago", terms: ["mercado pago", "mercadopago"], slug: "mercadopago", color: "#00b1ea", fallback: "MP" },
  { id: "netflix", label: "Netflix", terms: ["netflix"], slug: "netflix", color: "#e50914", fallback: "N" },
  { id: "spotify", label: "Spotify", terms: ["spotify"], slug: "spotify", color: "#1ed760", fallback: "SP" },
  { id: "rappi", label: "Rappi", terms: ["rappi"], slug: "rappi", color: "#ff5a2d", fallback: "RA" },
  { id: "mcdonalds", label: "McDonald's", terms: ["mcdonald", "mc donald"], slug: "mcdonalds", color: "#ffbc0d", fallback: "M" },
  { id: "burger-king", label: "Burger King", terms: ["burger king"], slug: "burgerking", color: "#ff8732", fallback: "BK" },
  { id: "starbucks", label: "Starbucks", terms: ["starbucks"], slug: "starbucks", color: "#00754a", fallback: "SB" },
  { id: "carrefour", label: "Carrefour", terms: ["carrefour"], slug: "carrefour", color: "#004e9f", fallback: "CF" },
  { id: "apple", label: "Apple", terms: ["apple", "itunes", "icloud"], slug: "apple", color: "#ffffff", fallback: "AP" },
  { id: "shopee", label: "Shopee", terms: ["shopee"], slug: "shopee", color: "#ee4d2d", fallback: "SH" },
  { id: "aliexpress", label: "AliExpress", terms: ["aliexpress"], slug: "aliexpress", color: "#ff4747", fallback: "AE" },
  { id: "nike", label: "Nike", terms: ["nike"], slug: "nike", color: "#ffffff", fallback: "NK" },
  { id: "steam", label: "Steam", terms: ["steam"], slug: "steam", color: "#66c0f4", fallback: "ST" },
  { id: "notion", label: "Notion", terms: ["notion"], slug: "notion", color: "#ffffff", fallback: "NO" },
  { id: "github", label: "GitHub", terms: ["github"], slug: "github", color: "#ffffff", fallback: "GH" },
  { id: "youtube", label: "YouTube", terms: ["youtube"], slug: "youtube", color: "#ff0000", fallback: "YT" },
  { id: "udemy", label: "Udemy", terms: ["udemy"], slug: "udemy", color: "#a435f0", fallback: "UD" },
  { id: "coursera", label: "Coursera", terms: ["coursera"], slug: "coursera", color: "#0056d2", fallback: "CO" },
];

export function normalizeMerchant(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function findMerchantBrand(description: string): MerchantBrand | undefined {
  const normalized = normalizeMerchant(description).trim();
  return MERCHANT_BRANDS.find((brand) =>
    brand.terms.some((term) => normalized.includes(normalizeMerchant(term))) ||
    brand.prefixes?.some((prefix) => normalized.startsWith(normalizeMerchant(prefix)))
  );
}
