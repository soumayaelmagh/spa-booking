// app/api/availability/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const serviceId = searchParams.get("serviceId");

  // basic validation
  if (!date || !serviceId) {
    return NextResponse.json(
      { slots: [], error: "Missing date or serviceId" },
      { status: 400 }
    );
  }

  // 👉 For NOW: we ignore serviceId and date and just return
  // a fixed list of slots to make testing easy.

  const slots: string[] = [];

  // from 10:00 to 19:00, every 30 minutes
  const startHour = 10;
  const endHour = 19;

  for (let hour = startHour; hour < endHour; hour++) {
    const h = hour.toString().padStart(2, "0");
    slots.push(`${h}:00`);
    slots.push(`${h}:30`);
  }

  return NextResponse.json({ slots });
}
