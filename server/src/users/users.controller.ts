import { Body, Controller, Get, Post, Request, UseGuards, ValidationPipe, Res, Req } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auths/guards/jwt-auth.guard';
import { ENV } from '../config/env.config';

@Controller('api/users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post('register')
    async register(
        @Body(ValidationPipe) createUserDto: CreateUserDto,
        @Res({ passthrough: true }) response: any
    ) {
        const user = await this.usersService.register(createUserDto);
        const { accessToken, refreshToken } = await this.usersService.generateTokensForUser(user.id);

        response.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: ENV.isProduction(),
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000,
        });

        response.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: ENV.isProduction(),
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return {
            success: true,
            message: 'user registered successfully',
            data: { user },
        };
    }

    @Post('login')
    async login(
        @Body(ValidationPipe) loginUserDto: LoginUserDto,
        @Res({ passthrough: true }) response: any
    ) {
        const { user, accessToken, refreshToken } = await this.usersService.login(loginUserDto);

        response.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: ENV.isProduction(),
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000,
        });

        response.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: ENV.isProduction(),
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return {
            success: true,
            message: 'user logged in successfully',
            data: { user },
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll() {
        const users = await this.usersService.findAll();
        return {
            success: true,
            message: 'users retrieved successfully',
            data: users,
        };
    }


    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getProfile(@Request() req) {
        return {
            success: true,
            message: 'profile retrived successfully',
            data: {
                user: req.user
            },
        };
    }

    @Post('refresh')
    async refreshToken(
        @Req() request: any,
        @Res({ passthrough: true }) response: any
    ) {
        const refreshToken = request.cookies?.refresh_token;

        if (!refreshToken) {
            return {
                success: false,
                message: 'Refresh token not found',
            };
        }

        try {
            const { accessToken } = await this.usersService.refreshAccessToken(refreshToken);

            response.cookie('access_token', accessToken, {
                httpOnly: true,
                secure: ENV.isProduction(),
                sameSite: 'lax',
                maxAge: 15 * 60 * 1000,
            });

            return {
                success: true,
                message: 'token refreshed successfully',
            };
        } catch (error) {
            response.clearCookie('access_token');
            response.clearCookie('refresh_token');
            return {
                success: false,
                message: 'Invalid or expired refresh token',
            };
        }
    }

    @Post('logout')
    async logout(
        @Req() request: any,
        @Res({ passthrough: true }) response: any
    ) {
        const refreshToken = request.cookies?.refresh_token;

        if (refreshToken) {
            await this.usersService.revokeRefreshToken(refreshToken);
        }

        response.clearCookie('access_token');
        response.clearCookie('refresh_token');

        return {
            success: true,
            message: 'logged out successfully',
        };
    }
}

