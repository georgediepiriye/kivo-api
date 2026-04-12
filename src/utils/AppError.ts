class AppError extends Error {
  statusCode: number | string;
  isOperational: boolean;
  constructor(
    statusCode: string | number,
    message: any,
    isOperational = true,
    stack = "",
  ) {
    if (typeof message === "object") {
      // If the message is an object, stringify it for better readability
      super(JSON.stringify(message, null, 2));
    } else {
      super(message);
    }

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default AppError;
