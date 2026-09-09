export type Product = {
  id: string;
  desc: string;
  prov: string;
  category: string;
};

export type Competitor = {
  id: string;
  name: string;
};

export type PriceCheck = {
  id: number;
  productId: string;
  competitor: string;
  price: number;
  brand: string | null;
  status: 'Igual' | 'Similar';
  notes: string | null;
  createdAt: string;
};
