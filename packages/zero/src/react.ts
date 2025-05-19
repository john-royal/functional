import { createUseZero } from "@rocicorp/zero/react";
import type { Schema } from "./schema";

export type {
  Expand,
  HumanReadable,
  PrimaryKey,
  QueryResult,
  QueryResultDetails,
  RelationshipsSchema,
  ResultType,
  Schema,
  SchemaValue,
  TableSchema,
  UseQueryOptions,
} from "@rocicorp/zero/react";

export { useQuery, ZeroProvider } from "@rocicorp/zero/react";

export const useZero = createUseZero<Schema>();
