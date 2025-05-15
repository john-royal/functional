import { DatabaseError } from "pg";

export const isUniqueViolation = (error: unknown) => {
  if (error instanceof DatabaseError && error.code === "23505") {
    return true;
  }
  return false;
};
