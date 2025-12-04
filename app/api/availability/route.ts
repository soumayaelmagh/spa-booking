// app/api/availability/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").slice(0, 2).map((v) => parseInt(v, 10));
  return h * 60 + m;
}

function capacityGroup(serviceName: string, category: string) {
  const lower = serviceName.toLowerCase();
  if (category === "HAMMAM_MASSAGE") {
    return lower.includes("massage") ? "MASSAGE" : "HAMMAM";
  }
  return category;
}

function capacityForGroup(group: string) {
  switch (group) {
    case "HAIR":
      return 3;
    case "NAILS":
      return 3;
    case "HAMMAM":
      return 2;
    case "MASSAGE":
      return 1;
    default:
      return 1;
  }
}

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

  // load service to respect duration and capacity group
  const service = await prisma.service.findUnique({
    where: { id: Number(serviceId) },
    select: { durationMinutes: true, name: true, category: true },
  });

  if (!service) {
    return NextResponse.json(
      { slots: [], error: "Service not found" },
      { status: 404 }
    );
  }

  const targetGroup = capacityGroup(service.name, service.category);
  const targetCapacity = capacityForGroup(targetGroup);

  const slots: string[] = [];

  // from 10:00 to 21:00, every 30 minutes
  const startHour = 10;
  const endHour = 21;

  for (let hour = startHour; hour < endHour; hour++) {
    const h = hour.toString().padStart(2, "0");
    slots.push(`${h}:00`);
    slots.push(`${h}:30`);
  }

  try {
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    const bookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: {
          not: "CANCELLED",
        },
      },
      select: {
        startTime: true,
        endTime: true,
        service: {
          select: { name: true, category: true },
        },
      },
    });

    const blockedSlots = await prisma.blockedSlot.findMany({
      where: {
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    const blockedMinutes = new Set<number>();
    blockedSlots.forEach((b) => {
      const start = timeToMinutes(b.startTime);
      const end = timeToMinutes(b.endTime);
      for (let t = start; t < end; t += 30) {
        blockedMinutes.add(t);
      }
    });

    const available = slots.filter((slot) => {
      const start = timeToMinutes(slot);
      const end = start + service.durationMinutes;

      // fully blocked slots cover everyone
      for (let t = start; t < end; t += 30) {
        if (blockedMinutes.has(t)) return false;
      }

      // count overlapping bookings in the same capacity group
      let concurrent = 0;
      bookings.forEach((b) => {
        const group = capacityGroup(b.service.name, b.service.category);
        if (group !== targetGroup) return;

        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);
        const overlap = bStart < end && bEnd > start;
        if (overlap) concurrent += 1;
      });

      for (let t = start; t < end; t += 30) {
        if (concurrent >= targetCapacity) return false;
      }
      return true;
    });

    return NextResponse.json({ slots: available });
  } catch (error) {
    console.error("Error fetching availability", error);
    return NextResponse.json(
      { slots: [], error: "Failed to load availability" },
      { status: 500 }
    );
  }
}
