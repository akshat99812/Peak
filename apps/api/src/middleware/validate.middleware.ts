import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ApiError } from "../lib/ApiError";

/**
 * Validates req.body / req.params / req.query against a Zod schema.
 * The schema should be an object with optional keys: body, params, query.
 *
 * @example
 * router.post("/register", validate(registerSchema), authController.register);
 */
export function validate(schema: AnyZodObject) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.errors.map((e) => ({
          field: e.path.slice(1).join("."), // strip leading "body"/"params"/"query"
          message: e.message,
        }));
        next(ApiError.badRequest("Validation failed", errors));
      } else {
        next(err);
      }
    }
  };
}