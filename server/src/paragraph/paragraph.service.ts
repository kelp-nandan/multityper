import { Injectable } from "@nestjs/common";
import { ParagraphRepository } from "../database/repositories/paragraph.repository";
import { IParagraphResponse } from "../interfaces/paragraph.interface";

@Injectable()
export class ParagraphService {
  constructor(private readonly paragraphRepository: ParagraphRepository) {}

  async getRandomParagraph(): Promise<IParagraphResponse> {
    const randomId = Math.floor(Math.random() * 20) + 1;

    const paragraph = await this.paragraphRepository.findById(randomId);

    if (!paragraph) {
      throw new Error("No paragraph found");
    }

    return {
      id: paragraph.paragraph_id,
      content: paragraph.content,
    };
  }
}
