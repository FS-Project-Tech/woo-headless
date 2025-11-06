import axios from "axios";

const WP_URL = process.env.NEXT_PUBLIC_WC_API_URL || ""; // reuse if same origin

function getWpJsonBase(): string | null {
  try {
    if (!WP_URL) return null;
    const u = new URL(WP_URL);
    return `${u.protocol}//${u.host}/wp-json`;
  } catch {
    return null;
  }
}

export interface HeroSliders {
  left: { src: string; alt?: string }[];
  right: { src: string; alt?: string }[];
}

// Attempts to fetch ACF options first, then a Home page (slug "home")
export async function fetchHeroSliders(): Promise<HeroSliders> {
  const base = getWpJsonBase();
  const empty: HeroSliders = { left: [], right: [] };
  if (!base) return empty;

  const tryExtract = (acf: any): HeroSliders => {
    const toArr = (v: any): { src: string; alt?: string }[] => {
      if (!v) return [];
      if (Array.isArray(v)) {
        return v
          .map((it) => {
            if (!it) return null;
            if (typeof it === "string") return { src: it };
            if (it.url) return { src: String(it.url), alt: it.alt || it.title };
            if (it.src) return { src: String(it.src), alt: it.alt };
            return null;
          })
          .filter(Boolean) as { src: string; alt?: string }[];
      }
      if (typeof v === "string") return [{ src: v }];
      return [];
    };

    const left = toArr(acf?.left_slider || acf?.leftSlider || acf?.hero_left || acf?.slider_left);
    const right = toArr(acf?.right_slider || acf?.rightSlider || acf?.hero_right || acf?.slider_right);
    return { left, right };
  };

  // 1) Try options
  try {
    const res = await axios.get(`${base}/acf/v3/options/options`);
    const acf = res?.data?.acf;
    const val = tryExtract(acf);
    if ((val.left?.length || 0) + (val.right?.length || 0) > 0) return val;
  } catch {}

  // 2) Try pages by slug 'home'
  try {
    const pages = await axios.get(`${base}/wp/v2/pages`, { params: { slug: "home", _fields: ["id"].join(",") } });
    const id = Array.isArray(pages.data) && pages.data[0]?.id;
    if (id) {
      const res = await axios.get(`${base}/acf/v3/pages/${id}`);
      const acf = res?.data?.acf;
      const val = tryExtract(acf);
      if ((val.left?.length || 0) + (val.right?.length || 0) > 0) return val;
    }
  } catch {}

  return empty;
}


