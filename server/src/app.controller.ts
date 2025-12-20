import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return "Multi-Typer Game API - Running Successfully";
  }
}
