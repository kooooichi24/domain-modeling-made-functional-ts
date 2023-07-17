import z from "zod";
import { flow, pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { match } from "ts-pattern";
import {
  Address,
  CustomerInfo,
  PersonalName,
} from "../OrderTaking/Common.CompoundTypes";
import {
  CheckAddressExists,
  CheckProductCodeExists,
  CheckedAddress,
  CreateOrderAcknowledgmentLetter,
  GetProductPrice,
  SendOrderAcknowledgment,
  acknowledgeOrder,
  createEvents,
  priceOrder,
  validateOrder,
} from "../OrderTaking/PlaceOrder.Implementation";
import {
  BillingAmount,
  EmailAddress,
  KilogramQuantity,
  OptionalString50,
  OrderId,
  OrderLineId,
  OrderQuantity,
  Price,
  ProductCode,
  String50,
  UnitQuantity,
  ZipCode,
} from "../OrderTaking/Common.SimpleTypes";
import {
  UnvalidatedAddress,
  UnvalidatedOrder,
  ValidatedOrder,
  UnvalidatedCustomerInfo,
  UnvalidatedOrderLine,
  ValidatedOrderLine,
  PricedOrder,
  PricedOrderLine,
  HtmlString,
  OrderAcknowledgment,
  OrderAcknowledgmentSent,
  PlaceOrderEvent,
  BillableOrderPlaced,
  OrderPlaced,
} from "../OrderTaking/PlaceOrder.PublicTypes";

namespace SimpleTypesImplementation {
  const OrderId = z.string().min(1).max(50).brand("OrderId");
  type OrderId = z.infer<typeof OrderId>;
}

namespace UsingFunctionTypesToGuideTheImplementation {
  const Param1 = z.unknown();
  type Param1 = z.infer<typeof Param1>;
  const Param2 = z.unknown();
  type Param2 = z.infer<typeof Param2>;
  const Result = z.unknown();
  type Result = z.infer<typeof Result>;

  type Fn1 = (p1: Param1) => Param2;
  const fn1: Fn1 = (p1: Param1) => Param2.parse("param1");
  type Fn2 = (p2: Param2) => Result;
  const fn2: Fn2 = (p2: Param2) => Result.parse("result");
  type MyFunc = (p1: Param1) => Result;
  const myFunc: MyFunc = flow(fn1, fn2);
}

namespace ImplementingTheValidationStep {
  type CheckAddressExists = (address: UnvalidatedAddress) => CheckedAddress;
  type CheckProductCodeExists = (productCode: ProductCode) => boolean;

  type ValidateOrder = (
    checkProductCodeExists: CheckProductCodeExists, // dependency
    checkAddressExists: CheckAddressExists // dependency
  ) => (
    unvalidatedOrder: UnvalidatedOrder // input
  ) => ValidatedOrder; // output

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

  const predicateToPassthru = <A>(
    errMsg: string,
    f: (a: A) => boolean,
    x: A
  ) => {
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

  const validateOrder: ValidateOrder =
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
}

namespace Pricing {
  type GetProductPrice = (productCode: ProductCode) => Price;
  type PriceOrder = (
    getProductPrice: GetProductPrice
  ) => (validatedOrder: ValidatedOrder) => PricedOrder;

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

  const priceOrder: PriceOrder = (getProductPrice) => (validatedOrder) => {
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
}

namespace AcknowledgeOrder {
  type CreateOrderAcknowledgementLetter = (
    pricedOrder: PricedOrder
  ) => HtmlString;
  type SendResult = "Sent" | "NotSent";
  type SendOrderAcknowledgement = (
    orderAcknowledgement: OrderAcknowledgment
  ) => SendResult;
  type AcknowledgeOrder = (
    createOrderAcknowledgementLetter: CreateOrderAcknowledgementLetter,
    sendOrderAcknowledgement: SendOrderAcknowledgement
  ) => (pricedOrder: PricedOrder) => O.Option<OrderAcknowledgmentSent>;

  const acknowledgeOrder: AcknowledgeOrder =
    (createOrderAcknowledgementLetter, sendOrderAcknowledgement) =>
    (pricedOrder) => {
      const letter = createOrderAcknowledgementLetter(pricedOrder);
      const acknowledgement = OrderAcknowledgment.parse({
        emailAddress: pricedOrder.customerInfo.emailAddress,
        letter,
      });

      return match(sendOrderAcknowledgement(acknowledgement))
        .with("Sent", () =>
          O.some(
            OrderAcknowledgmentSent.parse({ orderId: pricedOrder.orderId })
          )
        )
        .with("NotSent", () => O.none)
        .exhaustive();
    };
}

namespace CreateEvents {
  type CreateEvents = (
    pricedOrder: PricedOrder,
    OrderAcknowledgmentSent: O.Option<OrderAcknowledgmentSent>
  ) => PlaceOrderEvent[];

  const createOrderPlacedEvent = (placedOrder: PricedOrder): PricedOrder =>
    placedOrder;

  // PricedOrder -> BillableOrderPlaced option
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

  //>listOfOption
  /// convert an Option into a List
  const listOfOption = <A>(option: O.Option<A>): A[] => {
    return pipe(
      option,
      O.match(
        () => [],
        (a) => [a]
      )
    );
  };

  const createEvents: CreateEvents = (pricedOrder, acknowledgmentEventOpt) => {
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
}

namespace Composing {
  const checkProductCodeExists: CheckProductCodeExists = (productCode) => {
    throw new Error("Not implemented");
  };
  const checkAddressExists: CheckAddressExists = (address) => {
    throw new Error("Not implemented");
  };
  const getProductPrice: GetProductPrice = (productCode) => {
    throw new Error("Not implemented");
  };
  const createOrderAcknowledgmentLetter: CreateOrderAcknowledgmentLetter = (
    pricedOrder
  ) => {
    throw new Error("Not implemented");
  };
  const sendOrderAcknowledgment: SendOrderAcknowledgment = (
    orderAcknowledgement
  ) => {
    throw new Error("Not implemented");
  };

  type PlaceOrderWorkflow = (
    unvalidatedOrder: UnvalidatedOrder
  ) => PlaceOrderEvent[];

  const placeOrder: PlaceOrderWorkflow = (
    unvalidatedOrder: UnvalidatedOrder
  ) => {
    const validatedOrder = validateOrder(
      checkProductCodeExists,
      checkAddressExists
    )(unvalidatedOrder);
    const pricedOrder = priceOrder(getProductPrice)(validatedOrder);
    const acknowledgmentOption = acknowledgeOrder(
      createOrderAcknowledgmentLetter,
      sendOrderAcknowledgment
    )(pricedOrder);
    const events = createEvents(pricedOrder, acknowledgmentOption);
    return events;
  };
}

namespace InjectingDependencies {}
