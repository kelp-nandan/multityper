import {
  Controller,
  Post,
  Req,
  Res,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { ENV } from "../config/env.config";
import { ErrorHandler } from "../common/error-handler";

@Controller("api/token")
export class TokenController {
  constructor(private readonly usersService: UsersService) {}

  @Post("refresh")
  async refreshToken(
    @Req() request: any,
    @Res({ passthrough: true }) response: any,
  ) {
    const refreshToken = request.cookies?.refresh_token;

    if (!refreshToken) {
      throw new HttpException(
        "Refresh token not found",
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const { accessToken } =
        await this.usersService.refreshAccessToken(refreshToken);

      response.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: ENV.isProduction(),
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
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
