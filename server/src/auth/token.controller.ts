import { Controller, HttpException, HttpStatus, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { ErrorHandler } from "../common/error-handler";
import { ENV } from "../config/env.config";
import { ACCESS_TOKEN_MAX_AGE } from "../constants";
import { UsersService } from "../users/users.service";

@Controller("api/token")
export class TokenController {
  constructor(private readonly usersService: UsersService) {}

  @Post("refresh")
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    const refreshToken = request.cookies?.refresh_token as string | undefined;

    if (!refreshToken) {
      throw new HttpException("Refresh token not found", HttpStatus.UNAUTHORIZED);
    }

    try {
      const { accessToken } = await this.usersService.refreshAccessToken(refreshToken);

      response.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: ENV.isProduction(),
        sameSite: "lax",
        maxAge: ACCESS_TOKEN_MAX_AGE,
      });

      return {
        message: "Token refreshed successfully",
      };
    } catch (error) {
      response.clearCookie("access_token");
      response.clearCookie("refresh_token");
      ErrorHandler.handleError(error, "Token refresh failed");
    }
  }
}
