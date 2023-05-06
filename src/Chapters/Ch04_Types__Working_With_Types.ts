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
const UnitQuantity = z.number().nonnegative().int().brand<"UnitQuantity">();
type UnitQuantity = z.infer<typeof UnitQuantity>;

const KilogramQuantity = z.number().nonnegative().brand<"KilogramQuantity">();
type KilogramQuantity = z.infer<typeof KilogramQuantity>;

const OrderQuantity = z.union([UnitQuantity, KilogramQuantity]);
type OrderQuantity = z.infer<typeof OrderQuantity>;

const anOrderQtyInUnits: UnitQuantity = UnitQuantity.parse(10);
console.log("anOrderQtyInUnits:", anOrderQtyInUnits);

const anOrderQtyInKg: KilogramQuantity = KilogramQuantity.parse(2.5);
console.log("anOrderQtyInKilograms:", anOrderQtyInKg);

function printQuantity(aOrderQty: OrderQuantity) {
  if (Number.isInteger(aOrderQty)) {
    console.log(`${aOrderQty} units`);
  } else {
    console.log(`${aOrderQty} kg`);
  }
}
printQuantity(anOrderQtyInUnits);
printQuantity(anOrderQtyInKg);
