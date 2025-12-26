import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ParagraphService } from "./paragraph.service";
import { IParagraphResponse } from "../interfaces/paragraph.interface";

@Controller("paragraphs")
@UseGuards(JwtAuthGuard)
export class ParagraphController {
  constructor(private readonly paragraphService: ParagraphService) {}

  @Get("random")
  async getRandomParagraph(): Promise<IParagraphResponse> {
    return this.paragraphService.getRandomParagraph();
  }
}
