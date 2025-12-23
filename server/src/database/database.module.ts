import { Module } from "@nestjs/common";
import { databaseProviders } from "../config/database.config";
import { UserRepository } from "./repositories/user.repository";
import { ParagraphRepository } from "./repositories/paragraph.repository";

const repositoryProviders = [
  {
    provide: UserRepository,
    useFactory: (sequelize) => new UserRepository(sequelize),
    inject: ["SEQUELIZE"],
  },
  {
    provide: ParagraphRepository,
    useFactory: (sequelize) => new ParagraphRepository(sequelize),
    inject: ["SEQUELIZE"],
  },
];

@Module({
  providers: [...databaseProviders, ...repositoryProviders],
  exports: [UserRepository, ParagraphRepository, "SEQUELIZE"],
})
export class DatabaseModule { }
