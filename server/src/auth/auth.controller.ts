import { Body, Controller, Post, Req, Res, ValidationPipe } from "@nestjs/common";
import type { Request, Response } from "express";
import { ErrorHandler } from "../common/error-handler";
import { ENV } from "../config/env.config";
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from "../constants";
import { IAuthSuccessResponse } from "../interfaces/response.interface";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { LoginUserDto } from "../users/dto/login-user.dto";
import { UsersService } from "../users/users.service";

@Controller("api/auth")
export class AuthController {
  constructor(private readonly usersService: UsersService) { }

  @Post("register")
  async register(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<IAuthSuccessResponse> {
    try {
      const user = await this.usersService.register(createUserDto);
      const { accessToken, refreshToken } = await this.usersService.generateTokensForUser(user.id);

      response.cookie("access_token", accessToken, {
        httpOnly: true,
        // secure: ENV.isProduction(),
        secure:true,
        // sameSite: "lax",
        sameSite: "none",
        maxAge: ACCESS_TOKEN_MAX_AGE,
      });

      response.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        // secure: ENV.isProduction(),
        secure:true,

        // sameSite: "lax",
        sameSite: "none",
        maxAge: REFRESH_TOKEN_MAX_AGE,
      });

      return {
        message: "User registered successfully",
        data: { user },
      };
    } catch (_error) {
      ErrorHandler.handleError(_error, "Registration failed");
    }
  }

  @Post("login")
  async login(
    @Body(ValidationPipe) loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<IAuthSuccessResponse> {
    try {
      const { user, accessToken, refreshToken } = await this.usersService.login(loginUserDto);

      response.cookie("access_token", accessToken, {
        httpOnly: true,
        // secure: ENV.isProduction(),
        secure:true,
        // sameSite: "lax",
        sameSite: "none",
        maxAge: ACCESS_TOKEN_MAX_AGE,
      });

      response.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: true,
        // sameSite: "lax",
        sameSite: "none",
        maxAge: REFRESH_TOKEN_MAX_AGE,
      });

      return {
        message: "Login successful",
        data: { user },
      };
    } catch (_error) {
      ErrorHandler.handleError(_error, "Login failed");
    }
  }

  @Post("logout")
  logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): { message: string } {
    response.clearCookie("access_token");
    response.clearCookie("refresh_token");

    return { message: "Logged out successfully" };
  }
}
