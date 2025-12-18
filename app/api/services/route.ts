// app/api/services/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const langParam = searchParams.get("lang");
  const lang = langParam === "fr" ? "fr" : "en";

  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      include: { translations: true },
      orderBy: { name: "asc" },
    });

    const localized = services.map(({ translations, ...service }) => {
      const preferred = translations.find((t) => t.locale === lang);
      const fallback = translations.find((t) => t.locale === "en");

      return {
        ...service,
        name: preferred?.name ?? fallback?.name ?? service.name,
        description: preferred?.description ?? fallback?.description ?? service.description,
      };
    });

    return NextResponse.json(localized);
  } catch (error) {
    console.error("Error loading services", error);
    return NextResponse.json(
      { error: "Failed to load services" },
      { status: 500 }
    );
  }
}
