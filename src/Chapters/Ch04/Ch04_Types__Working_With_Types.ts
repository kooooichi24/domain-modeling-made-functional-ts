import { match } from "ts-pattern";
import { z } from "zod";

// WorkingRecord
const Person = z
  .object({
    first: z.string(),
    last: z.string(),
  })
  .brand<"Person">();
type Person = z.infer<typeof Person>;
const aPerson: Person = Person.parse({
  first: "John",
  last: "Doe",
});
console.log("aPerson:", aPerson);

// WorkingUnion
const UnitQuantity = z.object({
  type: z.literal("unit"),
  value: z.number().int().positive(),
});
type UnitQuantity = z.infer<typeof UnitQuantity>;

const KilogramQuantity = z.object({
  type: z.literal("kilogram"),
  value: z.number().positive(),
});
type KilogramQuantity = z.infer<typeof KilogramQuantity>;

const OrderQuantity = z.discriminatedUnion("type", [
  UnitQuantity,
  KilogramQuantity,
]);
type OrderQuantity = z.infer<typeof OrderQuantity>;

const anOrderQtyInUnits: UnitQuantity = UnitQuantity.parse({
  type: "unit",
  value: 10,
});
console.log("anOrderQtyInUnits:", anOrderQtyInUnits);

const anOrderQtyInKg: KilogramQuantity = KilogramQuantity.parse({
  type: "kilogram",
  value: 2.5,
});
console.log("anOrderQtyInKilograms:", anOrderQtyInKg);

function printQuantity(aOrderQty: OrderQuantity) {
  match(aOrderQty)
    .with({ type: "unit" }, ({ value }) => console.log(`${value} units`))
    .with({ type: "kilogram" }, ({ value }) => console.log(`${value} kg`))
    .exhaustive();
}
printQuantity(anOrderQtyInUnits);
printQuantity(anOrderQtyInKg);
