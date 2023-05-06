import { z } from "zod";

// WorkingRecord
const person = z.object({
  first: z.string(),
  last: z.string(),
});
type Person = z.infer<typeof person>;
const aPerson: Person = person.parse({
  first: "John",
  last: "Doe",
});
console.log("aPerson:", aPerson);

// WorkingUnion
const unitQuantity = z.number().nonnegative().int();
type UnitQuantity = z.infer<typeof unitQuantity>;
const kilogramQuantity = z.number().nonnegative();
type KilogramQuantity = z.infer<typeof kilogramQuantity>;
const orderQuantity = z.union([unitQuantity, kilogramQuantity]);
type OrderQuantity = z.infer<typeof orderQuantity>;

const anOrderQtyInUnits: UnitQuantity = unitQuantity.parse(10);
console.log("anOrderQtyInUnits:", anOrderQtyInUnits);
const anOrderQtyInKg: KilogramQuantity = kilogramQuantity.parse(2.5);
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
