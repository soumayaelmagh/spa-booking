// prisma/seed.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Prices are in DH (not cents).
 * Durations are approximate – you can adjust anytime.
 */

const servicesData = [
  // =========================
  // HAIR
  // =========================
  { name: "Hair - Balayage / Highlights (Short)", durationMinutes: 90, price: 500, category: "HAIR" },
  { name: "Hair - Balayage / Highlights (Medium)", durationMinutes: 120, price: 700, category: "HAIR" },
  { name: "Hair - Balayage / Highlights (Long)", durationMinutes: 150, price: 800, category: "HAIR" },

  { name: "Hair - Ombré (Short, no toner)", durationMinutes: 150, price: 900, category: "HAIR", description: "900–1200 DH" },
  { name: "Hair - Ombré (Medium, no toner)", durationMinutes: 180, price: 1200, category: "HAIR", description: "1200–1400 DH" },
  { name: "Hair - Ombré (Long, no toner)", durationMinutes: 180, price: 1400, category: "HAIR", description: "1400–1800 DH" },
  { name: "Hair - Toner / Rinse", durationMinutes: 45, price: 200, category: "HAIR", description: "200–300 DH" },

  { name: "Hair - Protein Straightening", durationMinutes: 180, price: 800, category: "HAIR", description: "From 800 DH" },
  { name: "Hair - Botox Straightening", durationMinutes: 180, price: 2000, category: "HAIR", description: "From 2000 DH" },

  { name: "Hair - Blow-dry", durationMinutes: 45, price: 80, category: "HAIR", description: "80 / 100 / 120 DH" },
  { name: "Hair - Blow-dry + Shampoo + Mask", durationMinutes: 60, price: 100, category: "HAIR" },
  { name: "Hair - Blow-dry + Kerastase Treatment", durationMinutes: 60, price: 100, category: "HAIR" },
  { name: "Hair - Blow-dry + Shampoo + Kerastase Mask", durationMinutes: 75, price: 150, category: "HAIR" },

  { name: "Hair - Haircut", durationMinutes: 45, price: 150, category: "HAIR" },
  { name: "Hair - Haircut + Blow-dry", durationMinutes: 60, price: 200, category: "HAIR" },
  { name: "Hair - Fringe / Ends Trim", durationMinutes: 20, price: 50, category: "HAIR" },
  { name: "Hair - Wavy Styling", durationMinutes: 45, price: 150, category: "HAIR", description: "150 / 200 DH" },
  { name: "Hair - Kids Haircut", durationMinutes: 30, price: 80, category: "HAIR" },

  { name: "Hair Care - Classic Treatment", durationMinutes: 45, price: 200, category: "HAIR" },
  { name: "Hair Care - Fusio-Dose Treatment", durationMinutes: 45, price: 300, category: "HAIR" },
  { name: "Hair Care - Caviar Treatment", durationMinutes: 60, price: 450, category: "HAIR" },

  { name: "Hair Color - Roots", durationMinutes: 90, price: 250, category: "HAIR", description: "From 250 DH" },
  { name: "Hair Color - Short Hair", durationMinutes: 120, price: 300, category: "HAIR", description: "From 300 DH" },
  { name: "Hair Color - Long Hair", durationMinutes: 150, price: 400, category: "HAIR", description: "From 400 DH" },

  { name: "Hair Color (Ammonia-free) - Roots", durationMinutes: 90, price: 300, category: "HAIR" },
  { name: "Hair Color (Ammonia-free) - Short Hair", durationMinutes: 120, price: 350, category: "HAIR" },
  { name: "Hair Color (Ammonia-free) - Long Hair", durationMinutes: 150, price: 450, category: "HAIR" },

  // =========================
  // HAMMAM & MASSAGE
  // =========================
  {
    name: "Hammam - Traditional Hammam (Natus) 60 min",
    durationMinutes: 60,
    price: 200,
    category: "HAMMAM_MASSAGE",
    description: "Honey henna wrap, scrub, shampoo and mask, soaping, body wrap, herbal ghassoul.",
  },
  {
    name: "Hammam - Rituals Hammam 60 min",
    durationMinutes: 60,
    price: 400,
    category: "HAMMAM_MASSAGE",
    description: "Black soap by Rituals, traditional scrub, shampoo, aromatic scrub mask, body mask, nourishing scented oil.",
  },
  {
    name: "Hammam - Royal Hammam 90 min",
    durationMinutes: 90,
    price: 600,
    category: "HAMMAM_MASSAGE",
    description: "Verbena scent, traditional scrub, honey facial mask, shampoo and mask, 30 min relaxing massage.",
  },

  { name: "Massage - Relaxing Anti-stress 30 min", durationMinutes: 30, price: 300, category: "HAMMAM_MASSAGE" },
  { name: "Massage - Relaxing Anti-stress 60 min", durationMinutes: 60, price: 600, category: "HAMMAM_MASSAGE" },
  { name: "Massage - Aromatic Hot Oil", durationMinutes: 60, price: 500, category: "HAMMAM_MASSAGE" },
  { name: "Massage - Traditional Thai (without oil)", durationMinutes: 60, price: 450, category: "HAMMAM_MASSAGE" },
  { name: "Massage - Organic Aromatic Thai", durationMinutes: 60, price: 500, category: "HAMMAM_MASSAGE" },
  { name: "Massage - 4 Hands", durationMinutes: 60, price: 700, category: "HAMMAM_MASSAGE" },
  { name: "Massage - Foot Reflexology 30 min", durationMinutes: 30, price: 270, category: "HAMMAM_MASSAGE" },
  { name: "Massage - Foot Reflexology 60 min", durationMinutes: 60, price: 500, category: "HAMMAM_MASSAGE" },
  { name: "Massage - Hot Stone", durationMinutes: 60, price: 650, category: "HAMMAM_MASSAGE" },
  { name: "Massage - Thai with Hot Compresses", durationMinutes: 60, price: 700, category: "HAMMAM_MASSAGE" },
  { name: "Massage - Head Massage 30 min", durationMinutes: 30, price: 300, category: "HAMMAM_MASSAGE" },
  { name: "Massage - Head Massage 60 min", durationMinutes: 60, price: 500, category: "HAMMAM_MASSAGE" },
  { name: "Massage - Back & Shoulder 30 min", durationMinutes: 30, price: 300, category: "HAMMAM_MASSAGE" },
  { name: "Massage - Back & Shoulder 60 min", durationMinutes: 60, price: 500, category: "HAMMAM_MASSAGE" },
  { name: "Massage - Special Kids Massage", durationMinutes: 30, price: 300, category: "HAMMAM_MASSAGE" },

  // =========================
  // NAILS
  // =========================
  { name: "Nails - Manicure", durationMinutes: 45, price: 100, category: "NAILS" },
  { name: "Nails - Pedicure + Normal Polish", durationMinutes: 60, price: 170, category: "NAILS" },
  { name: "Nails - Normal Polish", durationMinutes: 30, price: 50, category: "NAILS" },
  { name: "Nails - Semi-permanent Polish", durationMinutes: 45, price: 150, category: "NAILS" },
  { name: "Nails - Fake Nails + Normal Polish", durationMinutes: 90, price: 200, category: "NAILS" },
  { name: "Nails - BIAB Manicure", durationMinutes: 90, price: 450, category: "NAILS" },
  { name: "Nails - Gel Nails", durationMinutes: 90, price: 600, category: "NAILS" },
  { name: "Nails - Refill", durationMinutes: 60, price: 350, category: "NAILS" },
  { name: "Nails - Removal of Semi-permanent Polish", durationMinutes: 30, price: 50, category: "NAILS" },
  { name: "Nails - Gel Removal", durationMinutes: 30, price: 100, category: "NAILS" },

  // =========================
  // LASHES
  // =========================
  {
    name: "Lashes - Classic Full Set (one by one)",
    durationMinutes: 90,
    price: 150,
    category: "LASHES",
    description: "150 / 200 DH",
  },
  { name: "Lashes - Strip / False Lashes", durationMinutes: 60, price: 150, category: "LASHES" },
  { name: "Lashes - Classic Extensions", durationMinutes: 120, price: 500, category: "LASHES" },
  { name: "Lashes - Russian Volume", durationMinutes: 120, price: 600, category: "LASHES" },
  { name: "Lashes - Refill", durationMinutes: 90, price: 400, category: "LASHES" },

  // =========================
  // FACIAL
  // =========================
  { name: "Facial - Glow Basic Treatment", durationMinutes: 45, price: 450, category: "FACIAL" },
  { name: "Facial - Glow 45 min", durationMinutes: 45, price: 500, category: "FACIAL" },
  { name: "Facial - Hydrafacial", durationMinutes: 60, price: 500, category: "FACIAL" },
  { name: "Facial - Anti-aging Treatment", durationMinutes: 60, price: 600, category: "FACIAL" },
];

async function main() {
  console.log("🧹 Clearing existing services...");
  await prisma.service.deleteMany();

  console.log("🌱 Seeding services...");
  await prisma.service.createMany({
    data: servicesData,
  });

  console.log("✅ Done seeding services.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    prisma.$disconnect();
  });
