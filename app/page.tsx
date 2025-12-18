"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";

const copy = {
  en: {
    kicker: "Fifth Avenue Wellness & Spa",
    welcome: "Welcome to",
    highlight: "Fifth Avenue",
    intro:
      "Escape the noise of the city and step into a space of calm. From hammam rituals and relaxing massages to hair, nails and facial care, our team is here to make you feel renewed.",
    services: "Hammam · Massage · Hair · Nails · Facial",
    ctaBook: "Book your appointment",
    ctaMenu: "View Menu",
    badge: "Now accepting online bookings",
    hero1: "Hammam and massage area at Fifth Avenue",
    hero2: "Relaxing massage at Fifth Avenue",
    hero3: "Hair and beauty area at Fifth Avenue",
  },
  fr: {
    kicker: "Fifth Avenue Wellness & Spa",
    welcome: "Bienvenue à",
    highlight: "Fifth Avenue",
    intro:
      "Évadez-vous du bruit de la ville et entrez dans un espace de calme. Hammam, massages relaxants, coiffure, ongles et soins du visage : notre équipe est là pour vous ressourcer.",
    services: "Hammam · Massage · Coiffure · Ongles · Visage",
    ctaBook: "Réserver un rendez-vous",
    ctaMenu: "Voir la carte",
    badge: "Réservation en ligne disponible",
    hero1: "Espace hammam et massage chez Fifth Avenue",
    hero2: "Massage relaxant chez Fifth Avenue",
    hero3: "Espace coiffure et beauté chez Fifth Avenue",
  },
};

export default function HomePage() {
  const { language } = useLanguage();
  const t = copy[language];

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#F7F3EE] text-slate-800">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 lg:grid lg:grid-cols-2 lg:items-center lg:px-8 lg:py-16">
        {/* LEFT: text + CTA */}
        <section className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-yellow-400">
            {t.kicker}
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {t.welcome}{" "}
            <span className="text-yellow-500">{t.highlight}</span>
          </h1>

          <p className="max-w-md text-sm leading-relaxed text-slate-800 sm:text-base">
            {t.intro}
          </p>

          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
            {t.services}
          </p>

        <div
            className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center animate-fadeInUp"   >
            {/* Book button */}
            <Link href="/booking" className="w-full sm:w-auto group">
                <Button
                  size="lg"
                  className="w-full rounded-full px-8 sm:w-auto transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(255,200,65,0.4)] hover:text-yellow-300 active:scale-[0.97]"
                >
                {t.ctaBook}
                </Button>
            </Link>

            {/* Menu button */}
            <Link href="/menu" className="w-full sm:w-auto group">
                <Button
                variant="outline"
                size="lg"
                className=" w-full rounded-full px-8 sm:w-auto border-amber-300 text-amber-300 hover:bg-amber-300/10 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(255,200,65,0.3)] active:scale-[0.97]">
                {t.ctaMenu}
                </Button>
            </Link>
            </div>

        </section>

        {/* RIGHT: image collage */}
        <section className="relative h-80 w-full lg:h-[460px]">
          <div className="pointer-events-none absolute inset-0 rounded-[3rem] bg-linear-to-br from-amber-200/5 via-amber-500/5 to-slate-900/60 blur-3xl" />

          <div className="relative grid h-full grid-cols-2 gap-4">
            {/* big left image */}
            <div className="relative row-span-2 rounded-3xl border border-slate-800/70 bg-slate-900/60 shadow-xl shadow-black/40">
              <Image
                src="/images/spa-1.png"
                alt={t.hero1}
                fill
                className="rounded-3xl object-cover"
                priority
              />
            </div>

            {/* top-right small image */}
            <div className="relative rounded-3xl border border-slate-800/70 bg-slate-900/60 shadow-lg shadow-black/40">
              <Image
                src="/images/spa-2.png"
                alt={t.hero2}
                fill
                className="rounded-3xl object-cover"
              />
            </div>

            {/* bottom-right small image */}
            <div className="relative rounded-3xl border border-slate-800/70 bg-slate-900/60 shadow-lg shadow-black/40">
              <Image
                src="/images/spa-3.png"
                alt={t.hero3}
                fill
                className="rounded-3xl object-cover"
              />
            </div>
          </div>

          {/* badge */}
          <div className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-amber-400/40 bg-slate-950/80 px-4 py-2 text-xs text-amber-100 shadow-lg shadow-black/40 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>{t.badge}</span>
          </div>
        </section>
      </div>
    </main>
  );
}
