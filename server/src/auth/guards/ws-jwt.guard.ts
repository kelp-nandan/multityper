import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Socket } from "socket.io";
import { UserRepository } from "src/database/repositories";

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();

    const cookieHeader = client.handshake.headers.cookie;
    if (!cookieHeader) {
      throw new UnauthorizedException("No authentication cookie found");
    }

    const match = cookieHeader.match(/access_token=([^;]+)/);
    if (!match) {
      throw new UnauthorizedException("JWT not found in cookies");
    }

    const token = match[1];
    if(!token) {
      throw new UnauthorizedException('Authentication token not provided');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      if(!payload?.sub) {
        throw new UnauthorizedException("Invalid token payload");
      }
      const user = await this.userRepository.findById(payload.sub);
      if(!user) {
        throw new UnauthorizedException('User not found');
      }

      client.data.user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
      };

      return true;
    } catch (err) {
      throw new UnauthorizedException(err);
    }
  }
}
