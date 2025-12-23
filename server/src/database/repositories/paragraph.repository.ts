import { Sequelize } from 'sequelize';
import { Paragraph } from '../../models/paragraph.model';

export class ParagraphRepository {
    constructor(private sequelize: Sequelize) {
        Paragraph.initModel(this.sequelize);
    }

    async create(data: { content: string }): Promise<Paragraph> {
        return await Paragraph.create(data);
    }

    async findAll(): Promise<Paragraph[]> {
        return await Paragraph.findAll();
    }

    async findById(id: number): Promise<Paragraph | null> {
        return await Paragraph.findByPk(id);
    }
}
