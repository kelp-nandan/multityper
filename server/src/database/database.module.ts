import { Module } from "@nestjs/common";
import { Sequelize } from "sequelize";
import { databaseProviders } from "../config/database.config";
import { ParagraphRepository } from "./repositories/paragraph.repository";
import { UserRepository } from "./repositories/user.repository";

const repositoryProviders = [
  {
    provide: UserRepository,
    useFactory: (sequelize: Sequelize) => new UserRepository(sequelize),
    inject: ["SEQUELIZE"],
  },
  {
    provide: ParagraphRepository,
    useFactory: (sequelize: Sequelize) => new ParagraphRepository(sequelize),
    inject: ["SEQUELIZE"],
  },
];

@Module({
  providers: [...databaseProviders, ...repositoryProviders],
  exports: [UserRepository, ParagraphRepository, "SEQUELIZE"],
})
export class DatabaseModule {}
