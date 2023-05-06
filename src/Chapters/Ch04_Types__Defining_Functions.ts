import { flow } from "fp-ts/function";
import * as N from "fp-ts/number";

function add1(x: number): number {
  return x + 1;
}
console.log("add1(1):", add1(1)); // 2

function xy(x: number, y: number): number {
  return x + y;
}

console.log("xy(1, 2):", xy(1, 2)); // 3

function square(x: number): number {
  return x * x;
}
console.log("square(2):", square(2)); // 4

const squarePlusOne = flow(square, add1);
console.log("squarePlusOne(2): ", squarePlusOne(2)); // 5 (2 * 2 + 1)

function areEqual<T>(x: T, y: T): boolean {
  return x === y;
}
console.log("areEqual(1, 1): ", areEqual(1, 1)); // true
console.log("N.Eq.equals(1, 1): ", N.Eq.equals(1, 1)); // true
