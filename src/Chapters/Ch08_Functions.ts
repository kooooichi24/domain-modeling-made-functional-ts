import z from "zod";
import { match } from "ts-pattern";

/** FunctionsAsThings */
const plus3 = (x: number) => x + 3;
const times2 = (x: number) => x * 2;
const square = (x: number) => x * x;
const addThree = plus3;

const listOfFunctions: ((x: number) => number)[] = [addThree, times2, square];

for (let fn of listOfFunctions) {
  const result = fn(100);
  console.log(`If 100 is the input, the output is ${result}`);
}

/** FunctionsAsInput */
const evalWith5ThenAdd2 = (fn: (x: number) => number) => fn(5) + 2;
const add1 = (x: number) => x + 1;
console.log("evalWith5ThenAdd2(add1)", evalWith5ThenAdd2(add1));
console.log("evalWith5ThenAdd2(square)", evalWith5ThenAdd2(square));

/** FunctionsAsOutput */
const add2 = (x: number) => x + 2;
const add3 = (x: number) => x + 3;
const adderGenerator = (numberToAdd: number) => (x: number) => numberToAdd + x;
const add1CreatedByGenerator = adderGenerator(1);
const add100CreatedByGenerator = adderGenerator(100);
console.log("add1CreatedByGenerator(2)", add1CreatedByGenerator(2));
console.log("add100CreatedByGenerator(2)", add100CreatedByGenerator(2));

/** Currying */
const add = (x: number, y: number) => x + y;
const adderGeneratorCurring = (x: number) => (y: number) => x + y;

/** PartialApplication */
const sayGreeting = (greeting: string, name: string) =>
  console.log(`${greeting} ${name}`);
const sayHello = (name: string) => sayGreeting("Hello", name);
const sayGoodbye = (name: string) => sayGreeting("Goodbye", name);
sayHello("Alex");
sayGoodbye("Alex");

/** TotalFunctions */
const NonZeroInteger = z
  .number()
  .int()
  .refine((n) => n !== 0, "Must be non-zero");
type NonZeroInteger = z.infer<typeof NonZeroInteger>;

const twelveDividedBy = (divisor: NonZeroInteger) => {
  switch (divisor) {
    case 1:
      return 12;
    case 2:
      return 6;
    case 3:
      return 4;
    case 4:
      return 3;
    case 6:
      return 2;
    case 12:
      return 1;
  }
};
console.log(
  "twelveDividedBy(NonZeroInteger.parse(3))",
  twelveDividedBy(NonZeroInteger.parse(3))
);
