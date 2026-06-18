export type Drink = {
  id: number;
  name: string;
  brand: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  sugarFree: boolean;
};

export type WishlistDrink = {
  id: number;
  name: string;
  imageUrl: string | null;
  createdAt: string;
};

export type DrinkFormData = {
  name: string;
  brand: string;
  stock: number;
  price: number;
  imageUrl: string;
  sugarFree: boolean;
};

export type ConfirmState = {
  isOpen: boolean;
  drinkId: number | null;
  drinkName: string;
};
