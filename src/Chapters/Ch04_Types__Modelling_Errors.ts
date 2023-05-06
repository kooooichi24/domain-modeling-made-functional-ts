type Success<T = void> = T extends void ? { ok: true } : { ok: true; value: T };
type Failure<E = void> = E extends void
  ? { ok: false }
  : { ok: false; error: E };
type Result<T, E> = Success<T> | Failure<E>;

type PaymentError =
  | "CardTypeNotRecognized"
  | "PaymentRejected"
  | "PaymentProviderOffline";

type UnpaidInvoice = undefined;
type Payment = undefined;
type PaidInvoice = undefined;

type PayInvoice = (
  unpaidInvoice: UnpaidInvoice,
  payment: Payment
) => Result<PaidInvoice, PaymentError>;
