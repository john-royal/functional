import * as schema from "./src";

export { schema };

type Schema = typeof schema;

type Model = {
  [T in keyof Schema]: Schema[T] extends {
    $inferSelect: infer S;
    $inferInsert: infer I;
  }
    ? {
        select: S;
        insert: I;
      }
    : never;
};

export type SelectModel<T extends keyof Model> = Model[T]["select"];
export type InsertModel<T extends keyof Model> = Model[T]["insert"];

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
