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
} from "./SimpleTypes";

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

export const UnvalidatedCustomerInfo = z.object({
  firstName: z.string(),
  lastName: z.string(),
  emailAddress: z.string(),
});
export type UnvalidatedCustomerInfo = z.infer<typeof UnvalidatedCustomerInfo>;

export const UnvalidatedAddress = z.object({
  addressLine1: z.string(),
  addressLine2: z.string().optional(),
  addressLine3: z.string().optional(),
  addressLine4: z.string().optional(),
  city: z.string(),
  zipCode: z.string(),
});
export type UnvalidatedAddress = z.infer<typeof UnvalidatedAddress>;

export const UnvalidatedOrderLine = z.object({
  orderLineId: z.string(),
  productCode: z.string(),
  quantity: z.number(),
});
export type UnvalidatedOrderLine = z.infer<typeof UnvalidatedOrderLine>;

export const UnvalidatedOrder = z.object({
  orderId: z.string(),
  customerInfo: UnvalidatedCustomerInfo,
  shippingAddress: UnvalidatedAddress,
  billingAddress: UnvalidatedAddress,
  lines: z.array(UnvalidatedOrderLine),
});
export type UnvalidatedOrder = z.infer<typeof UnvalidatedOrder>;

export const ValidatedOrderLine = z.object({
  orderLineId: OrderLineId,
  productCode: ProductCode,
  quantity: OrderQuantity,
});
export type ValidatedOrderLine = z.infer<typeof ValidatedOrderLine>;

export const ValidatedOrder = z.object({
  orderId: OrderId,
  customerInfo: CustomerInfo,
  shippingAddress: Address,
  billingAddress: Address,
  lines: z.array(ValidatedOrderLine),
});
export type ValidatedOrder = z.infer<typeof ValidatedOrder>;

// priced state
export const PricedOrderLine = z.object({
  orderLineId: OrderLineId,
  productCode: ProductCode,
  quantity: OrderQuantity,
  linePrice: Price,
});
export type PricedOrderLine = z.infer<typeof PricedOrderLine>;

export const PricedOrder = z.object({
  orderId: OrderId,
  customerInfo: CustomerInfo,
  shippingAddress: Address,
  billingAddress: Address,
  amountToBill: BillingAmount,
  lines: z.array(PricedOrderLine),
});
export type PricedOrder = z.infer<typeof PricedOrder>;

export const OrderPlaced = PricedOrder;
export type OrderPlaced = z.infer<typeof OrderPlaced>;

export const HtmlString = z.string().brand("HtmlString");
export type HtmlString = z.infer<typeof HtmlString>;

export const OrderAcknowledgment = z.object({
  emailAddress: EmailAddress,
  letter: HtmlString,
});
export type OrderAcknowledgment = z.infer<typeof OrderAcknowledgment>;

// Event will be created if the Acknowledgment was successfully posted
export const OrderAcknowledgmentSent = z.object({
  orderId: OrderId,
  emailAddress: EmailAddress,
});
export type OrderAcknowledgmentSent = z.infer<typeof OrderAcknowledgmentSent>;

// Event to send to billing context
// Will only be created if the AmountToBill is not zero
export const BillableOrderPlaced = z.object({
  orderId: OrderId,
  billingAddress: Address,
  amountToBill: BillingAmount,
});
export type BillableOrderPlaced = z.infer<typeof BillableOrderPlaced>;

export const AcknowledgementSent = OrderAcknowledgmentSent;

export const PlaceOrderEvent = z.union([
  OrderPlaced,
  BillableOrderPlaced,
  AcknowledgementSent,
]);
export type PlaceOrderEvent = z.infer<typeof PlaceOrderEvent>;

// ------------------------------------
// the workflow itself

export type PlaceOrder = (unvalidatedOrder: UnvalidatedOrder) => PlaceOrderEvent[];
