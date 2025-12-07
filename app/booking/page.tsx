"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePathname, useRouter } from "next/navigation";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

type ServiceCategory = "HAIR" | "HAMMAM_MASSAGE" | "NAILS" | "LASHES" | "FACIAL";

type Service = {
  id: number;
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: number;
  category: ServiceCategory;
};

const moroccoPhonePattern = /^(?:\+212|0)(?:5|6|7)\d{8}$/; // digits only, no spaces/dashes
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function BookingPage() {
  // Services & filters
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | "ALL">("ALL");
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // Date & time
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Client info
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isAdminBooking = pathname?.startsWith("/admin/booking");

  // UI state
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // -------------------------
  // LOAD SERVICES
  // -------------------------
  useEffect(() => {
    async function loadServices() {
      try {
        const res = await fetch("/api/services");
        if (!res.ok) {
          console.error("Failed to load services:", res.status, await res.text());
          return;
        }
        const data: Service[] = await res.json();
        setServices(data);
      } catch (error) {
        console.error("Error fetching services", error);
      }
    }

    loadServices();
  }, []);

  // Filtered services by category
  const filteredServices = useMemo(
    () =>
      selectedCategory === "ALL"
        ? services
        : services.filter((s) => s.category === selectedCategory),
    [services, selectedCategory]
  );

  // Helper: currently selected service object
  const selectedServiceObj = useMemo(
  () => services.find((s) => String(s.id) === selectedService),
  [services, selectedService]
  );

  // -------------------------
  // LOAD AVAILABLE SLOTS
  // -------------------------
  useEffect(() => {
    async function loadSlots() {
      if (!selectedService || !selectedDate) return;

      setLoadingSlots(true);
      setAvailableSlots([]);
      setSelectedTime(null);

      const formattedDate = format(selectedDate, "yyyy-MM-dd");

      try {
        const res = await fetch(
          `/api/availability?serviceId=${selectedService}&date=${formattedDate}`
        );
        if (!res.ok) {
          console.error("Failed to load availability:", res.status, await res.text());
          setLoadingSlots(false);
          return;
        }
        const data: { slots: string[] } = await res.json();
        setAvailableSlots(data.slots || []);
      } catch (error) {
        console.error("Error fetching availability", error);
      } finally {
        setLoadingSlots(false);
      }
    }

    loadSlots();
  }, [selectedService, selectedDate]);

  // -------------------------
  // SUBMIT BOOKING
  // -------------------------
  async function submitBooking() {
    if (!selectedService || !selectedDate || !selectedTime) return;
    if (!clientName) return;
    const normalizedEmail = clientEmail.trim().toLowerCase();
    if (!emailPattern.test(normalizedEmail)) {
      setEmailError("Enter a valid email.");
      return;
    }
    const normalizedPhone = clientPhone.replace(/[\s-]/g, "").trim();
    if (!moroccoPhonePattern.test(normalizedPhone)) {
      setPhoneError("Enter a valid Moroccan number (start with +212 or 0, digits only).");
      return;
    }

    setSubmitting(true);
    setEmailError(null);
    setPhoneError(null);

    const formattedDate = format(selectedDate, "yyyy-MM-dd");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: clientName,
          email: normalizedEmail,
          phone: normalizedPhone,
          serviceId: Number(selectedService),
          date: formattedDate,
          time: selectedTime,
          status: isAdminBooking ? "CONFIRMED" : undefined,
        }),
      });

      if (!res.ok) {
        console.error("Failed to create booking:", res.status, await res.text());
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      if (isAdminBooking) {
        router.push("/admin");
        return;
      }
    } catch (error) {
      console.error("Error submitting booking", error);
    } finally {
      setSubmitting(false);
    }
  }

  // -------------------------
  // SUCCESS SCREEN
  // -------------------------
  if (success) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-2 text-2xl font-bold">Booking Confirmed 🎉</h1>
        <p className="mb-6 text-sm text-slate-400">
          Thank you! Your appointment has been booked. You will be contacted by the spa if any changes are needed.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setSuccess(false);
            setSelectedService(null);
            setSelectedDate(undefined);
            setSelectedTime(null);
            setClientName("");
            setClientEmail("");
            setClientPhone("");
          }}
        >
          Book another appointment
        </Button>
      </div>
    );
  }

  // -------------------------
  // MAIN LAYOUT
  // -------------------------
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Book an Appointment</h1>
          <p className="mt-2 text-sm text-slate-400">
            Choose your service, pick a date and time, and we’ll reserve your spot.
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href="/menu" className="rounded-full border-amber-500 text-amber-700 hover:bg-amber-50">
            Back to menu
          </a>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        {/* LEFT: Steps */}
        <section className="space-y-6">
          {/* STEP 1 – SERVICE */}
          <Card>
            <CardHeader>
              <CardTitle>1. Select a Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category filter */}
              <div>
                <Label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">
                  Category
                </Label>
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => {
                    setSelectedCategory(value as ServiceCategory | "ALL");
                    setSelectedService(null);
                    setSelectedDate(undefined);
                    setSelectedTime(null);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All services</SelectItem>
                    <SelectItem value="HAIR">Hair</SelectItem>
                    <SelectItem value="HAMMAM_MASSAGE">Hammam &amp; Massage</SelectItem>
                    <SelectItem value="NAILS">Nails</SelectItem>
                    <SelectItem value="LASHES">Lash Extensions</SelectItem>
                    <SelectItem value="FACIAL">Facial Care</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Service select */}
              <div>
                <Label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">
                  Service
                </Label>
                <Select
                  value={selectedService ?? undefined}
                  onValueChange={(value) => {
                    setSelectedService(value);
                    setSelectedDate(undefined);
                    setSelectedTime(null);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredServices.map((service) => (
                      <SelectItem key={service.id} value={String(service.id)}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Show duration & price hint */}
                {selectedServiceObj && (
                  <p className="mt-2 text-xs text-slate-400">
                    {selectedServiceObj.durationMinutes} min · {selectedServiceObj.price} DH
                    {selectedServiceObj.description ? ` · ${selectedServiceObj.description}` : ""}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* STEP 2 – DATE */}
          {selectedService && (
            <Card>
              <CardHeader>
                <CardTitle>2. Choose a Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border border-slate-800 bg-slate-900"
                />
              </CardContent>
            </Card>
          )}

          {/* STEP 3 – TIME */}
          {selectedService && selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle>3. Choose a Time</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSlots ? (
                  <p className="text-sm text-slate-400">Loading available times...</p>
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    No slots available on this day. Please choose another date.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {availableSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        className="justify-center"
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* STEP 4 – DETAILS */}
          {selectedTime && (
            <Card>
              <CardHeader>
                <CardTitle>4. Your Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={clientEmail}
                onChange={(e) => {
                  setClientEmail(e.target.value);
                  if (emailError && emailPattern.test(e.target.value.trim().toLowerCase())) {
                    setEmailError(null);
                  }
                }}
                placeholder="you@example.com"
              />
              {emailError && (
                <p className="mt-1 text-xs text-red-500">{emailError}</p>
              )}
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={clientPhone}
                onChange={(e) => {
                  setClientPhone(e.target.value);
                  const normalized = e.target.value.replace(/[\s-]/g, "").trim();
                  if (phoneError && moroccoPhonePattern.test(normalized)) {
                    setPhoneError(null);
                  }
                }}
                placeholder="+212612345678"
              />
              {phoneError && (
                <p className="mt-1 text-xs text-red-500">{phoneError}</p>
              )}
            </div>

                <Button
              className="w-full"
              onClick={submitBooking}
              disabled={
                submitting ||
                !clientName ||
                !clientEmail ||
                !selectedService ||
                !selectedDate ||
                !selectedTime
              }
            >
                  {submitting ? "Submitting..." : "Confirm Booking"}
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* RIGHT: Summary */}
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Category</span>
                <span>
                  {selectedCategory === "ALL" ? "Any" : selectedCategory.replace("_", " & ")}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Service</span>
                <span>{selectedServiceObj?.name ?? "Not selected"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Date</span>
                <span>{selectedDate ? format(selectedDate, "PPP") : "Not selected"}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Time</span>
                <span>{selectedTime ?? "Not selected"}</span>
              </div>

              <div className="h-px bg-slate-800 my-2" />

              <div className="flex justify-between">
                <span className="text-slate-400">Name</span>
                <span>{clientName || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phone</span>
                <span>{clientPhone || "—"}</span>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-slate-500">
            By confirming your booking, you agree to the spa&apos;s cancellation policy.
          </p>
        </aside>
      </div>
    </div>
  );
}
