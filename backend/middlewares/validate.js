/**
 * Centralized Zod Request Validation Middleware
 * Validates req.body, req.params, and/or req.query against provided Zod schemas.
 * Strips unknown fields or enforces strict schemas.
 */
const validate = (schemas = {}) => {
  return (req, res, next) => {
    const targets = ["body", "params", "query"];
    for (const target of targets) {
      if (schemas[target]) {
        const result = schemas[target].safeParse(req[target]);
        if (!result.success) {
          const errors = result.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          }));
          return res.status(400).json({
            message: `Validation error in ${target}: ${errors.map(e => e.message).join(", ")}`,
            errors,
          });
        }
        // Assign validated & typed data back to request
        req[target] = result.data;
      }
    }
    next();
  };
};

module.exports = validate;
