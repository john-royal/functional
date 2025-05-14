import * as schema from "./src";

export { schema };

export type Select = {
  [K in keyof typeof schema]: (typeof schema)[K] extends {
    $inferSelect: infer S;
  }
    ? S
    : (typeof schema)[K] extends {
          enumValues: (infer E)[];
        }
      ? E
      : never;
};

export type Insert = {
  [K in keyof typeof schema]: (typeof schema)[K] extends {
    $inferInsert: infer I;
  }
    ? I
    : never;
};

export * from "drizzle-orm";
