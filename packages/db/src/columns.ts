import { char, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const cuid = () => {
  const column = char({ length: 24 });
  const primaryKey = () => {
    return char({ length: 24 }).primaryKey().$defaultFn(createId);
  };
  return Object.assign(column, { primaryKey }) as Omit<
    typeof column,
    "primaryKey"
  > & {
    primaryKey: typeof primaryKey;
  };
};

export const timestamps = () => ({
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});
