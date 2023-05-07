import { z } from "zod";
import * as TE from "fp-ts/TaskEither";
import equal from "deep-equal";
import { match, P } from "ts-pattern";

const CustomerId = z.number().int().positive().brand<"CustomerId">();
type CustomerId = z.infer<typeof CustomerId>;

const WidgetCode = z.string().brand<"WidgetCode">();
type WidgetCode = z.infer<typeof WidgetCode>;

const UnitQuantity = z.number().int().positive().brand<"UnitQuantity">();
type UnitQuantity = z.infer<typeof UnitQuantity>;

const KilogramQuantity = z.number().positive().brand<"KilogramQuantity">();
type KilogramQuantity = z.infer<typeof KilogramQuantity>;

const OrderId = z.number().int().positive().brand<"OrderId">();
type OrderId = z.infer<typeof OrderId>;

const customerId = CustomerId.parse(42);
const orderId = OrderId.parse(42);

// customerId === orderId; // Type error

function processCustomerId(customerId: CustomerId) {
  // ...
}
// processCustomerId(orderId); // Type error

console.log(customerId);

function processCustomerId2(customerId: CustomerId): void {
  console.log(`innerValue is ${customerId}`);
}
processCustomerId2(customerId);

// ModelingWithRecords
const Undefined = z.undefined();
const CustomerInfo = Undefined;
const ShippingAddress = Undefined;
const BillingAddress = Undefined;
const OrderLine = Undefined;
const BillingAmount = Undefined;

const Order = z.object({
  customerInfo: CustomerInfo,
  shippingAddress: ShippingAddress,
  billingAddress: BillingAddress,
  orderLines: z.array(OrderLine),
  amountToBill: BillingAmount,
});

// ModelingWithChoice
const ProductCode = z.union([z.literal("Widget"), z.literal("Gizmo")]);
const OrderQuantity = z.union([z.literal("Unit"), z.literal("Kilogram")]);

// ModelingWithFunctions
const UnvalidatedOrder = Undefined;
type UnvalidatedOrder = z.infer<typeof UnvalidatedOrder>;
const ValidatedOrder = Undefined;
type ValidatedOrder = z.infer<typeof ValidatedOrder>;
type ValidateOrder = (unvalidatedOrder: UnvalidatedOrder) => ValidatedOrder;

const AcknowledgmentSent = Undefined;
const OrderPlaced = Undefined;
const BillableOrderPlaced = Undefined;
const PlaceOrderEvents = z.object({
  acknowledgmentSent: AcknowledgmentSent,
  orderPlaced: OrderPlaced,
  billableOrderPlaced: BillableOrderPlaced,
});
type PlaceOrderEvents = z.infer<typeof PlaceOrderEvents>;
type PlaceOrder = (unvalidatedOrder: UnvalidatedOrder) => PlaceOrderEvents;

const OrderForm = Undefined;
type OrderForm = z.infer<typeof OrderForm>;
const QuoteForm = Undefined;
type QuoteForm = z.infer<typeof QuoteForm>;
const EnvelopeContents = z.string().brand<"EnvelopeContents">();
type EnvelopeContents = z.infer<typeof EnvelopeContents>;
const CategorizedMail = z.union([OrderForm, QuoteForm]);
type CategorizedMail = z.infer<typeof CategorizedMail>;
type CategorizeInboundMail = (
  envelopeContents: EnvelopeContents
) => CategorizedMail;

const ProductCatalog = Undefined;
type ProductCatalog = z.infer<typeof ProductCatalog>;
const PricedOrder = Undefined;
type PricedOrder = z.infer<typeof PricedOrder>;
type CalculatePrices1 = (
  orderForm: OrderForm,
  productCatalog: ProductCatalog
) => PricedOrder;

const CalculatePricesInput = z.object({
  orderForm: OrderForm,
  productCatalog: ProductCatalog,
});
type CalculatePricesInput = z.infer<typeof CalculatePricesInput>;
type CalculatePrices2 = (
  calculatePricesInput: CalculatePricesInput
) => PricedOrder;

// DocumentingEffects
type ValidateOrder2 = (
  unvalidatedOrder: UnvalidatedOrder
) => TE.TaskEither<ValidationError, ValidatedOrder>;
const ValidationError = z.object({
  fieldName: z.string(),
  errorDescription: z.string(),
});
type ValidationError = z.infer<typeof ValidationError>;

// DocumentingEffectsV3
type ValidateOrder3 = (
  unvalidatedOrder: UnvalidatedOrder
) => Promise<TE.TaskEither<ValidationError[], ValidatedOrder>>;

// ValueObjects
const widgetCode1 = WidgetCode.parse("W123");
const widgetCode2 = WidgetCode.parse("W123");
console.log(widgetCode1 === widgetCode2); // true

const PersonalName = z.object({
  firstName: z.string(),
  lastName: z.string(),
});
const name1 = PersonalName.parse({
  firstName: "John",
  lastName: "Doe",
});
const name2 = PersonalName.parse({
  firstName: "John",
  lastName: "Doe",
});
console.log(equal(name1, name2)); // true

const UsPostalAddress = z.object({
  streetAddress: z.string(),
  city: z.string(),
  zipCode: z.string(),
});
const address1 = UsPostalAddress.parse({
  streetAddress: "123 Main St",
  city: "New York",
  zipCode: "90001",
});
const address2 = UsPostalAddress.parse({
  streetAddress: "123 Main St",
  city: "New York",
  zipCode: "90001",
});
console.log(equal(address1, address2)); // true

// Entities
const ContactId = z.number().int().positive().brand<"ContactId">();
const PhoneNumber = z.string().brand<"PhoneNumber">();
const EmailAddress = z.string().email().brand<"EmailAddress">();
const Contact = z.object({
  contactId: ContactId,
  phoneNumber: PhoneNumber,
  emailAddress: EmailAddress,
});

// Entities IdOutside
const UnpaidInvoiceInfo = z.object({
  type: z.literal("unpaid"),
  customerId: CustomerId,
});
const PaidInvoiceInfo = z.object({
  type: z.literal("paid"),
  customerId: CustomerId,
  paidDatetime: z.string(),
});
const InvoiceInfo = z.union([UnpaidInvoiceInfo, PaidInvoiceInfo]);
const InvoiceId = z.string().brand<"InvoiceId">();
const Invoice = z.object({
  invoiceId: InvoiceId,
  invoiceInfo: InvoiceInfo,
});

// Entities IdInside
const InvoiceId2 = z.string().brand<"InvoiceId">();
const UnpaidInvoice2 = z.object({
  type: z.literal("unpaid"),
  invoiceId: InvoiceId2,
  customerId: CustomerId,
});
const PaidInvoice2 = z.object({
  type: z.literal("paid"),
  invoiceId: InvoiceId2,
  customerId: CustomerId,
  paidDatetime: z.string(),
});
const Invoice2 = z.union([UnpaidInvoice2, PaidInvoice2]);
type Invoice2 = z.infer<typeof Invoice2>;

const unpaidInvoice = UnpaidInvoice2.parse({
  type: "unpaid",
  invoiceId: "123",
  customerId: 42,
});
const paidInvoice = PaidInvoice2.parse({
  type: "paid",
  invoiceId: "123",
  customerId: 42,
  paidDatetime: "2021-01-01",
});


function printInvoiceId(invoice: Invoice2) {
  match(invoice)
    .with({ type: "unpaid" }, ({ invoiceId }) =>
      console.log(`The unpaid invoiceId is ${invoiceId}`)
    )
    .with({ type: "paid" }, ({ invoiceId }) =>
      console.log(`The paid invoiceId is ${invoiceId}`)
    )
    .exhaustive();
}
printInvoiceId(unpaidInvoice);
printInvoiceId(paidInvoice);
