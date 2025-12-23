import { Injectable } from '@nestjs/common';
import { ParagraphRepository } from '../database/repositories/paragraph.repository';

@Injectable()
export class ParagraphService {
    constructor(private readonly paragraphRepository: ParagraphRepository) { }

    async getRandomParagraph() {
        const randomId = Math.floor(Math.random() * 20) + 1;

        const paragraph = await this.paragraphRepository.findById(randomId);

        if (!paragraph) {
            throw new Error('No paragraph found');
        }

        return {
            id: paragraph.id,
            content: paragraph.content,
        };
    }
}