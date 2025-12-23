import { Module } from '@nestjs/common';
import { ParagraphController } from './paragraph.controller';
import { ParagraphService } from './paragraph.service';
import { DatabaseModule } from '../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [ParagraphController],
    providers: [ParagraphService],
    exports: [ParagraphService],
})
export class ParagraphModule { }
