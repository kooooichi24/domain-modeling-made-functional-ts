import { z } from "zod";

// FruitVariety
const AppleVariety = z
  .union([
    z.literal("GoldenDelicious"),
    z.literal("GrannySmith"),
    z.literal("Fuji"),
  ])
  .brand<"AppleVariety">();
type AppleVariety = z.infer<typeof AppleVariety>;
const grannySmith: AppleVariety = AppleVariety.parse("GrannySmith");
console.log("grannySmith:", grannySmith);

const BananaVariety = z
  .union([
    z.literal("Cavendish"),
    z.literal("GrosMichel"),
    z.literal("Manzano"),
  ])
  .brand<"BananaVariety">();
type BananaVariety = z.infer<typeof BananaVariety>;
const grosMichel: BananaVariety = BananaVariety.parse("GrosMichel");
console.log("grosMichel:", grosMichel);

const CherryVariety = z
  .union([z.literal("Montmorency"), z.literal("Bing")])
  .brand<"CherryVariety">();
type CherryVariety = z.infer<typeof CherryVariety>;
const montmorency: CherryVariety = CherryVariety.parse("Montmorency");
console.log("montmorency:", montmorency);

// FruitSalad
const FruitSalad = z
  .object({
    apple: AppleVariety,
    banana: BananaVariety,
    cherry: CherryVariety,
  })
  .brand<"FruitSalad">();
type FruitSalad = z.infer<typeof FruitSalad>;
const aFruitSalad: FruitSalad = FruitSalad.parse({
  apple: "Fuji",
  banana: "Cavendish",
  cherry: "Montmorency",
});
console.log("aFruitSalad:", aFruitSalad);

// FruitSnack
const FruitSnack = z
  .union([AppleVariety, BananaVariety, CherryVariety])
  .brand<"FruitSnack">();
type FruitSnack = z.infer<typeof FruitSnack>;
const aFruitSnack: FruitSnack = FruitSnack.parse(AppleVariety.parse("Fuji"));
console.log("aFruitSnack:", aFruitSnack);

// SCU
const ProductCode = z.string().brand<"ProductCode">();
type ProductCode = z.infer<typeof ProductCode>;
console.log("productCode:", ProductCode.parse("1234567890"));
