import { Controller, Get, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ErrorHandler } from "../common/error-handler";
import { UsersService } from "./users.service";
import { IUserProfile } from "./interfaces";

@Controller("api/users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(): Promise<{ message: string; data: IUserProfile[] }> {
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
  async getProfile(
    @Request() req: { user: { id: number; email: string; name: string } },
  ): Promise<{ message: string; data: { user: { id: number; email: string; name: string } } }> {
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
