-- CreateTable
CREATE TABLE "WishlistDrink" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WishlistDrink_pkey" PRIMARY KEY ("id")
);
