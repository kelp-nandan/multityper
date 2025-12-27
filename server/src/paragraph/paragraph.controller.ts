import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { IParagraphResponse } from "../interfaces/paragraph.interface";
import { ParagraphService } from "./paragraph.service";

@Controller("paragraphs")
@UseGuards(JwtAuthGuard)
export class ParagraphController {
  constructor(private readonly paragraphService: ParagraphService) {}

  @Get("random")
  async getRandomParagraph(): Promise<IParagraphResponse> {
    return this.paragraphService.getRandomParagraph();
  }
}
