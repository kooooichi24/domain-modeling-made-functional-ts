import { z } from "zod";
import { Option } from "fp-ts/Option";

// Option1
type A = "a";
type OptionA = Option<A>;

// Option2
const PersonalName = z.object({
  firstName: z.string(),
  middleInitial: z.string().optional(),
  lastName: z.string(),
});
type PersonalName = z.infer<typeof PersonalName>;
console.log(PersonalName.parse({ firstName: "John", lastName: "Doe" }));
console.log(
  PersonalName.parse({
    firstName: "John",
    middleInitial: "hoge",
    lastName: "Doe",
  })
);
