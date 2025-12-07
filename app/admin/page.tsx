"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminPage() {
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
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
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
      const message = err instanceof Error ? err.message : "Failed to load bookings";
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
        const res = await fetch("/api/services");
        if (!res.ok) return;
        const data: Service[] = await res.json();
        setServices(data);
      } catch (err) {
        console.error(err);
      }
    }
    if (modalOpen && services.length === 0) {
      loadServices();
    }
  }, [modalOpen, services.length]);

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
      setError("Select a booking first.");
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
        setError("Session expired. Please log in again.");
        return;
      }
      if (!res.ok) {
        throw new Error(await res.text());
      }
      await fetchBookings(); // refresh from DB to ensure UI matches persisted state
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update booking";
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
      const message = err instanceof Error ? err.message : "Login failed";
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
          <p className="text-xs uppercase tracking-[0.25em] text-amber-700">Admin</p>
          <h1 className="text-3xl font-bold  text-amber-600 tracking-tight">Appointments</h1>
        </div>
        {loggedIn && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              className="rounded-full bg-amber-600 px-5 py-2 text-sm hover:bg-amber-700"
              onClick={() => setModalOpen(true)}
            >
              Create appointment
            </Button>
            <Button
              onClick={handleLogout}
              className="rounded-full bg-amber-600 px-5 py-2 text-sm hover:bg-amber-700"
            >
              Log out
            </Button>
          </div>
        )}
      </div>

      {!loggedIn ? (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={loggingIn}>
                {loggingIn ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Bookings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-sm text-red-500">{error}</p>}
            {bookings.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600">Category</label>
                    <select
                      className="block rounded-md border px-3 py-2 text-sm"
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                    >
                      <option value="ALL">All</option>
                      <option value="HAIR">Hair</option>
                      <option value="HAMMAM_MASSAGE">Hammam & Massage</option>
                      <option value="NAILS">Nails</option>
                      <option value="LASHES">Lashes</option>
                      <option value="FACIAL">Facial</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Date</label>
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
                      {updatingId && selectedId === updatingId ? "Confirming..." : "Confirm"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateStatus("CANCELLED")}
                      disabled={updatingId !== null || !selectedId}
                    >
                      {updatingId && selectedId === updatingId ? "Cancelling..." : "Cancel"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {loading ? (
              <p className="text-sm text-slate-400">Loading...</p>
            ) : bookings.length === 0 ? (
              <p className="text-sm text-slate-400">No bookings yet.</p>
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
                            {b.status}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          {new Date(b.date).toLocaleDateString()} · {b.startTime}–{b.endTime}
                        </div>
                        <div className="mt-1 text-sm text-slate-700">
                          {b.client.name}
                          {b.client.phone ? ` · ${b.client.phone}` : ""}
                        </div>
                        {isSelected && (
                          <div className="mt-1 text-xs text-amber-700">Selected</div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Create Appointment</h2>
              <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
                Close
              </Button>
            </div>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <select
                    className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedService("");
                    }}
                  >
                    <option value="ALL">All</option>
                    <option value="HAIR">Hair</option>
                    <option value="HAMMAM_MASSAGE">Hammam & Massage</option>
                    <option value="NAILS">Nails</option>
                    <option value="LASHES">Lashes</option>
                    <option value="FACIAL">Facial</option>
                  </select>
                </div>
                <div>
                  <Label>Service</Label>
                  <select
                    className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                  >
                    <option value="">Select service</option>
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
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Time</Label>
                  <select
                    className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    disabled={loadingSlots || availableSlots.length === 0}
                  >
                    <option value="">
                      {loadingSlots ? "Loading..." : "Select time"}
                    </option>
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                      if (
                        emailError &&
                        emailPattern.test(e.target.value.trim().toLowerCase())
                      ) {
                        setEmailError(null);
                      }
                    }}
                    placeholder="you@example.com"
                  />
                  {emailError && (
                    <p className="mt-1 text-xs text-red-500">{emailError}</p>
                  )}
                </div>
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
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Cancel
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
                      setError("Please fill all required fields.");
                      return;
                    }
                    const normalizedEmail = clientEmail.trim().toLowerCase();
                    if (!emailPattern.test(normalizedEmail)) {
                      setEmailError("Enter a valid email.");
                      return;
                    }
                    const normalizedPhone = clientPhone.replace(/[\s-]/g, "").trim();
                    if (!moroccoPhonePattern.test(normalizedPhone)) {
                      setPhoneError(
                        "Enter a valid Moroccan number (start with +212 or 0, digits only)."
                      );
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
                          email: normalizedEmail,
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
                      setClientEmail("");
                      setClientPhone("");
                      setEmailError(null);
                      setPhoneError(null);
                    } catch (err) {
                      const message =
                        err instanceof Error ? err.message : "Failed to create booking";
                      setError(message);
                    } finally {
                      setCreating(false);
                    }
                  }}
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create booking"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
