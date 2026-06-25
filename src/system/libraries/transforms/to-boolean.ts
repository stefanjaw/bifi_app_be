import { TransformFnParams } from "class-transformer";

export const toBoolean = ({
  value,
}: TransformFnParams): boolean | null | undefined => {
  if (value === null || value === undefined) return value;
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1" || value === 1) return true;
  if (value === "false" || value === "0" || value === 0) return false;
  return Boolean(value);
};
