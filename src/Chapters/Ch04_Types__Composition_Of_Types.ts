import { z } from "zod";

// FruitVariety
const appleVariety = z.union([
  z.literal("GoldenDelicious"),
  z.literal("GrannySmith"),
  z.literal("Fuji"),
]);
type AppleVariety = z.infer<typeof appleVariety>;
const grannySmith: AppleVariety = appleVariety.parse("GrannySmith");
console.log("grannySmith:", grannySmith);

const bananaVariety = z.union([
  z.literal("Cavendish"),
  z.literal("GrosMichel"),
  z.literal("Manzano"),
]);
type BananaVariety = z.infer<typeof bananaVariety>;
const grosMichel: BananaVariety = bananaVariety.parse("GrosMichel");
console.log("grosMichel:", grosMichel);

const cherryVariety = z.union([z.literal("Montmorency"), z.literal("Bing")]);
type CherryVariety = z.infer<typeof cherryVariety>;
const montmorency: CherryVariety = cherryVariety.parse("Montmorency");
console.log("montmorency:", montmorency);

// FruitSalad
const fruitSalad = z.object({
  apple: appleVariety,
  banana: bananaVariety,
  cherry: cherryVariety,
});
type FruitSalad = z.infer<typeof fruitSalad>;
const aFruitSalad: FruitSalad = fruitSalad.parse({
  apple: "Fuji",
  banana: "Cavendish",
  cherry: "Montmorency",
});
console.log("aFruitSalad:", aFruitSalad);

// FruitSnack
const fruitSnack = z.union([appleVariety, bananaVariety, cherryVariety]);
type FruitSnack = z.infer<typeof fruitSnack>;
const aFruitSnack: FruitSnack = fruitSnack.parse(appleVariety.parse("Fuji"));
console.log("aFruitSnack:", aFruitSnack);

// SCU
const productCode = z.string();
type ProductCode = z.infer<typeof productCode>;
console.log("productCode:", productCode.parse("1234567890"));
