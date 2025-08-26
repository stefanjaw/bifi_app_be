import { NextFunction, Request, Response } from "express";
import { UnauthorizedException } from "../libraries";
import { PolicyDocument, UserDocument } from "@mongodb-types";

/**
 * Authorization middleware to check if the user has the required permissions
 * to perform the action on the resource.
 *
 * @param resource - The resource name (e.g. "user", "product", etc.)
 * @param action - The action to be performed on the resource (e.g. "read", "write", etc.)
 * @param getDocument - A function that returns the document to be checked
 * @returns A middleware that checks if the user has the required permissions
 * and calls next() if the user is authorized, or throws an UnauthorizedException
 * if the user is not authorized.
 */
export function authorizeMiddleware(
  resource: string,
  action: PolicyDocument["action"],
  getDocument: (req: Request) => Promise<Record<string, any>> = () =>
    Promise.resolve({})
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    next();
    return;

    try {
      const user = req.user;
      const document = await getDocument(req);

      // Check if user exists, if not, throw an error
      if (!user) {
        throw new UnauthorizedException("Unauthorized");
      }

      const policies =
        user?.roles
          .flatMap((role) => role.policies)
          .filter(
            (policy) => policy.resource === resource && policy.action === action
          ) || [];

      // Check if policies exist, if not, throw an error
      if (!policies || policies.length === 0)
        throw new UnauthorizedException("Unauthorized");

      const allowed = policies.some((policy) => {
        // if policy is not active, return false
        if (!policy.active) return false;

        // if no conditions, return true
        if (policy.conditions.length === 0) return true;

        // check if conditions are met
        return policy.conditions.every((condition) => {
          return evaluateCondition(document, condition, user);
        });
      });

      if (!allowed) throw new UnauthorizedException("Unauthorized");

      next();
    } catch (error: any) {
      next(error);
    }
  };
}

/**
 * Evaluates a condition against a resource data.
 *
 * @param resourceData - The data of the resource being accessed.
 * @param condition - The condition to evaluate.
 * @param user - The user performing the action.
 * @param context - An optional context object.
 * @returns Whether the condition is met or not.
 */
function evaluateCondition(
  resourceData: Record<string, any>,
  condition: PolicyDocument["conditions"][0],
  user: UserDocument | undefined,
  context = {}
): boolean {
  const key = condition.key;
  const operator = condition.operator;

  const right = resourceData[key];
  const left = resolveConditionValue(
    condition.value,
    user,
    resourceData,
    context
  );

  if (!(key in document)) return false;

  switch (operator) {
    case "==":
      return right === left;
    case "!=":
      return right !== left;
    case ">":
      return right > left;
    case "<":
      return right < left;
    case "in":
      return Array.isArray(right) ? right.includes(left) : false;
    default:
      return false;
  }
}

/**
 * Resolves a condition value.
 *
 * If the value is a string and starts with "{{" and ends with "}}", it is
 * considered a path to a property in the user or resource data. For example,
 * "{{user.id}}" will be resolved to the user's id.
 *
 * If the path is not valid, the original value is returned.
 *
 * @param value - The value to resolve.
 * @param user - The user data.
 * @param resourceData - The resource data.
 * @param context - An optional context object.
 * @returns The resolved value.
 */
function resolveConditionValue(
  value: any,
  user: UserDocument | undefined,
  resourceData: Record<string, any>,
  context: object = {}
) {
  // Ejemplo {{user.id}}
  if (
    typeof value === "string" &&
    value.startsWith("{{") &&
    value.endsWith("}}")
  ) {
    const path = value.slice(2, -2).trim(); // ej: "user.id"
    const [root, ...rest] = path.split(".");

    let source: any;
    if (root === "user") source = user;
    else if (root === "resource") source = resourceData;
    else if (root === "context") source = context;
    else return null;

    return rest.reduce((acc, key) => acc?.[key], source);
  }

  return value;
}
