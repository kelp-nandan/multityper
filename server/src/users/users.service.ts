import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { UserRepository } from "../database/repositories";
import { CreateUserDto } from "./dto/create-user.dto";
import { LoginUserDto } from "./dto/login-user.dto";
import { IUserProfile } from "./interfaces";

@Injectable()
export class UsersService {
  constructor(
    private jwtService: JwtService,
    private userRepository: UserRepository,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<IUserProfile> {
    const { name, email, password } = createUserDto;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error("email already exists");
    }

    const saltRounds = 12;
    // hash password on server too
    const serverHash = await bcrypt.hash(password, saltRounds);

    // save new user
    const newUser = await this.userRepository.create({
      name,
      email,
      password: serverHash,
    });
    return newUser;
  }

  async login(LoginUserDto: LoginUserDto): Promise<{
    user: IUserProfile;
    accessToken: string;
    refreshToken: string;
  }> {
    const { email, password } = LoginUserDto;

    // Find user for authentication
    const user = await this.userRepository.findByEmailForAuth(email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Verify password matches stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload = {
      email: user.email,
      sub: user.id,
      userId: user.id,
      name: user.name,
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: "15m" });
    const refreshToken = this.generateRefreshToken(user.id);

    // Return clean user object without password
    const userProfile: IUserProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at,
      created_by: user.created_by,
      updated_by: user.updated_by,
    };

    return {
      user: userProfile,
      accessToken,
      refreshToken,
    };
  }

  private generateRefreshToken(userId: number): string {
    // Generate stateless refresh token with longer expiry
    const refreshPayload = {
      sub: userId,
      userId: userId,
      type: "refresh",
    };
    return this.jwtService.sign(refreshPayload, { expiresIn: "7d" });
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verify the refresh token JWT
      const decoded = this.jwtService.verify(refreshToken);

      if (decoded.type !== "refresh") {
        throw new UnauthorizedException("Invalid refresh token");
      }

      // make sure user still exists
      const user = await this.userRepository.findById(decoded.userId);
      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      // Generate new access token with fresh user data
      const payload = {
        email: user.email,
        sub: user.id,
        userId: user.id,
        name: user.name,
      };
      const accessToken = this.jwtService.sign(payload, { expiresIn: "15m" });

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    // Stateless tokens expire naturally
    return;
  }

  async findAll(): Promise<IUserProfile[]> {
    return await this.userRepository.findAll();
  }

  async generateTokensForUser(
    userId: number,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const payload = {
      email: user.email,
      sub: user.id,
      userId: user.id,
      name: user.name,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: "15m" });
    const refreshToken = this.generateRefreshToken(user.id);

    return { accessToken, refreshToken };
  }
}
