import { Module } from "@nestjs/common";
import { databaseProviders } from "../config/database.config";
import { UserRepository } from "./repositories/user.repository";

const repositoryProviders = [
  {
    provide: UserRepository,
    useFactory: (sequelize) => new UserRepository(sequelize),
    inject: ["SEQUELIZE"],
  },
];

@Module({
  providers: [...databaseProviders, ...repositoryProviders],
  exports: [UserRepository],
})
export class DatabaseModule {}
