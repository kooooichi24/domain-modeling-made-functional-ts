import z from "zod";
import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/function";
import { match } from "ts-pattern";
import { Address, CustomerInfo, PersonalName } from "./Common.CompoundTypes";
import {
  ProductCode,
  Price,
  OrderQuantity,
  BillingAmount,
  EmailAddress,
  OptionalString50,
  String50,
  ZipCode,
  OrderLineId,
  OrderId,
  UnitQuantity,
  KilogramQuantity,
} from "./Common.SimpleTypes";
import {
  UnvalidatedAddress,
  UnvalidatedOrder,
  PricedOrder,
  OrderAcknowledgmentSent,
  PlaceOrderEvent,
  UnvalidatedCustomerInfo,
  UnvalidatedOrderLine,
  PricedOrderLine,
  OrderPlaced,
  BillableOrderPlaced,
  PlaceOrder,
} from "./PlaceOrder.PublicTypes";

// ======================================================
// Section 1 : Define each step in the workflow using types
// ======================================================

// ---------------------------
// Validation step
// ---------------------------

// Product validation
export type CheckProductCodeExists = (productCode: ProductCode) => boolean;

// Address validation
export type CheckAddressExists = (
  address: UnvalidatedAddress
) => CheckedAddress;

export const CheckedAddress = UnvalidatedAddress;
export type CheckedAddress = z.infer<typeof CheckedAddress>;

// ---------------------------
// Validated Order
// ---------------------------

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

type ValidateOrder = (
  checkProductCodeExists: CheckProductCodeExists, // dependency
  checkAddressExists: CheckAddressExists // dependency
) => (
  unvalidatedOrder: UnvalidatedOrder // input
) => ValidatedOrder; // output

// ---------------------------
// Pricing step
// ---------------------------

export type GetProductPrice = (productCode: ProductCode) => Price;

// priced state is defined Domain.WorkflowTypes

type PriceOrder = (
  getProductPrice: GetProductPrice
) => (validatedOrder: ValidatedOrder) => PricedOrder;

// ---------------------------
// Send OrderAcknowledgment
// ---------------------------

export const HtmlString = z.string().brand("HtmlString");
export type HtmlString = z.infer<typeof HtmlString>;

export const OrderAcknowledgment = z.object({
  emailAddress: EmailAddress,
  letter: HtmlString,
});
export type OrderAcknowledgment = z.infer<typeof OrderAcknowledgment>;


export type CreateOrderAcknowledgmentLetter = (
  pricedOrder: PricedOrder
) => HtmlString;

/// Send the order acknowledgement to the customer
/// Note that this does NOT generate an Result-type error (at least not in this workflow)
/// because on failure we will continue anyway.
/// On success, we will generate a OrderAcknowledgmentSent event,
/// but on failure we won't.

type SendResult = "Sent" | "NotSent";

export type SendOrderAcknowledgment = (
  orderAcknowledgement: OrderAcknowledgment
) => SendResult;
type AcknowledgeOrder = (
  createOrderAcknowledgmentLetter: CreateOrderAcknowledgmentLetter,
  sendOrderAcknowledgment: SendOrderAcknowledgment
) => (pricedOrder: PricedOrder) => O.Option<OrderAcknowledgmentSent>;

// ---------------------------
// Create events
// ---------------------------

type CreateEvents = (
  pricedOrder: PricedOrder,
  OrderAcknowledgmentSent: O.Option<OrderAcknowledgmentSent>
) => PlaceOrderEvent[];

// ======================================================
// Section 2 : Implementation
// ======================================================

// ---------------------------
// ValidateOrder step
// ---------------------------

type ToCustomerInfo = (customer: UnvalidatedCustomerInfo) => CustomerInfo;
const toCustomerInfo: ToCustomerInfo = (customer: UnvalidatedCustomerInfo) =>
  CustomerInfo.parse({
    name: PersonalName.parse({
      firstName: String50.parse(customer.firstName),
      lastName: String50.parse(customer.lastName),
    }),
    emailAddress: EmailAddress.parse(customer.emailAddress),
  });

type ToAddress = (
  checkAddressExists: CheckAddressExists,
  unvalidatedAddress: UnvalidatedAddress
) => Address;
const toAddress: ToAddress = (
  checkAddressExists: CheckAddressExists,
  unvalidatedAddress: UnvalidatedAddress
) => {
  const checkedAddress = checkAddressExists(unvalidatedAddress);
  return Address.parse({
    addressLine1: String50.parse(checkedAddress.addressLine1),
    addressLine2: OptionalString50.parse(checkedAddress.addressLine2),
    addressLine3: OptionalString50.parse(checkedAddress.addressLine3),
    addressLine4: OptionalString50.parse(checkedAddress.addressLine4),
    city: String50.parse(checkedAddress.city),
    zipCode: ZipCode.parse(checkedAddress.zipCode),
  });
};

const toOrderQuantity =
  (productCode: ProductCode) =>
  (quantity: number): OrderQuantity => {
    const type = productCode.startsWith("W") ? "Widget" : "Gizmo";
    switch (type) {
      case "Widget":
        return pipe(quantity, UnitQuantity.parse, OrderQuantity.parse);
      case "Gizmo":
        return pipe(quantity, KilogramQuantity.parse, OrderQuantity.parse);
    }
  };

const predicateToPassthru = <A>(errMsg: string, f: (a: A) => boolean, x: A) => {
  if (f(x)) return x;
  else throw new Error(errMsg);
};

const toProductCode =
  (checkProductCodesExist: CheckProductCodeExists) =>
  (productCode: unknown): ProductCode => {
    const checkProduct = (productCode: ProductCode) =>
      predicateToPassthru(
        `Invalid: ${productCode}`,
        checkProductCodesExist,
        productCode
      );
    return pipe(productCode, ProductCode.parse, checkProduct);
  };

const toValidatedOrderLine =
  (checkProductCodesExist: CheckProductCodeExists) =>
  (unvalidatedOrderLine: UnvalidatedOrderLine): ValidatedOrderLine => {
    const orderLineId = OrderLineId.parse(unvalidatedOrderLine.orderLineId);
    const productCode = toProductCode(checkProductCodesExist)(
      unvalidatedOrderLine.productCode
    );
    const quantity = toOrderQuantity(productCode)(
      unvalidatedOrderLine.quantity
    );

    return ValidatedOrderLine.parse({
      orderLineId,
      productCode,
      quantity,
    });
  };

export const validateOrder: ValidateOrder =
  (checkProductCodeExists, checkAddressExists) => (unvalidatedOrder) =>
    ValidatedOrder.parse({
      orderId: OrderId.parse(unvalidatedOrder.orderId),
      customerIndo: toCustomerInfo(unvalidatedOrder.customerInfo),
      shippingAddress: toAddress(
        checkAddressExists,
        unvalidatedOrder.shippingAddress
      ),
      billingAddress: toAddress(
        checkAddressExists,
        unvalidatedOrder.billingAddress
      ),
      lines: unvalidatedOrder.lines.map(
        toValidatedOrderLine(checkProductCodeExists)
      ),
    });

// ---------------------------
// PriceOrder step
// ---------------------------

const toPricedOrderLine =
  (getProductPrice: GetProductPrice) =>
  (line: ValidatedOrderLine): PricedOrderLine => {
    const qty = OrderQuantity.parse(line.quantity);
    const price = getProductPrice(line.productCode);
    const linePrice = Price.parse(qty * price);

    return PricedOrderLine.parse({
      orderLineId: line.orderLineId,
      productCode: line.productCode,
      quantity: line.quantity,
      linePrice,
    });
  };

export const priceOrder: PriceOrder = (getProductPrice) => (validatedOrder) => {
  const lines = validatedOrder.lines.map(toPricedOrderLine(getProductPrice));
  const amountToBill = BillingAmount.parse(
    lines.reduce((acc, line) => acc + line.linePrice, 0)
  );

  return PricedOrder.parse({
    orderId: validatedOrder.orderId,
    customerInfo: validatedOrder.customerInfo,
    shippingAddress: validatedOrder.shippingAddress,
    billingAddress: validatedOrder.billingAddress,
    lines,
    amountToBill,
  });
};

// ---------------------------
// AcknowledgeOrder step
// ---------------------------

export const acknowledgeOrder: AcknowledgeOrder =
  (createOrderAcknowledgementLetter, sendOrderAcknowledgement) =>
  (pricedOrder): O.Option<OrderAcknowledgmentSent> => {
    const letter = createOrderAcknowledgementLetter(pricedOrder);
    const acknowledgement = OrderAcknowledgment.parse({
      emailAddress: pricedOrder.customerInfo.emailAddress,
      letter,
    });

    return match(sendOrderAcknowledgement(acknowledgement))
      .with("Sent", () =>
        O.some(OrderAcknowledgmentSent.parse({ orderId: pricedOrder.orderId }))
      )
      .with("NotSent", () => O.none)
      .exhaustive();
  };

// ---------------------------
// Create events
// ---------------------------

const createOrderPlacedEvent = (placedOrder: PricedOrder): OrderPlaced =>
  placedOrder;

const createBillingEvent = (
  placedOrder: PricedOrder
): O.Option<BillableOrderPlaced> => {
  const billingAmount = BillingAmount.parse(placedOrder.amountToBill);
  if (billingAmount > 0) {
    return O.some(
      BillableOrderPlaced.parse({
        orderId: placedOrder.orderId,
        billingAddress: placedOrder.billingAddress,
        amountToBill: placedOrder.amountToBill,
      })
    );
  } else {
    return O.none;
  }
};

const listOfOption = <A>(option: O.Option<A>): A[] => {
  return pipe(
    option,
    O.match(
      () => [],
      (a) => [a]
    )
  );
};

export const createEvents: CreateEvents = (
  pricedOrder,
  acknowledgmentEventOpt
) => {
  const orderPlacedEvents = pipe(
    pricedOrder,
    createOrderPlacedEvent,
    OrderPlaced.parse
  );
  const acknowledgmentEvents = pipe(
    acknowledgmentEventOpt,
    O.map(OrderAcknowledgmentSent.parse),
    listOfOption
  );
  const billingEvents = pipe(
    pricedOrder,
    createBillingEvent,
    O.map(BillableOrderPlaced.parse),
    listOfOption
  );

  return [orderPlacedEvents, acknowledgmentEvents, billingEvents].flat();
};

// ---------------------------
// overall workflow
// ---------------------------

const placeOrder =
  (
    checkProductExists: CheckProductCodeExists,
    checkAddressExists: CheckAddressExists,
    getProductPrice: GetProductPrice,
    createOrderAcknowledgmentLetter: CreateOrderAcknowledgmentLetter,
    sendOrderAcknowledgment: SendOrderAcknowledgment
  ): PlaceOrder =>
  (unvalidatedOrder: UnvalidatedOrder) => {
    const validatedOrder = validateOrder(
      checkProductExists,
      checkAddressExists
    )(unvalidatedOrder);
    const pricedOrder = priceOrder(getProductPrice)(validatedOrder);
    const acknowledgmentEventOpt = acknowledgeOrder(
      createOrderAcknowledgmentLetter,
      sendOrderAcknowledgment
    )(pricedOrder);
    return createEvents(pricedOrder, acknowledgmentEventOpt);
  };
