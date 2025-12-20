import {
  Body,
  Controller,
  Post,
  ValidationPipe,
  Res,
  Req,
} from "@nestjs/common";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { LoginUserDto } from "../users/dto/login-user.dto";
import { UsersService } from "../users/users.service";
import { ENV } from "../config/env.config";
import { ErrorHandler } from "../common/error-handler";

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

@Controller("api/auth")
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Post("register")
  async register(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
    @Res({ passthrough: true }) response: any,
  ) {
    try {
      const user = await this.usersService.register(createUserDto);
      const { accessToken, refreshToken } =
        await this.usersService.generateTokensForUser(user.id);

      response.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: ENV.isProduction(),
        sameSite: "lax",
        maxAge: ACCESS_TOKEN_MAX_AGE,
      });

      response.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: ENV.isProduction(),
        sameSite: "lax",
        maxAge: REFRESH_TOKEN_MAX_AGE,
      });

      return {
        message: "User registered successfully",
        data: { user },
      };
    } catch (error) {
      ErrorHandler.handleError(error, "Registration failed");
    }
  }

  @Post("login")
  async login(
    @Body(ValidationPipe) loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) response: any,
  ) {
    try {
      const { user, accessToken, refreshToken } =
        await this.usersService.login(loginUserDto);

      response.cookie("access_token", accessToken, {
        httpOnly: true,
        secure: ENV.isProduction(),
        sameSite: "lax",
        maxAge: ACCESS_TOKEN_MAX_AGE,
      });

      response.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: ENV.isProduction(),
        sameSite: "lax",
        maxAge: REFRESH_TOKEN_MAX_AGE,
      });

      return {
        message: "Login successful",
        data: { user },
      };
    } catch (error) {
      ErrorHandler.handleError(error, "Login failed");
    }
  }

  @Post("logout")
  async logout(@Req() request: any, @Res({ passthrough: true }) response: any) {
    try {
      const refreshToken = request.cookies?.refresh_token;

      if (refreshToken) {
        await this.usersService.revokeRefreshToken(refreshToken);
      }

      response.clearCookie("access_token");
      response.clearCookie("refresh_token");

      return { message: "Logged out successfully" };
    } catch (error) {
      response.clearCookie("access_token");
      response.clearCookie("refresh_token");

      return { message: "Logged out successfully" };
    }
  }
}
