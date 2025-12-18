"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/components/language-provider";

type Booking = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  client: { name: string; email: string; phone: string | null };
  service: { name: string; category: string };
};

type Service = {
  id: number;
  name: string;
  category: string;
  durationMinutes: number;
};

const moroccoPhonePattern = /^(?:\+212|0)(?:5|6|7)\d{8}$/;

type Lang = "en" | "fr";

const copy = {
  en: {
    admin: "Admin",
    appointments: "Appointments",
    create: "Create appointment",
    logout: "Log out",
    loginTitle: "Admin Login",
    email: "Email",
    password: "Password",
    signIn: "Sign in",
    signingIn: "Signing in...",
    allBookings: "All Bookings",
    category: "Category",
    date: "Date",
    confirm: "Confirm",
    confirming: "Confirming...",
    cancel: "Cancel",
    cancelling: "Cancelling...",
    loading: "Loading...",
    noBookings: "No bookings yet.",
    selected: "Selected",
    modalTitle: "Create Appointment",
    close: "Close",
    service: "Service",
    time: "Time",
    name: "Name",
    phone: "Phone",
    cancelModal: "Cancel",
    createBooking: "Create booking",
    creating: "Creating...",
    fillRequired: "Please fill all required fields.",
    invalidPhone: "Enter a valid Moroccan number (start with +212 or 0, digits only).",
    selectBooking: "Select a booking first.",
    sessionExpired: "Session expired. Please log in again.",
    loginFailed: "Login failed",
    loadFailed: "Failed to load bookings",
    updateFailed: "Failed to update booking",
    createFailed: "Failed to create booking",
    selectService: "Select service",
    selectTime: "Select time",
    loadingTime: "Loading...",
  },
  fr: {
    admin: "Admin",
    appointments: "Rendez-vous",
    create: "Créer un rendez-vous",
    logout: "Se déconnecter",
    loginTitle: "Connexion admin",
    email: "Email",
    password: "Mot de passe",
    signIn: "Se connecter",
    signingIn: "Connexion...",
    allBookings: "Tous les rendez-vous",
    category: "Catégorie",
    date: "Date",
    confirm: "Confirmer",
    confirming: "Confirmation...",
    cancel: "Annuler",
    cancelling: "Annulation...",
    loading: "Chargement...",
    noBookings: "Aucune réservation pour le moment.",
    selected: "Sélectionné",
    modalTitle: "Créer un rendez-vous",
    close: "Fermer",
    service: "Prestation",
    time: "Heure",
    name: "Nom",
    phone: "Téléphone",
    cancelModal: "Annuler",
    createBooking: "Créer la réservation",
    creating: "Création...",
    fillRequired: "Veuillez remplir tous les champs obligatoires.",
    invalidPhone: "Entrez un numéro marocain valide (commence par +212 ou 0, chiffres uniquement).",
    selectBooking: "Sélectionnez d'abord une réservation.",
    sessionExpired: "Session expirée. Merci de vous reconnecter.",
    loginFailed: "Échec de la connexion",
    loadFailed: "Impossible de charger les réservations",
    updateFailed: "Impossible de mettre à jour la réservation",
    createFailed: "Impossible de créer la réservation",
    selectService: "Choisir une prestation",
    selectTime: "Choisir l'heure",
    loadingTime: "Chargement...",
  },
};

const categoryLabels: Record<Lang, Record<string, string>> = {
  en: {
    ALL: "All",
    HAIR: "Hair",
    HAMMAM_MASSAGE: "Hammam & Massage",
    NAILS: "Nails",
    LASHES: "Lashes",
    FACIAL: "Facial",
  },
  fr: {
    ALL: "Toutes",
    HAIR: "Coiffure",
    HAMMAM_MASSAGE: "Hammam & Massage",
    NAILS: "Ongles",
    LASHES: "Cils",
    FACIAL: "Visage",
  },
};

const statusLabels: Record<Lang, Record<string, string>> = {
  en: {
    CONFIRMED: "CONFIRMED",
    CANCELLED: "CANCELLED",
    PENDING: "PENDING",
  },
  fr: {
    CONFIRMED: "CONFIRMÉ",
    CANCELLED: "ANNULÉ",
    PENDING: "EN ATTENTE",
  },
};

export default function AdminPage() {
  const { language } = useLanguage();
  const t = copy[language];
  const categoryCopy = categoryLabels[language];
  const statusCopy = statusLabels[language];
  const dateLocale = language === "fr" ? "fr-FR" : "en-US";
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterDate, setFilterDate] = useState<string>("");
  const [services, setServices] = useState<Service[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [creating, setCreating] = useState(false);

  async function fetchBookings() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/bookings", { credentials: "include" });
      if (res.status === 401) {
        setLoggedIn(false);
        setBookings([]);
        return;
      }
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data: Booking[] = await res.json();
      setBookings(data);
      setLoggedIn(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.loadFailed;
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    async function loadServices() {
      try {
        const res = await fetch(`/api/services?lang=${language}`);
        if (!res.ok) return;
        const data: Service[] = await res.json();
        setServices(data);
      } catch (err) {
        console.error(err);
      }
    }
    if (!modalOpen) return;
    loadServices();
  }, [modalOpen, language]);

  useEffect(() => {
    async function loadSlots() {
      if (!selectedService || !selectedDate) return;
      setLoadingSlots(true);
      setAvailableSlots([]);
      setSelectedTime("");
      try {
        const res = await fetch(
          `/api/availability?serviceId=${selectedService}&date=${selectedDate}`
        );
        if (!res.ok) return;
        const data: { slots: string[] } = await res.json();
        setAvailableSlots(data.slots || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSlots(false);
      }
    }
    loadSlots();
  }, [selectedService, selectedDate]);

  const filteredServices = useMemo(
    () =>
      selectedCategory === "ALL"
        ? services
        : services.filter((s) => s.category === selectedCategory),
    [services, selectedCategory]
  );

  async function updateStatus(status: "CONFIRMED" | "CANCELLED", idParam?: number) {
    const targetId = idParam ?? selectedId;
    if (!targetId) {
      setError(t.selectBooking);
      return;
    }
    setUpdatingId(targetId);
    setError(null);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: targetId, status }),
        credentials: "include",
      });
      if (res.status === 401) {
        setLoggedIn(false);
        setBookings([]);
        setError(t.sessionExpired);
        return;
      }
      if (!res.ok) {
        throw new Error(await res.text());
      }
      await fetchBookings(); // refresh from DB to ensure UI matches persisted state
    } catch (err) {
      const message = err instanceof Error ? err.message : t.updateFailed;
      setError(message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setEmail("");
      setPassword("");
      await fetchBookings();
    } catch (err) {
      const message = err instanceof Error ? err.message : t.loginFailed;
      setError(message);
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setLoggedIn(false);
    setBookings([]);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-amber-700">{t.admin}</p>
          <h1 className="text-3xl font-bold  text-amber-600 tracking-tight">{t.appointments}</h1>
        </div>
        {loggedIn && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              className="rounded-full bg-amber-600 px-5 py-2 text-sm hover:bg-amber-700"
              onClick={() => setModalOpen(true)}
            >
              {t.create}
            </Button>
            <Button
              onClick={handleLogout}
              className="rounded-full bg-amber-600 px-5 py-2 text-sm hover:bg-amber-700"
            >
              {t.logout}
            </Button>
          </div>
        )}
      </div>

      {!loggedIn ? (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>{t.loginTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <Label>{t.email}</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>{t.password}</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={loggingIn}>
                {loggingIn ? t.signingIn : t.signIn}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t.allBookings}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-red-500">{error}</p>}
            {bookings.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600">{t.category}</label>
                    <select
                      className="block rounded-md border px-3 py-2 text-sm"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      <option value="ALL">{categoryCopy.ALL}</option>
                      <option value="HAIR">{categoryCopy.HAIR}</option>
                      <option value="HAMMAM_MASSAGE">{categoryCopy.HAMMAM_MASSAGE}</option>
                      <option value="NAILS">{categoryCopy.NAILS}</option>
                      <option value="LASHES">{categoryCopy.LASHES}</option>
                      <option value="FACIAL">{categoryCopy.FACIAL}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">{t.date}</label>
                    <input
                      type="date"
                      className="block rounded-md border px-3 py-2 text-sm"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="rounded-full bg-amber-600 px-5 py-2 text-sm hover:bg-amber-700"
                      onClick={() => updateStatus("CONFIRMED")}
                      disabled={updatingId !== null || !selectedId}
                    >
                      {updatingId && selectedId === updatingId ? t.confirming : t.confirm}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateStatus("CANCELLED")}
                      disabled={updatingId !== null || !selectedId}
                    >
                      {updatingId && selectedId === updatingId ? t.cancelling : t.cancel}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {loading ? (
              <p className="text-sm text-slate-400">{t.loading}</p>
            ) : bookings.length === 0 ? (
              <p className="text-sm text-slate-400">{t.noBookings}</p>
            ) : (
              <div className="space-y-3">
                {bookings
                  .filter((b) => {
                    const categoryMatch =
                      filterCategory === "ALL" || b.service.category === filterCategory;
                    const dateMatch =
                      !filterDate ||
                      new Date(b.date).toISOString().slice(0, 10) === filterDate;
                    return categoryMatch && dateMatch;
                  })
                  .map((b) => {
                    const isSelected = selectedId === b.id;
                    const statusBg =
                      b.status === "CANCELLED"
                        ? "bg-red-50 border-red-200"
                        : b.status === "CONFIRMED"
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-white border-slate-200";
                    return (
                      <div
                        key={b.id}
                        className={`rounded-lg border px-4 py-3 shadow-sm cursor-pointer ${statusBg} ${
                          isSelected ? "ring-2 ring-amber-300" : "hover:border-amber-200"
                        }`}
                        onClick={() => setSelectedId(b.id)}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-semibold">{b.service.name}</div>
                          <span className="text-xs uppercase tracking-wide text-slate-500">
                            {statusCopy[b.status] ?? b.status}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          {new Date(b.date).toLocaleDateString(dateLocale)} · {b.startTime}–{b.endTime}
                        </div>
                        <div className="mt-1 text-sm text-slate-700">
                          {b.client.name}
                          {b.client.phone ? ` · ${b.client.phone}` : ""}
                        </div>
                        {isSelected && (
                          <div className="mt-1 text-xs text-amber-700">{t.selected}</div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 text-slate-800">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl text-slate-800">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">{t.modalTitle}</h2>
              <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
                {t.close}
              </Button>
            </div>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-700">{t.category}</Label>
                  <select
                    className="mt-1 block w-full rounded-md border px-3 py-2 text-sm text-slate-800"
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedService("");
                    }}
                  >
                    <option value="ALL">{categoryCopy.ALL}</option>
                    <option value="HAIR">{categoryCopy.HAIR}</option>
                    <option value="HAMMAM_MASSAGE">{categoryCopy.HAMMAM_MASSAGE}</option>
                    <option value="NAILS">{categoryCopy.NAILS}</option>
                    <option value="LASHES">{categoryCopy.LASHES}</option>
                    <option value="FACIAL">{categoryCopy.FACIAL}</option>
                  </select>
                </div>
                <div>
                  <Label className="text-slate-700">{t.service}</Label>
                  <select
                    className="mt-1 block w-full rounded-md border px-3 py-2 text-sm text-slate-800"
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                  >
                    <option value="">{t.selectService}</option>
                    {filteredServices.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-700">{t.date}</Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-slate-800"
                  />
                </div>
                <div>
                  <Label className="text-slate-700">{t.time}</Label>
                  <select
                    className="mt-1 block w-full rounded-md border px-3 py-2 text-sm text-slate-800"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    disabled={loadingSlots || availableSlots.length === 0}
                  >
                    <option value="">
                      {loadingSlots ? t.loadingTime : t.selectTime}
                    </option>
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label className="text-slate-700">{t.name}</Label>
                <Input
                  className="text-slate-800"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-slate-700">{t.phone}</Label>
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
                  className="text-slate-800"
                />
                {phoneError && (
                  <p className="mt-1 text-xs text-red-500">{phoneError}</p>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  {t.cancelModal}
                </Button>
                <Button
                  className="rounded-full bg-amber-600 px-5 py-2 text-sm hover:bg-amber-700"
                  onClick={async () => {
                    if (
                      !selectedService ||
                      !selectedDate ||
                      !selectedTime ||
                      !clientName
                    ) {
                      setError(t.fillRequired);
                      return;
                    }
                    const normalizedPhone = clientPhone.replace(/[\s-]/g, "").trim();
                    if (!moroccoPhonePattern.test(normalizedPhone)) {
                      setPhoneError(t.invalidPhone);
                      return;
                    }

                    setCreating(true);
                    setError(null);
                    try {
                      const res = await fetch("/api/bookings", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: clientName,
                          email: `${normalizedPhone}@placeholder.local`,
                          phone: normalizedPhone,
                          serviceId: Number(selectedService),
                          date: selectedDate,
                          time: selectedTime,
                          status: "CONFIRMED",
                        }),
                        credentials: "include",
                      });
                      if (!res.ok) {
                        throw new Error(await res.text());
                      }
                      await fetchBookings();
                      setModalOpen(false);
                          setSelectedService("");
                          setSelectedDate("");
                          setSelectedTime("");
                          setClientName("");
                          setClientPhone("");
                          setPhoneError(null);
                    } catch (err) {
                      const message =
                        err instanceof Error ? err.message : t.createFailed;
                      setError(message);
                    } finally {
                      setCreating(false);
                    }
                  }}
                  disabled={creating}
                >
                  {creating ? t.creating : t.createBooking}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
