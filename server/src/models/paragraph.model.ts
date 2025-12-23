import { DataTypes, Model, Sequelize } from 'sequelize';

export interface IParagraph {
    id: number;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateParagraph {
    content: string;
}

export class Paragraph extends Model<IParagraph, ICreateParagraph> implements IParagraph {
    declare id: number;
    declare content: string;
    declare createdAt: Date;
    declare updatedAt: Date;

    static initModel(sequelize: Sequelize): typeof Paragraph {
        Paragraph.init(
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true,
                },
                content: {
                    type: DataTypes.TEXT,
                    allowNull: false,
                },
                createdAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    field: 'createdAt',
                },
                updatedAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    field: 'updatedAt',
                },
            },
            {
                sequelize,
                tableName: 'Paragraphs',
                timestamps: true,
            }
        );

        return Paragraph;
    }
}



