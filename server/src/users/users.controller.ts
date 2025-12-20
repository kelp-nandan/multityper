import { Controller, Get, Request, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ErrorHandler } from "../common/error-handler";

@Controller("api/users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    try {
      const users = await this.usersService.findAll();
      return {
        message: "Users retrieved successfully",
        data: users,
      };
    } catch (error) {
      ErrorHandler.handleError(error, "Failed to retrieve users");
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  async getProfile(@Request() req) {
    try {
      return {
        message: "Profile retrieved successfully",
        data: {
          user: req.user,
        },
      };
    } catch (error) {
      ErrorHandler.handleError(error, "Failed to retrieve profile");
    }
  }
}
