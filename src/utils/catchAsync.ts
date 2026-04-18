import { Request, Response, NextFunction, RequestHandler } from "express";

// Using RequestHandler provides better intellisense for req, res, and next
const catchAsync = (fn: RequestHandler): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default catchAsync;
