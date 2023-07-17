import z from "zod";
import { flow, pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { match } from "ts-pattern";
import * as E from "fp-ts/lib/Either";

namespace ErrorTypes {
  const Undefined = z.undefined();
  type Undefined = z.infer<typeof Undefined>;

  const ValidationError = Undefined;
  type ValidationError = z.infer<typeof ValidationError>;

  const ProductOutOfStock = Undefined;
  type ProductOutOfStock = z.infer<typeof ProductOutOfStock>;

  const RemoteServiceError = Undefined;
  type RemoteServiceError = z.infer<typeof RemoteServiceError>;

  type PlaceOrderError =
    | ValidationError
    | ProductOutOfStock
    | RemoteServiceError;
}

namespace CommonError {
  const Apple = z.string().brand("Apple");
  type Apple = z.infer<typeof Apple>;
  const Bananas = z.string().brand("Banana");
  type Bananas = z.infer<typeof Bananas>;
  const Cherries = z.string().brand("Cherry");
  type Cherries = z.infer<typeof Cherries>;
  type AppleError = "AppleError";
  type BananaError = "BananaError";

  type FunctionA = (a: Apple) => E.Either<AppleError, Bananas>;
  type FunctionB = (b: Bananas) => E.Either<BananaError, Cherries>;

  type FruitError = "AppleErrorCase" | "BananaErrorCase";

  const functionA: FunctionA = (a) => E.right(Bananas.parse("Banana"));
  const functionB: FunctionB = (b) => E.right(Cherries.parse("Cherry"));

  const functionAWithFruitError = (
    input: Apple
  ): E.Either<FruitError, Bananas> =>
    pipe(
      input,
      functionA,
      E.mapLeft(() => "AppleErrorCase")
    );

  const functionBWithFruitError = (
    input: Bananas
  ): E.Either<FruitError, Cherries> =>
    pipe(
      input,
      functionB,
      E.mapLeft(() => "BananaErrorCase")
    );

  const functionAB = flow(
    functionAWithFruitError,
    E.chain(functionBWithFruitError)
  );
}
