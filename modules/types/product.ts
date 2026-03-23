export type Product = {
  product_id: number;
  name: string;
  tyre_size: string;
  pattern: string;
  year: string;
  origin: string;
  image_url: string;
  stock_qty: number;
  final_price: number;

  sku?: string;
  item_code?: string;
  stock_status?: string;
  product_url?: string;
  is_action?: string;
  action?: string;
};