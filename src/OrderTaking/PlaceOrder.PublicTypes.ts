import z from "zod";
import {
  BillingAmount,
  EmailAddress,
  OrderId,
  OrderLineId,
  OrderQuantity,
  Price,
  ProductCode,
} from "./Common.SimpleTypes";
import { Address, CustomerInfo } from "./Common.CompoundTypes";

// ------------------------------------
// inputs to the workflow

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


// ------------------------------------
// outputs from the workflow (success case)


// Event will be created if the Acknowledgment was successfully posted
export const OrderAcknowledgmentSent = z.object({
  orderId: OrderId,
  emailAddress: EmailAddress,
});
export type OrderAcknowledgmentSent = z.infer<typeof OrderAcknowledgmentSent>;

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
// error outputs 



// ------------------------------------
// the workflow itself

export type PlaceOrder = (
  unvalidatedOrder: UnvalidatedOrder
) => PlaceOrderEvent[];
