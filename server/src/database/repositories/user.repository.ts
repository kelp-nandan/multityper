import { Sequelize } from "sequelize";
import { IUser, IUserProfile, ICreateUserData } from "../../users/interfaces";
import { User } from "../../models";

export class UserRepository {
  constructor(private sequelize: Sequelize) {
    User.initModel(this.sequelize);
  }

  /**
   * Find user by email for authentication purposes only.
   */
  async findByEmailForAuth(email: string): Promise<IUser | null> {
    return await User.findOne({
      where: { email },
      attributes: [
        "id",
        "name",
        "email",
        "password",
        "created_at",
        "updated_at",
        "created_by",
        "updated_by",
      ],
    });
  }

  /**
   * Find user by email for general purposes.
   */
  async findByEmail(email: string): Promise<IUserProfile | null> {
    const user = await User.findOne({
      where: { email },
      attributes: [
        "id",
        "name",
        "email",
        "created_at",
        "updated_at",
        "created_by",
        "updated_by",
      ],
    });
    return user ? user.toProfile() : null;
  }

  async findById(userId: number): Promise<IUserProfile | null> {
    const user = await User.findOne({
      where: { id: userId },
      attributes: [
        "id",
        "name",
        "email",
        "created_at",
        "updated_at",
        "created_by",
        "updated_by",
      ],
    });
    return user ? user.toProfile() : null;
  }

  async create(userData: ICreateUserData): Promise<IUserProfile> {
    const user = await User.create({
      name: userData.name,
      email: userData.email,
      password: userData.password,
    });

    // Update created_by and updated_by to user's own ID after creation
    await user.update({
      created_by: user.id,
      updated_by: user.id,
    });

    return user.toProfile();
  }

  async findAll(): Promise<IUserProfile[]> {
    const users = await User.findAll({
      attributes: [
        "id",
        "name",
        "email",
        "created_at",
        "updated_at",
        "created_by",
        "updated_by",
      ],
      order: [["created_at", "DESC"]],
    });
    return users.map((user) => user.toProfile());
  }

  async getTotalCount(): Promise<number> {
    return await User.count();
  }

  async updateById(
    userId: number,
    updateData: Partial<ICreateUserData>,
  ): Promise<IUserProfile | null> {
    await User.update(updateData, {
      where: { id: userId },
    });

    const updatedUser = await User.findByPk(userId, {
      attributes: [
        "id",
        "name",
        "email",
        "created_at",
        "updated_at",
        "created_by",
        "updated_by",
      ],
    });

    return updatedUser ? updatedUser.toProfile() : null;
  }

  async deleteById(userId: number): Promise<boolean> {
    const deletedRows = await User.destroy({
      where: { id: userId },
    });
    return deletedRows > 0;
  }

  async findByIds(userIds: number[]): Promise<IUserProfile[]> {
    if (userIds.length === 0) return [];

    const users = await User.findAll({
      where: {
        id: userIds,
      },
      attributes: [
        "id",
        "name",
        "email",
        "created_at",
        "updated_at",
        "created_by",
        "updated_by",
      ],
      order: [["created_at", "DESC"]],
    });
    return users.map((user) => user.toProfile());
  }
}
