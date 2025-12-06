// app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function addMinutes(time: string, minutes: number) {
  const [hours, mins] = time.split(":").map((v) => parseInt(v, 10));
  const total = hours * 60 + mins + minutes;
  const endHours = Math.floor(total / 60) % 24;
  const endMins = total % 60;
  return `${endHours.toString().padStart(2, "0")}:${endMins
    .toString()
    .padStart(2, "0")}`;
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map((v) => parseInt(v, 10));
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, serviceId, date, time, notes } = body || {};

    if (!name || !email || !serviceId || !date || !time) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const service = await prisma.service.findUnique({
      where: { id: Number(serviceId) },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    const targetGroup = capacityGroup(service.name, service.category);
    const targetCapacity = capacityForGroup(targetGroup);

    const endTime = addMinutes(time, service.durationMinutes);
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    // Check for conflicts (overlapping bookings on the same day)
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
        service: { select: { name: true, category: true } },
      },
    });

    const blockedSlots = await prisma.blockedSlot.findMany({
      where: {
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      select: { startTime: true, endTime: true },
    });

    const requestedStart = timeToMinutes(time);
    const requestedEnd = timeToMinutes(endTime);

    // Blocked slots block everyone
    const blockedOverlap = blockedSlots.some((b) => {
      const start = timeToMinutes(b.startTime);
      const end = timeToMinutes(b.endTime);
      return start < requestedEnd && end > requestedStart;
    });

    if (blockedOverlap) {
      return NextResponse.json(
        { error: "Selected time is no longer available" },
        { status: 409 }
      );
    }

    // For bookings, enforce capacity by group
    let concurrent = 0;
    bookings.forEach((b) => {
      const group = capacityGroup(b.service.name, b.service.category);
      if (group !== targetGroup) return;
      const start = timeToMinutes(b.startTime);
      const end = timeToMinutes(b.endTime);
      if (start < requestedEnd && end > requestedStart) {
        concurrent += 1;
      }
    });

    if (concurrent >= targetCapacity) {
      return NextResponse.json(
        { error: "Selected time is no longer available" },
        { status: 409 }
      );
    }


    // Reuse or create user by email
    const guestEmail = `guest-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}@bookings.local`;
    const safeEmail = (email as string)?.trim().toLowerCase() || guestEmail;

    const user = await prisma.user.upsert({
      where: { email: safeEmail },
      update: {
        name,
        phone: phone || null,
      },
      create: {
        name,
        phone: phone || null,
        email: safeEmail,
        passwordHash: "guest",
      },
    });

    const booking = await prisma.booking.create({
      data: {
        clientId: user.id,
        serviceId: service.id,
        date: dayStart,
        startTime: time,
        endTime,
        status: "PENDING",
        notes: notes || null,
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error("Error creating booking", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
