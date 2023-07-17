import z from "zod";

export const String50 = z.string().min(1).max(50).brand("String50");
export type String50 = z.infer<typeof String50>;

export const OptionalString50 = String50.optional();
export type OptionalString50 = z.infer<typeof OptionalString50>;

export const EmailAddress = z.string().email().brand("EmailAddress");
export type EmailAddress = z.infer<typeof EmailAddress>;

export const ZipCode = z
  .string()
  .regex(/^\d{5}$/)
  .brand("ZipCode");
export type ZipCode = z.infer<typeof ZipCode>;

export const OrderId = z.string().min(1).max(50).brand("OrderId");
export type OrderId = z.infer<typeof OrderId>;

export const OrderLineId = z.string().min(1).max(50).brand("OrderLineId");
export type OrderLineId = z.infer<typeof OrderLineId>;

export const WidgetCode = z
  .string()
  .regex(/^W\d{4}$/)
  .brand("WidgetCode");
export type WidgetCode = z.infer<typeof WidgetCode>;

export const GizmoCode = z
  .string()
  .regex(/^G\d{3}$/)
  .brand("GizmoCode");
export type GizmoCode = z.infer<typeof GizmoCode>;

export const ProductCode = z.union([WidgetCode, GizmoCode]);
export type ProductCode = z.infer<typeof ProductCode>;

export const UnitQuantity = z
  .number()
  .int()
  .min(1)
  .max(1000)
  .brand("UnitQuantity");
export type UnitQuantity = z.infer<typeof UnitQuantity>;

export const KilogramQuantity = z
  .number()
  .min(0.05)
  .max(100)
  .brand("KilogramQuantity");
export type KilogramQuantity = z.infer<typeof KilogramQuantity>;

export const OrderQuantity = z.union([UnitQuantity, KilogramQuantity]);
export type OrderQuantity = z.infer<typeof OrderQuantity>;

export const Price = z.number().min(0.0).max(1000.0).brand("Price");
export type Price = z.infer<typeof Price>;

export const BillingAmount = z
  .number()
  .min(0.0)
  .max(10000.0)
  .brand("BillingAmount");
export type BillingAmount = z.infer<typeof BillingAmount>;
