export type Product = {
  category: string;
  code: number;
  desc: string;
  prov: string;
  codExt: string | null;
};

export type Competitor = {
  name: string;
};

export type ProductImage = {
  code: number;
  link: string;
};

export type PriceCheck = {
  id: number;
  productCode: number;
  competitor: string;
  price: number;
  brand: string | null;
  status: 'Igual' | 'Similar';
  createdAt: string;
};
