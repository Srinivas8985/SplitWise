/**
 * Zod Validation Middleware Factory
 * Takes a Zod schema and returns middleware that validates req.body.
 */

const validate = (schema) => {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error); // Caught by errorHandler as ZodError
    }
  };
};

module.exports = { validate };
