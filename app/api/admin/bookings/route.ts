import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateAdmin } from "../auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!validateAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
    include: {
      client: { select: { name: true, email: true, phone: true } },
      service: { select: { name: true, category: true } },
    },
  });

  return NextResponse.json(bookings);
}
