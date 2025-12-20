import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private UserRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const { name, email, password } = createUserDto;

    const existingUser = await this.UserRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Client sends pre-hashed password (with fixed salt for consistency)
    // Hash it again on server with proper random salt for security
    const saltRounds = 12;
    const serverHash = await bcrypt.hash(password, saltRounds);

    const user = this.UserRepository.create({
      name,
      email,
      password: serverHash,
    });

    const savedUser = await this.UserRepository.save(user);
    const { password: _, ...result } = savedUser;
    return result;
  }

  async login(
    LoginUserDto: LoginUserDto,
  ): Promise<{ user: Omit<User, 'password'>; accessToken: string; refreshToken: string }> {
    const { email, password } = LoginUserDto;

    const user = await this.UserRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Client sends pre-hashed password, compare with server hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // JWT payload with userId and name for game requirements
    const payload = {
      email: user.email,
      sub: user.id, // Standard JWT claim for user ID
      userId: user.id, // Explicit userId for game requirements
      name: user.name, // User's name for game requirements
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.id);

    const { password: _, ...result } = user;
    return {
      user: result,
      accessToken,
      refreshToken,
    };
  }

  private async generateRefreshToken(userId: number): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    const refreshExpireDays = this.configService.get<number>('jwt.refreshExpiresInDays') || 7;
    expiresAt.setDate(expiresAt.getDate() + refreshExpireDays);

    const refreshToken = this.refreshTokenRepository.create({
      token,
      userId,
      expiresAt,
    });

    await this.refreshTokenRepository.save(refreshToken);
    return token;
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
      relations: ['user'],
    });

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const payload = {
      email: storedToken.user.email,
      sub: storedToken.user.id,
      name: storedToken.user.name,
    };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
    });

    if (storedToken) {
      storedToken.revoked = true;
      await this.refreshTokenRepository.save(storedToken);
    }
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.UserRepository.find();
    return users.map(({ password, ...user }) => user);
  }
}
