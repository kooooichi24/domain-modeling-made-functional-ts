import z from "zod";
import { flow, pipe } from "fp-ts/function";
import * as O from "fp-ts/Option";
import { match } from "ts-pattern";
import * as E from "fp-ts/lib/Either";
import {
  CheckAddressExists,
  CheckedAddress,
  ValidatedOrder,
} from "../OrderTaking/PlaceOrder.Implementation";
import {
  OrderAcknowledgmentSent,
  PlaceOrderError,
  PlaceOrderEvent,
  PricedOrder,
  PricingError,
  RemoteServiceError,
  ServiceInfo,
  UnvalidatedAddress,
  UnvalidatedOrder,
  ValidationError,
} from "../OrderTaking/PlaceOrder.PublicTypes";

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

namespace Pipeline {
  type ValidateOrder = (
    unvalidatedOrder: UnvalidatedOrder
  ) => E.Either<ValidationError, ValidatedOrder>;

  type PriceOrder = (
    validatedOrder: ValidatedOrder
  ) => E.Either<PricingError, PricedOrder>;

  type AcknowledgeOrder = (
    pricedOrder: PricedOrder
  ) => O.Option<OrderAcknowledgmentSent>;

  type CreateEvents = (
    pricedOrder: PricedOrder,
    orderAcknowledgmentSent: O.Option<OrderAcknowledgmentSent>
  ) => PlaceOrderEvent[];

  const PlaceOrderError = z.union([ValidationError, PricingError]);
  type PlaceOrderError = z.infer<typeof PlaceOrderError>;

  const validateOrder: ValidateOrder = (unvalidatedOrder) => {
    throw new Error("Not implemented");
  };
  const priceOrder: PriceOrder = (validatedOrder) => {
    throw new Error("Not implemented");
  };
  const acknowledgeOrder: AcknowledgeOrder = (pricedOrder) => {
    throw new Error("Not implemented");
  };
  const createEvents: CreateEvents = (pricedOrder, orderAcknowledgmentSent) => {
    throw new Error("Not implemented");
  };

  const validateOrderAdapted = (unvalidatedOrder: UnvalidatedOrder) =>
    pipe(
      unvalidatedOrder,
      validateOrder,
      E.mapLeft((e) => PlaceOrderError.parse(e))
    );

  const priceOrderAdapted = (validatedOrder: ValidatedOrder) =>
    pipe(
      validatedOrder,
      priceOrder,
      E.mapLeft((e) => PlaceOrderError.parse(e))
    );

  const placeOrder2 = (unvalidatedOrder: UnvalidatedOrder) =>
    pipe(unvalidatedOrder, validateOrderAdapted, E.chain(priceOrderAdapted));

  const placeOrder3: (
    unvalidatedOrder: UnvalidatedOrder
  ) => E.Either<PlaceOrderError, PlaceOrderEvent[]> = (
    unvalidatedOrder: UnvalidatedOrder
  ) =>
    pipe(
      unvalidatedOrder,
      validateOrderAdapted,
      E.chain(priceOrderAdapted),
      E.map((pricedOrder) =>
        createEvents(pricedOrder, acknowledgeOrder(pricedOrder))
      )
    );
}

namespace Exceptions {
  const serviceExceptionAdapter = <Req, Res>(
    serviceInfo: ServiceInfo,
    serviceFn: (x: Req) => Res,
    x: Req
  ): E.Either<RemoteServiceError, Res> => {
    try {
      return E.right(serviceFn(x));
    } catch (e: unknown) {
      // timeout exception
      if (e instanceof Error) {
        return E.left({ service: serviceInfo, exception: e });
      }

      // authorization exception
      if (e instanceof Error) {
        return E.left({ service: serviceInfo, exception: e });
      }

      // unknown exception
      return E.left({
        service: serviceInfo,
        exception: new Error("unknow excecption"),
      });
    }
  };

  const serviceInfo = {
    name: "AddressCheckingService",
    endpoint: "http://localhost:8080/api/address",
  };

  const checkAddressExists: CheckAddressExists = (address) => {
    throw new Error("Not implemented");
  };

  const checkAddressExistsR = (address: UnvalidatedAddress) => {
    const adaptedService = (x: UnvalidatedAddress) =>
      serviceExceptionAdapter(serviceInfo, checkAddressExists, x);

    return pipe(address, adaptedService);
  };

  const checkAddressExistsR2: (
    address: UnvalidatedAddress
  ) => E.Either<PlaceOrderError, CheckedAddress> = (
    address: UnvalidatedAddress
  ) => {
    const adaptedService = (x: UnvalidatedAddress) =>
      serviceExceptionAdapter(serviceInfo, checkAddressExists, x);

    return pipe(address, adaptedService);
  };
}

namespace DeadEnd {
  const logError = (msg: string) => console.log(`ERROR ${msg}`);

  const tee =
    <A>(f: (x: A) => void) =>
    (x: A) => {
      f(x);
      return x;
    };

  // ('a -> unit) -> (Result<'a,'error> -> Result<'a,'error>)
  const adaptDeadEnd = <A, E>(f: (x: A) => void) =>
    E.map(flow(tee(f), (x) => x));

  const logErrorR = adaptDeadEnd(logError);
  logErrorR(E.right("hoge"));
}
