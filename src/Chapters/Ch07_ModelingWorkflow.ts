import z from "zod";
import * as TE from "fp-ts/TaskEither";
import { match } from "ts-pattern";

const Data = z.record(z.any());
type Data = z.infer<typeof Data>;

const Command = <T extends z.ZodType<Data>>(data: T) =>
  z.object({
    data,
    timestamp: z.date(),
    userId: z.string(),
  });

const Undefined = z.undefined();

const OrderId = z.string().uuid();
type OrderId = z.infer<typeof OrderId>;

const CustomerInfo = Undefined;
type CustomerInfo = z.infer<typeof CustomerInfo>;

const UnvalidatedAddress = Undefined;
type UnvalidatedAddress = z.infer<typeof UnvalidatedAddress>;

const UnvalidatedOrder = z.object({
  orderId: OrderId,
  customerInfo: CustomerInfo,
  shippingAddress: UnvalidatedAddress,
});
const PlaceOrder = Command(UnvalidatedOrder);

const ChangeOrder = Undefined;
const CancelOrder = Undefined;

const OrderTakingCommand = z.union([PlaceOrder, ChangeOrder, CancelOrder]);
type OrderTakingCommand = z.infer<typeof OrderTakingCommand>;

/** State2 */
const Address = Undefined;
type Address = z.infer<typeof Address>;
const ValidatedOrderLine = Undefined;
type ValidatedOrderLine = z.infer<typeof ValidatedOrderLine>;

const ValidatedOrder = z.object({
  orderId: OrderId,
  customerInfo: CustomerInfo,
  shippingAddress: Address,
  billingAddress: Address,
  orderLines: z.array(ValidatedOrderLine).nonempty(),
});
type ValidatedOrder = z.infer<typeof ValidatedOrder>;

const PricedOrderLine = Undefined;
const BillingAmount = Undefined;

const PricedOrder = z.object({
  orderId: OrderId,
  customerInfo: CustomerInfo,
  shippingAddress: Address,
  billingAddress: Address,
  // different from ValidatedOrder
  orderLines: z.array(PricedOrderLine).nonempty(),
  billingAmount: BillingAmount,
});
type PricedOrder = z.infer<typeof PricedOrder>;

const Order = z.union([UnvalidatedOrder, ValidatedOrder, PricedOrder]);

/** ShoppingCart */
const NonEmptyArray = <T extends z.ZodTypeAny>(item: T) =>
  z.array(item).refine((data) => data.length > 0, {
    message: "Must be a non-empty array",
  });

const Item = Undefined;
type Item = z.infer<typeof Item>;
const EmptyCartData = z.object({
  type: z.literal("empty"),
});
type EmptyCartData = z.infer<typeof EmptyCartData>;
const ActiveCartData = z.object({
  type: z.literal("active"),
  unpaidItems: NonEmptyArray(Item),
});
type ActiveCartData = z.infer<typeof ActiveCartData>;
const PaidCartData = z.object({
  type: z.literal("paid"),
  paidItems: NonEmptyArray(Item),
  payment: z.number().positive(),
});
type PaidCartData = z.infer<typeof PaidCartData>;
const ShoppintCart = z.union([EmptyCartData, ActiveCartData, PaidCartData]);
type ShoppintCart = z.infer<typeof ShoppintCart>;

function addItem(cart: ShoppintCart, item: Item): ShoppintCart {
  return match(cart)
    .with({ type: "empty" }, () =>
      ActiveCartData.parse({ type: "active", unpaidItems: [item] })
    )
    .with({ type: "active" }, ({ unpaidItems }) =>
      ActiveCartData.parse({
        type: "active",
        unpaidItems: [...unpaidItems, item],
      })
    )
    .with({ type: "paid" }, () => cart)
    .exhaustive();
}

const emptyCart = EmptyCartData.parse({ type: "empty" });
const activeCart = addItem(emptyCart, Item.parse(undefined));
console.log("activeCart", activeCart);

function makePayment(cart: ShoppintCart, payment: number): ShoppintCart {
  return match(cart)
    .with({ type: "empty" }, () => cart)
    .with({ type: "active" }, ({ unpaidItems: existingItems }) =>
      PaidCartData.parse({
        type: "paid",
        paidItems: existingItems,
        payment,
      })
    )
    .with({ type: "paid" }, () => cart)
    .exhaustive();
}
const paidCart = makePayment(activeCart, 100);
console.log("paidCart", paidCart);

/** OrderPlacingWorkflow */
const ProductCode = Undefined;
type ProductCode = z.infer<typeof ProductCode>;

type CheckProductCodeExists = (productCode: ProductCode) => boolean;

const CheckedAddress = UnvalidatedOrder;
type CheckedAddress = z.infer<typeof CheckedAddress>;
const AddressValidateError = z.string();
type AddressValidateError = z.infer<typeof AddressValidateError>;

type CheckAddressExists = (
  unvalidatedAddress: UnvalidatedAddress
) => TE.TaskEither<AddressValidateError, CheckedAddress>;

const ValidationError = Undefined;

type ValidateOrder = CheckProductCodeExists & CheckAddressExists;

const Price = Undefined;
type Price = z.infer<typeof Price>;

type GetProductPrice = (productCode: ProductCode) => Price;

const EmailAddress = z.string().email();
type EmailAddress = z.infer<typeof EmailAddress>;

const HtmlString = z.string().brand("HtmlString");
type HtmlString = z.infer<typeof HtmlString>;

const OrderAcknowledgment = z.object({
  emailAddress: EmailAddress,
  html: HtmlString,
});
type OrderAcknowledgment = z.infer<typeof OrderAcknowledgment>;

type CreateOrderAcknowledgmentLetter = (pricedOrder: PricedOrder) => HtmlString;

type SendResult = "Sent" | "NotSent";
type SendOrderAcknowledgment = (
  orderAcknowledgment: OrderAcknowledgment
) => SendResult;

const OrderAcknowledgmentSent = z.object({
  orderId: OrderId,
  emailAddress: EmailAddress,
});
type OrderAcknowledgmentSent = z.infer<typeof OrderAcknowledgmentSent>;
