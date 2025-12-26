import { HttpException, HttpStatus } from "@nestjs/common";
import { ErrorKey } from "./constants/error-messages";

export class ErrorHandler {
  private static readonly errorMap = new Map<string, { status: number; message: string }>([
    [
      ErrorKey.INVALID_CREDENTIALS,
      { status: HttpStatus.UNAUTHORIZED, message: "Invalid email or password" },
    ],
    [ErrorKey.EMAIL_EXISTS, { status: HttpStatus.CONFLICT, message: "Email already exists" }],
    [
      ErrorKey.VALIDATION_ERROR,
      {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        message: "Invalid input data",
      },
    ],
    [
      ErrorKey.INVALID_FORMAT,
      {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        message: "Invalid input format",
      },
    ],
    [ErrorKey.TOKEN_EXPIRED, { status: HttpStatus.UNAUTHORIZED, message: "Token expired" }],
    [ErrorKey.INVALID_TOKEN, { status: HttpStatus.UNAUTHORIZED, message: "Invalid token" }],
  ]);

  static handleError(
    error: Error | HttpException | unknown,
    defaultMessage: string = "Operation failed",
  ): never {
    if (error instanceof HttpException) {
      throw error;
    }

    const errorMessage = (error as Error)?.message?.toLowerCase() || "";

    for (const [key, config] of this.errorMap) {
      if (errorMessage.includes(key)) {
        throw new HttpException(config.message, config.status);
      }
    }

    // catch edge cases for duplicate emails
    if (errorMessage.includes("duplicate email") || errorMessage.includes("email already in use")) {
      throw new HttpException("Email already exists", HttpStatus.CONFLICT);
    }

    throw new HttpException(defaultMessage, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
