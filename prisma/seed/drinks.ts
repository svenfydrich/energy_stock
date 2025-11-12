/**
 * Seed script to insert initial drinks.
 *
 * Run (after generating Prisma client):
 *  npx prisma generate
 *  ts-node prisma/seed/drinks.ts
 *    OR
 *  node --loader ts-node/esm prisma/seed/drinks.ts
 *
 * If you plan to re-run this multiple times and want to avoid duplicates,
 * consider adding a unique constraint on Drink.name in schema.prisma:
 *
 * model Drink {
 *   id       Int     @id @default(autoincrement())
 *   name     String  @unique
 *   price    Float
 *   stock    Int
 *   imageUrl String?
 *   purchases Purchase[]
 * }
 *
 * Then you could use createMany({ skipDuplicates: true }) or upsert.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const Images = {
  monster:
    "https://i5.walmartimages.com/asr/3fbc29c0-52b0-4225-82dd-115374c12590.a120c7084fbb9d1209f40748fa8776df.png",
  redbull:
    "https://camperdowncellars.com.au/cdn/shop/files/CCD00DEC6A60CF8285AADBCE26535EF0FC83E6E30229CDB001161DDBA42CC45D_clipped_rev_1_0f9acafa-cc0b-4655-aa8c-c8c297c46fed_1200x.png?v=1691276668",
  redbullSugarFree:
    "https://dosenmatrosen.imgbolt.de/media/bc/87/65/1691506071/GL003634-1-1-Red-Bull-Sugar-Free.png?ts=1758616246",
  monsterUltraRosa:
    "https://dosenmatrosen.imgbolt.de/media/fd/18/1a/1682673837/GL007372-1-1-Monster-Ultra-Rosa.png?ts=1682673837",
  spezi:
    "https://getraenkeservice-muenchen.com/wp-content/uploads/2020/09/Spezi-03L.png",
  monsterUlraWhite:
    "https://www.bodyandfit.com/cdn/shop/files/1146183_Image_01.png?v=1752145836&width=1214",
};

type SeedDrink = {
  brand?: string;
  name: string;
  stock: number;
  sugarFree?: boolean;
  price: number;
  imageUrl?: string | null;
};

const drinks: SeedDrink[] = [
  {
    brand:"Monster Energy",
    name: "Original",
    stock: 4,
    price: 1.0,
    imageUrl: Images.monster },
  {
    brand: "Redbull",
    name: "Regular",
    stock: 10,
    price: 1.0,
    imageUrl: Images.redbull },
  {
    brand: "Redbull",
    name: "Sugar Free",
    stock: 3,
    sugarFree: true,
    price: 1.0,
    imageUrl: Images.redbullSugarFree,
  },
  {
    brand: "Monster",
    name: "Ultra Rosa",
    stock: 2,
    sugarFree: true,
    price: 1.0,
    imageUrl: Images.monsterUltraRosa,
  },
  {
    brand: "Paulaner",
    name: "Spezi",
    stock: 6,
    price: 1.0,
    imageUrl: Images.spezi },
  {
    brand: "Monster",
    name: "Ultra White",
    stock: 5,
    sugarFree: true,
    price: 1.0,
    imageUrl: Images.monsterUlraWhite,
  },
];

async function seedDrinks() {
  console.log("Starting drink seed...");

  for (const drink of drinks) {
    const existing = await prisma.drink.findFirst({
      where: { name: drink.name },
    });

    if (existing) {
      await prisma.drink.update({
        where: { id: existing.id },
        data: {
          stock: drink.stock,
          price: drink.price,
          imageUrl: drink.imageUrl ?? existing.imageUrl ?? null,
        },
      });
      console.log(`Updated existing drink: ${drink.name}`);
    } else {
      await prisma.drink.create({ data: drink });
      console.log(`Created new drink: ${drink.name}`);
    }
  }

  console.log("Drink seed complete.");
}

async function main() {
  await seedDrinks();
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
