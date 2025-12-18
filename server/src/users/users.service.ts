import { Injectable, ConflictException, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Sequelize } from 'sequelize';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { DatabaseQueries } from '../database/queries';

@Injectable()
export class UsersService {
    private dbQueries: DatabaseQueries;

    constructor(
        @Inject('SEQUELIZE')
        private sequelize: Sequelize,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {
        this.dbQueries = new DatabaseQueries(sequelize);
    }

    async register(createUserDto: CreateUserDto): Promise<Omit<any, 'password'>> {
        const { name, email, password } = createUserDto;

        // Check if email is already taken
        const userExists = await this.dbQueries.checkUserExists(email);
        if (userExists) {
            throw new ConflictException('Email already in use');
        }

        const saltRounds = 12;
        // Password comes pre-hashed from frontend, add server-side bcrypt
        const serverHash = await bcrypt.hash(password, saltRounds);

        // Save new user to database
        const newUser = await this.dbQueries.createUser(name, email, serverHash);
        return newUser;
    }

    async login(LoginUserDto: LoginUserDto): Promise<{ user: Omit<any, 'password'>, accessToken: string, refreshToken: string }> {
        const { email, password } = LoginUserDto;

        // Look up user by email address
        const user = await this.dbQueries.findUserByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Verify password matches stored hash
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = {
            email: user.email,
            sub: user.id,
            userId: user.id,
            name: user.name
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

        // Store refresh token in database
        await this.dbQueries.createRefreshToken(token, userId, expiresAt);
        return token;
    }

    async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
        // Find refresh token with user data using centralized query
        const storedToken = await this.dbQueries.findRefreshTokenWithUser(refreshToken);

        if (!storedToken) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        if (storedToken.revoked || new Date(storedToken.expires_at) < new Date()) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        const payload = {
            email: storedToken.email,
            sub: storedToken.user_id,
            name: storedToken.name
        };
        const accessToken = this.jwtService.sign(payload);

        return { accessToken };
    } async revokeRefreshToken(refreshToken: string): Promise<void> {
        // Revoke refresh token using centralized query
        await this.dbQueries.revokeRefreshToken(refreshToken);
    }

    async findAll(): Promise<Omit<any, 'password'>[]> {
        // Get all users using centralized query
        return await this.dbQueries.getAllUsers();
    }

    async generateTokensForUser(userId: number): Promise<{ accessToken: string, refreshToken: string }> {
        // Find user by ID using centralized query
        const user = await this.dbQueries.findUserById(userId);

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const payload = {
            email: user.email,
            sub: user.id,
            userId: user.id,
            name: user.name
        };

        const accessToken = this.jwtService.sign(payload);
        const refreshToken = await this.generateRefreshToken(user.id);

        return { accessToken, refreshToken };
    }
}