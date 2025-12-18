"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";

const copy = {
  en: {
    kicker: "Fifth Avenue Wellness & Spa",
    title: "Service Menu",
    subtitle:
      "Discover all our hair, hammam & massage, nails, lashes and facial treatments.",
    back: "Back to main page",
    book: "Book an appointment",
    note:
      "Prices are in Moroccan Dirham (DH) and may vary depending on hair length and personalized treatments. For tailored advice, please contact the spa.",
    imageAlt: (i: number) => `Fifth Avenue menu page ${i + 1}`,
    close: "Close preview",
  },
  fr: {
    kicker: "Fifth Avenue Wellness & Spa",
    title: "Carte des services",
    subtitle:
      "Découvrez tous nos soins coiffure, hammam & massage, ongles, extensions de cils et soins du visage.",
    back: "Retour à la page d'accueil",
    book: "Prendre rendez-vous",
    note:
      "Les prix sont indiqués en Dirham marocain (DH) et peuvent varier selon la longueur des cheveux et les soins personnalisés. Pour un conseil sur mesure, contactez le spa.",
    imageAlt: (i: number) => `Page ${i + 1} du menu Fifth Avenue`,
    close: "Fermer l'aperçu",
  },
};

export default function MenuPage() {
  const pages = ["/images/menu-1.jpg", "/images/menu-2.jpg", "/images/menu-3.jpg"];
  const [activePage, setActivePage] = useState<string | null>(null);
  const { language } = useLanguage();
  const t = copy[language];

  return (
    <main className="min-h-screen bg-[#F7F3EE] text-slate-800">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 lg:px-8 lg:py-16">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-700">
              {t.kicker}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              {t.title}
            </h1>
            <p className="text-xs text-slate-600">
              {t.subtitle}
            </p>
            
          </div>

          <div className="flex items-center gap-3">
            <Link href="/">
              <Button
                variant="outline"
                className="rounded-full border-amber-600 px-5 py-2 text-sm text-amber-700 hover:bg-amber-50"
              >
                {t.back}
              </Button>
            </Link>
            <Link href="/booking">
              <Button className="rounded-full bg-amber-600 px-5 py-2 text-sm hover:bg-amber-700">
                {t.book}
              </Button>
            </Link>
          </div>
        </header>

        {/* Book-style layout */}
        <section className="mt-6 flex justify-center">
             
          <div
            className="
              relative w-full max-w-5xl
              rounded-[2.5rem] border border-[#E5DBCF]
              bg-[#FBF8F3]
              shadow-[0_18px_45px_rgba(0,0,0,0.08)]
              px-4 py-6
              lg:px-8 lg:py-8
            "
          >
            <div className="mb-4 ">
              <p className="mt-6 text-center text-xs text-slate-500">
                {t.note}
                </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {pages.map((src, i) => (
                <article
                  key={src}
                  className="
                    group flex flex-col items-center cursor-pointer
                    rounded-3xl bg-white
                    px-3 py-4
                    shadow-[0_4px_18px_rgba(0,0,0,0.06)]
                    transition-all duration-500
                    hover:-translate-y-1
                    hover:shadow-[0_18px_45px_rgba(160,120,60,0.25)]
                    hover:border-amber-200
                    border border-transparent
                  "
                  onClick={() => setActivePage(src)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActivePage(src);
                    }
                  }}
                >
                  

                  <div className="relative aspect-9/16 w-full overflow-hidden rounded-2xl bg-white group">
                    <Image
                        src={src}
                        alt={t.imageAlt(i)}
                        fill
                        className="
                        object-contain
                        transition-all duration-500 ease-out
                        scale-105 opacity-80
                        group-hover:scale-100 group-hover:opacity-100
                        "
                        sizes="(max-width: 768px) 90vw, 280px"
                    />
                    </div>
                </article>
              ))}
            </div>
          </div>
        </section>

       
      </div>

      {activePage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8 backdrop-blur-sm"
          onClick={() => setActivePage(null)}
          role="presentation"
        >
          <div
            className="relative h-[85vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-slate-900/40 shadow-2xl shadow-black/40 ring-1 ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={activePage}
              alt="Menu page enlarged view"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 1200px"
              priority
            />
            <button
              onClick={() => setActivePage(null)}
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow-md transition hover:bg-white"
              aria-label={t.close}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
