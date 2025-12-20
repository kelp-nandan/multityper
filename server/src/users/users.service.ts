import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Inject,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Sequelize } from "sequelize";
import * as bcrypt from "bcrypt";
import { CreateUserDto } from "./dto/create-user.dto";
import { LoginUserDto } from "./dto/login-user.dto";
import { UserRepository } from "../database/repositories";
import { IUserProfile } from "./interfaces";

@Injectable()
export class UsersService {
  private userRepository: UserRepository;

  constructor(
    @Inject("SEQUELIZE")
    private sequelize: Sequelize,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.userRepository = new UserRepository(sequelize);
  }

  async register(createUserDto: CreateUserDto): Promise<IUserProfile> {
    const { name, email, password } = createUserDto;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error("email already exists");
    }

    const saltRounds = 12;
    // Add additional server-side bcrypt hashing
    const serverHash = await bcrypt.hash(password, saltRounds);

    // Create new user
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

    const { password: _, ...userProfile } = user;
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

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string }> {
    try {
      // Verify the refresh token JWT
      const decoded = this.jwtService.verify(refreshToken);

      if (decoded.type !== "refresh") {
        throw new UnauthorizedException("Invalid refresh token");
      }

      // Get fresh user data to ensure user still exists
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
