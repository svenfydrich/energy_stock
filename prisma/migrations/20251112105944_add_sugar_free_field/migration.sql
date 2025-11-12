-- AlterTable
ALTER TABLE "Drink" ADD COLUMN     "sugarFree" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "WishlistDrink" ADD COLUMN     "sugarFree" BOOLEAN NOT NULL DEFAULT false;
