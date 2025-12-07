"use client";

import { useEffect, useState } from "react";
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
          <Button
            onClick={handleLogout}
            className="rounded-full bg-amber-600 px-5 py-2 text-sm hover:bg-amber-700"
          >
            Log out
          </Button>
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
            )}
            {loading ? (
              <p className="text-sm text-slate-400">Loading...</p>
            ) : bookings.length === 0 ? (
              <p className="text-sm text-slate-400">No bookings yet.</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    className={`rounded-lg border px-4 py-3 shadow-sm cursor-pointer ${
                      selectedId === b.id
                        ? "border-amber-400 bg-amber-50"
                        : "border-slate-200 bg-white hover:border-amber-200"
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
                    {selectedId === b.id && (
                      <div className="mt-1 text-xs text-amber-700">Selected</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
