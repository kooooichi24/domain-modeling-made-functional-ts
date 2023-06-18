import z from "zod";
import { match } from "ts-pattern";

const UnitQuantity = z.number().int().min(1).max(1000).brand<"UnitQuantity">();
const unitQuantity = UnitQuantity.safeParse(1);
match(unitQuantity)
  .with({ success: true }, ({ data }) => {
    console.log(`Success. Value is ${data}`);
  })
  .with({ success: false }, ({ error }) => {
    console.log(`Failure, Message is  ${error}`);
  })
  .exhaustive();

/** UnitsOfMeasure */
const Kilogram = z.object({
  type: z.literal("kg"),
  value: z.number().min(0.05).max(100.0),
});
type Kilogram = z.infer<typeof Kilogram>;
const Meter = z.object({
  type: z.literal("m"),
  value: z.number(),
});
const fiveKilos = Kilogram.parse({ type: "kg", value: 5 });
const fiveMeters = Meter.parse({ type: "m", value: 5 });
// fiveKilos === fiveMeters; // compile error

const KilogramArray = z.array(Kilogram);
type KilogramArray = z.infer<typeof KilogramArray>;
const listOfWeights: KilogramArray = [
  fiveKilos,
  // fiveMeters // compile error
];

// zod parse の場合、コンパイルエラーを検知できない
// const listOfWeights2: KilogramArray = KilogramArray.parse([
//   fiveKilos,
//   fiveMeters,
// ]);
const listOfWeights2: Kilogram[] = [
  fiveKilos,
  // fiveMeters, // compile error
];

/** Invariants */
const NonEmptyArray = <T extends z.ZodTypeAny>(item: T) =>
  z.array(item).refine((data) => data.length > 0, {
    message: "Must be a non-empty array",
  });
const Undefined = z.undefined();

const OrderLine = Undefined;
type OrderLine = z.infer<typeof OrderLine>;

const Order = z.object({
  orderLines: NonEmptyArray(OrderLine),
});
console.log(Order.safeParse({ orderLines: [] }));
console.log(Order.safeParse({ orderLines: [undefined] }));

/** Invariants Pure TypeScript Type */
type NonEmptyList<T> = [T, ...T[]];
const list1: NonEmptyList<number> = [1, 2, 3];
// const list2: NonEmptyList<number> = []; // compile error

/** BusinessRuleImplementation1 */
const EmailAddress = z.string().email().brand<"EmailAddress">();
type EmailAddress = z.infer<typeof EmailAddress>;
const VerifiedEmailAddress = z.string().email().brand<"VerifiedEmailAddress">();
type VerifiedEmailAddress = z.infer<typeof VerifiedEmailAddress>;

type SendPasswordResetEmail = (email: VerifiedEmailAddress) => void;

/** ContactRuleImplementation1 */
const Name = Undefined;
type Name = z.infer<typeof Name>;
const EmailContactInfo = Undefined;
type EmailContactInfo = z.infer<typeof EmailContactInfo>;
const PostalContactInfo = Undefined;
type PostalContactInfo = z.infer<typeof PostalContactInfo>;

const BothContactMethods = z.object({
  email: EmailContactInfo,
  address: PostalContactInfo,
});
type BothContactMethods = z.infer<typeof BothContactMethods>;

const ContactInfo = z.union([
  EmailContactInfo,
  PostalContactInfo,
  BothContactMethods,
]);

const Contact = z.object({
  name: Name,
  contactInfo: ContactInfo,
});

/** IllegalStatesInOurDomain */
const UnvalidatedAddress = Undefined;
type UnvalidatedAddress = z.infer<typeof UnvalidatedAddress>;

const ValidatedAddress = Undefined;
type ValidatedAddress = z.infer<typeof ValidatedAddress>;

type AddressValidationService = (
  address: UnvalidatedAddress
) => ValidatedAddress | undefined;

const UnvalidatedOrder = z.object({
  shippingAddress: UnvalidatedAddress,
});
type UnvalidatedOrder = z.infer<typeof UnvalidatedOrder>;

const ValidatedOrder = z.object({
  shippingAddress: ValidatedAddress,
});
type ValidatedOrder = z.infer<typeof ValidatedOrder>;

/** Consistency */
