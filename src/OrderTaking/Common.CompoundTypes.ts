import z from "zod";
import {
  BillingAmount,
  EmailAddress,
  OrderId,
  OrderLineId,
  OrderQuantity,
  Price,
  ProductCode,
  String50,
  ZipCode,
} from "./Common.SimpleTypes";

export const PersonalName = z.object({
  firstName: String50,
  lastName: String50,
});
export type PersonalName = z.infer<typeof PersonalName>;

export const CustomerInfo = z.object({
  name: PersonalName,
  emailAddress: EmailAddress,
});
export type CustomerInfo = z.infer<typeof CustomerInfo>;

export const Address = z.object({
  addressLine1: String50,
  addressLine2: String50.optional(),
  addressLine3: String50.optional(),
  addressLine4: String50.optional(),
  city: String50,
  zipCod: ZipCode,
});
export type Address = z.infer<typeof Address>;
