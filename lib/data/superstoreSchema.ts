import { z } from "zod";

const numericLike = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (typeof value === "number") return value;
    if (typeof value !== "string") return 0;
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  });

const dateLike = z
  .union([z.date(), z.string()])
  .transform((value) => (value instanceof Date ? value : new Date(value)));

export const superstoreRowSchema = z.object({
  rowId: z.string().min(1),
  orderId: z.string().min(1),
  orderDate: dateLike,
  shipDate: dateLike,
  shipMode: z.string().min(1),
  customerId: z.string().min(1),
  customerName: z.string().min(1),
  segment: z.string().min(1),
  country: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string(),
  region: z.string().min(1),
  productId: z.string().min(1),
  category: z.string().min(1),
  subCategory: z.string().min(1),
  productName: z.string().min(1),
  sales: numericLike,
  quantity: numericLike,
  discount: numericLike,
  profit: numericLike,
});

export type SuperstoreRow = z.infer<typeof superstoreRowSchema>;
