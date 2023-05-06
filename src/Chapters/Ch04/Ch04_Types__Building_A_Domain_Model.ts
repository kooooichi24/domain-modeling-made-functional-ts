import { z } from "zod";

// 1. Start with some wrappers for primitive types
const CheckNumber = z.number().int().nonnegative().brand<"CheckNumber">();
type CheckNumber = z.infer<typeof CheckNumber>;

const CardNumber = z.string().brand<"CardNumber">();
type CardNumber = z.infer<typeof CardNumber>;

// 2. Next, build up some low level types
const CardType = z.union([z.literal("Visa"), z.literal("MasterCard")]);
type CardType = z.infer<typeof CardType>;

const CreditCardInfo = z.object({
  cardType: CardType,
  cardNumber: CardNumber,
});
type CreditCardInfo = z.infer<typeof CreditCardInfo>;

// 3. Now build up a slightly higher level 'OR' type
const Cash = z.literal("Cash").brand<"Cash">();
type Cash = z.infer<typeof Cash>;

const PaymentMethod = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("Cash"),
    value: Cash,
  }),
  z.object({
    method: z.literal("Check"),
    value: CheckNumber,
  }),
  z.object({
    method: z.literal("Card"),
    value: CreditCardInfo,
  }),
]);
type PaymentMethod = z.infer<typeof PaymentMethod>;

// 4. Define a few more basic types
const PaymentAmount = z.number().nonnegative().brand<"PaymentAmount">();
type PaymentAmount = z.infer<typeof PaymentAmount>;

const Currency = z.union([z.literal("USD"), z.literal("EUR")]);
type Currency = z.infer<typeof Currency>;

// 5. The final record type is built from the smaller types
const Payment = z.object({
  amount: PaymentAmount,
  currency: Currency,
  method: PaymentMethod,
});
type Payment = z.infer<typeof Payment>;

// 6. Pay for an unpaid invoice
type UnpaidInvoice = undefined;
type PaidInvoice = undefined;
type PayInvoice = (
  unpaidInvoice: UnpaidInvoice,
  payment: Payment
) => PaidInvoice;

// 7. Or to convert a payment from one currency to another
type ConvertPaymentCurrency = (payment: Payment, currency: Currency) => Payment;
