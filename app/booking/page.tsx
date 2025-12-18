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
import { useLanguage } from "@/components/language-provider";

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

type Lang = "en" | "fr";

const copy = {
  en: {
    heading: "Book an Appointment",
    subheading: "Choose your service, pick a date and time, and we’ll reserve your spot.",
    backToMenu: "Back to menu",
    step1: "1. Select a Service",
    category: "Category",
    chooseCategory: "Choose a category",
    allServices: "All services",
    service: "Service",
    chooseService: "Choose a service",
    durationLabel: (mins: number, price: number, desc?: string | null) =>
      `${mins} min · ${price} DH${desc ? ` · ${desc}` : ""}`,
    step2: "2. Choose a Date",
    step3: "3. Choose a Time",
    loadingTimes: "Loading available times...",
    noSlots: "No slots available on this day. Please choose another date.",
    step4: "4. Your Details",
    name: "Name",
    email: "Email",
    phone: "Phone",
    emailError: "Enter a valid email.",
    phoneError: "Enter a valid Moroccan number (start with +212 or 0, digits only).",
    confirmBooking: "Confirm Booking",
    summary: "Booking Summary",
    summaryCategory: "Category",
    summaryService: "Service",
    summaryDate: "Date",
    summaryTime: "Time",
    summaryName: "Name",
    summaryPhone: "Phone",
    policy: "By confirming your booking, you agree to the spa's cancellation policy.",
    anyCategory: "Any",
    notSelected: "Not selected",
    successTitle: "Booking Confirmed 🎉",
    successBody:
      "Thank you! Your appointment has been booked. You will be contacted by the spa if any changes are needed.",
    successCta: "Book another appointment",
    bookButton: "Book an appointment",
    backHome: "Back to main page",
  },
  fr: {
    heading: "Réserver un rendez-vous",
    subheading:
      "Choisissez votre prestation, sélectionnez une date et une heure, et nous bloquons votre créneau.",
    backToMenu: "Retour au menu",
    step1: "1. Choisir une prestation",
    category: "Catégorie",
    chooseCategory: "Choisir une catégorie",
    allServices: "Toutes les prestations",
    service: "Prestation",
    chooseService: "Choisir une prestation",
    durationLabel: (mins: number, price: number, desc?: string | null) =>
      `${mins} min · ${price} DH${desc ? ` · ${desc}` : ""}`,
    step2: "2. Choisir une date",
    step3: "3. Choisir un horaire",
    loadingTimes: "Chargement des horaires disponibles...",
    noSlots: "Pas de créneau disponible ce jour-là. Merci de choisir une autre date.",
    step4: "4. Vos informations",
    name: "Nom",
    email: "Email",
    phone: "Téléphone",
    emailError: "Saisissez un email valide.",
    phoneError: "Entrez un numéro marocain valide (commence par +212 ou 0, chiffres uniquement).",
    confirmBooking: "Confirmer la réservation",
    summary: "Récapitulatif",
    summaryCategory: "Catégorie",
    summaryService: "Prestation",
    summaryDate: "Date",
    summaryTime: "Horaire",
    summaryName: "Nom",
    summaryPhone: "Téléphone",
    policy:
      "En confirmant votre réservation, vous acceptez la politique d'annulation du spa.",
    anyCategory: "Toutes",
    notSelected: "Non sélectionné",
    successTitle: "Réservation confirmée 🎉",
    successBody:
      "Merci ! Votre rendez-vous est réservé. Le spa vous contactera en cas de changement.",
    successCta: "Réserver un autre rendez-vous",
    bookButton: "Prendre rendez-vous",
    backHome: "Retour à la page d'accueil",
  },
};

const categoryLabels: Record<Lang, Record<ServiceCategory | "ALL", string>> = {
  en: {
    ALL: "All",
    HAIR: "Hair",
    HAMMAM_MASSAGE: "Hammam & Massage",
    NAILS: "Nails",
    LASHES: "Lash Extensions",
    FACIAL: "Facial Care",
  },
  fr: {
    ALL: "Toutes",
    HAIR: "Coiffure",
    HAMMAM_MASSAGE: "Hammam & Massage",
    NAILS: "Ongles",
    LASHES: "Extensions de cils",
    FACIAL: "Soins du visage",
  },
};

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
  const { language } = useLanguage();
  const t = copy[language];
  const categoryCopy = categoryLabels[language];
  const currentCategoryLabel =
    selectedCategory === "ALL" ? t.anyCategory : categoryCopy[selectedCategory];

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
        const res = await fetch(`/api/services?lang=${language}`);
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
  }, [language]);

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
      setEmailError(t.emailError);
      return;
    }
    const normalizedPhone = clientPhone.replace(/[\s-]/g, "").trim();
    if (!moroccoPhonePattern.test(normalizedPhone)) {
      setPhoneError(t.phoneError);
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
        <h1 className="mb-2 text-2xl font-bold">{t.successTitle}</h1>
        <p className="mb-6 text-sm text-slate-400">{t.successBody}</p>
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
          {t.successCta}
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
          <h1 className="text-3xl font-bold tracking-tight">{t.heading}</h1>
          <p className="mt-2 text-sm text-slate-400">{t.subheading}</p>
        </div>
        <Button variant="outline" asChild>
          <a href="/menu" className="rounded-full border-amber-500 text-amber-700 hover:bg-amber-50">
            {t.backToMenu}
          </a>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
        {/* LEFT: Steps */}
        <section className="space-y-6">
          {/* STEP 1 – SERVICE */}
          <Card>
            <CardHeader>
              <CardTitle>{t.step1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category filter */}
              <div>
                <Label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">
                  {t.category}
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
                    <SelectValue placeholder={t.chooseCategory} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{t.allServices}</SelectItem>
                    <SelectItem value="HAIR">{categoryCopy.HAIR}</SelectItem>
                    <SelectItem value="HAMMAM_MASSAGE">{categoryCopy.HAMMAM_MASSAGE}</SelectItem>
                    <SelectItem value="NAILS">{categoryCopy.NAILS}</SelectItem>
                    <SelectItem value="LASHES">{categoryCopy.LASHES}</SelectItem>
                    <SelectItem value="FACIAL">{categoryCopy.FACIAL}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Service select */}
              <div>
                <Label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">
                  {t.service}
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
                    <SelectValue placeholder={t.chooseService} />
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
                    {t.durationLabel(
                      selectedServiceObj.durationMinutes,
                      selectedServiceObj.price,
                      selectedServiceObj.description
                    )}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* STEP 2 – DATE */}
          {selectedService && (
            <Card>
              <CardHeader>
                <CardTitle>{t.step2}</CardTitle>
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
                <CardTitle>{t.step3}</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSlots ? (
                  <p className="text-sm text-slate-400">{t.loadingTimes}</p>
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-slate-400">{t.noSlots}</p>
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
                <CardTitle>{t.step4}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{t.name}</Label>
                  <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
            <div>
              <Label>{t.email}</Label>
              <Input
                type="email"
                value={clientEmail}
                onChange={(e) => {
                  setClientEmail(e.target.value);
                  if (emailError && emailPattern.test(e.target.value.trim().toLowerCase())) {
                    setEmailError(null);
                  }
                }}
                placeholder={language === "fr" ? "vous@example.com" : "you@example.com"}
              />
              {emailError && (
                <p className="mt-1 text-xs text-red-500">{t.emailError}</p>
              )}
            </div>
            <div>
              <Label>{t.phone}</Label>
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
                <p className="mt-1 text-xs text-red-500">{t.phoneError}</p>
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
                  {submitting ? `${t.confirmBooking}...` : t.confirmBooking}
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* RIGHT: Summary */}
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.summary}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">{t.summaryCategory}</span>
                <span>{currentCategoryLabel}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">{t.summaryService}</span>
                <span>{selectedServiceObj?.name ?? t.notSelected}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">{t.summaryDate}</span>
                <span>
                  {selectedDate
                    ? selectedDate.toLocaleDateString(
                        language === "fr" ? "fr-FR" : "en-US",
                        { dateStyle: "medium" }
                      )
                    : t.notSelected}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">{t.summaryTime}</span>
                <span>{selectedTime ?? t.notSelected}</span>
              </div>

              <div className="h-px bg-slate-800 my-2" />

              <div className="flex justify-between">
                <span className="text-slate-400">{t.summaryName}</span>
                <span>{clientName || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t.summaryPhone}</span>
                <span>{clientPhone || "—"}</span>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-slate-500">{t.policy}</p>
        </aside>
      </div>
    </div>
  );
}
