import { NextRequest, NextResponse } from "next/server";
import { LOFT_BANNERS, KUZIINI_BANNERS } from "@/lib/mock-data";
import type { PromoBanner, BannerCategory } from "@/types";

const ADMIN_PASSWORD = "Kuziini1";
const LOFT_PASSWORD = "Loft2025";

function getBanners(category: BannerCategory): PromoBanner[] {
  const arr = category === "loft" ? LOFT_BANNERS : KUZIINI_BANNERS;
  return [...arr].sort((a, b) => a.order - b.order);
}

function setBanners(category: BannerCategory, banners: PromoBanner[]) {
  const target = category === "loft" ? LOFT_BANNERS : KUZIINI_BANNERS;
  target.length = 0;
  banners.forEach((b) => target.push(b));
}

function validatePassword(password: string, category: BannerCategory): boolean {
  if (category === "loft") return password === LOFT_PASSWORD;
  return password === ADMIN_PASSWORD;
}

// GET - public, returns banners for display
export async function GET(req: NextRequest) {
  const category = (req.nextUrl.searchParams.get("category") || "loft") as BannerCategory;
  if (category !== "loft" && category !== "kuziini") {
    return NextResponse.json({ success: false, error: "Categorie invalidă." }, { status: 400 });
  }
  return NextResponse.json({ success: true, data: getBanners(category) });
}

// POST - authenticated, manage banners
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { password, category, action } = body as {
    password: string;
    category: BannerCategory;
    action: "list" | "add" | "update" | "delete" | "reorder";
  };

  if (!category || (category !== "loft" && category !== "kuziini")) {
    return NextResponse.json({ success: false, error: "Categorie invalidă." }, { status: 400 });
  }

  if (!validatePassword(password, category)) {
    return NextResponse.json({ success: false, error: "Parolă incorectă." }, { status: 401 });
  }

  const banners = getBanners(category);

  switch (action) {
    case "list":
      return NextResponse.json({ success: true, data: banners });

    case "add": {
      const { title, subtitle, emoji, image } = body as {
        title: string;
        subtitle?: string;
        emoji?: string;
        image?: string;
      };
      if (!title) {
        return NextResponse.json({ success: false, error: "Titlul este obligatoriu." }, { status: 400 });
      }
      const newBanner: PromoBanner = {
        id: `${category}-${Date.now()}`,
        title,
        subtitle: subtitle || "",
        emoji: emoji || "",
        image: image || undefined,
        color: "",
        order: banners.length,
      };
      banners.push(newBanner);
      setBanners(category, banners);
      return NextResponse.json({ success: true, data: banners });
    }

    case "update": {
      const { bannerId, title, subtitle, emoji, image } = body as {
        bannerId: string;
        title?: string;
        subtitle?: string;
        emoji?: string;
        image?: string | null;
      };
      const idx = banners.findIndex((b) => b.id === bannerId);
      if (idx === -1) {
        return NextResponse.json({ success: false, error: "Banner negăsit." }, { status: 404 });
      }
      if (title !== undefined) banners[idx].title = title;
      if (subtitle !== undefined) banners[idx].subtitle = subtitle;
      if (emoji !== undefined) banners[idx].emoji = emoji;
      if (image !== undefined) banners[idx].image = image || undefined;
      setBanners(category, banners);
      return NextResponse.json({ success: true, data: banners });
    }

    case "delete": {
      const { bannerId } = body as { bannerId: string };
      const filtered = banners.filter((b) => b.id !== bannerId);
      filtered.forEach((b, i) => (b.order = i));
      setBanners(category, filtered);
      return NextResponse.json({ success: true, data: filtered });
    }

    case "reorder": {
      const { orderedIds } = body as { orderedIds: string[] };
      if (!orderedIds?.length) {
        return NextResponse.json({ success: false, error: "Lista de ordine este goală." }, { status: 400 });
      }
      const reordered: PromoBanner[] = [];
      orderedIds.forEach((id, i) => {
        const banner = banners.find((b) => b.id === id);
        if (banner) {
          banner.order = i;
          reordered.push(banner);
        }
      });
      setBanners(category, reordered);
      return NextResponse.json({ success: true, data: reordered });
    }

    default:
      return NextResponse.json({ success: false, error: "Acțiune invalidă." }, { status: 400 });
  }
}
