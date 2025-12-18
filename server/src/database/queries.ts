import { Sequelize, QueryTypes } from 'sequelize';

export class DatabaseQueries {
    constructor(private sequelize: Sequelize) { }

    // User related database operations

    async findUserByEmail(email: string): Promise<any | null> {
        const result = await this.sequelize.query(
            `SELECT id, name, email, password, created_at, updated_at 
             FROM users WHERE email = :email LIMIT 1`,
            {
                replacements: { email },
                type: QueryTypes.SELECT
            }
        );
        return result.length > 0 ? result[0] : null;
    }

    async findUserById(userId: number): Promise<any | null> {
        const result = await this.sequelize.query(
            `SELECT id, name, email, created_at, updated_at 
             FROM users WHERE id = :userId LIMIT 1`,
            {
                replacements: { userId },
                type: QueryTypes.SELECT
            }
        );
        return result.length > 0 ? result[0] : null;
    }

    async checkUserExists(email: string): Promise<boolean> {
        const result = await this.sequelize.query(
            `SELECT id FROM users WHERE email = :email LIMIT 1`,
            {
                replacements: { email },
                type: QueryTypes.SELECT
            }
        );
        return result.length > 0;
    }

    async createUser(name: string, email: string, hashedPassword: string): Promise<any> {
        const result = await this.sequelize.query(
            `INSERT INTO users (name, email, password, created_at, updated_at) 
             VALUES (:name, :email, :password, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
             RETURNING id, name, email, created_at, updated_at`,
            {
                replacements: { name, email, password: hashedPassword },
                type: QueryTypes.INSERT
            }
        );
        return result[0][0];
    }

    async getAllUsers(): Promise<any[]> {
        return await this.sequelize.query(
            `SELECT id, name, email, created_at, updated_at 
             FROM users ORDER BY created_at DESC`,
            {
                type: QueryTypes.SELECT
            }
        );
    }

    // Refresh token operations

    async createRefreshToken(token: string, userId: number, expiresAt: Date): Promise<void> {
        await this.sequelize.query(
            `INSERT INTO refresh_tokens (token, user_id, expires_at, created_at, updated_at) 
             VALUES (:token, :userId, :expiresAt, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            {
                replacements: { token, userId, expiresAt },
                type: QueryTypes.INSERT
            }
        );
    }

    async findRefreshTokenWithUser(token: string): Promise<any | null> {
        const result = await this.sequelize.query(
            `SELECT rt.id, rt.token, rt.expires_at, rt.revoked, 
                    u.id as user_id, u.name, u.email 
             FROM refresh_tokens rt 
             JOIN users u ON rt.user_id = u.id 
             WHERE rt.token = :token LIMIT 1`,
            {
                replacements: { token },
                type: QueryTypes.SELECT
            }
        );
        return result.length > 0 ? result[0] : null;
    }

    async revokeRefreshToken(token: string): Promise<void> {
        await this.sequelize.query(
            `UPDATE refresh_tokens SET revoked = true, updated_at = CURRENT_TIMESTAMP 
             WHERE token = :token`,
            {
                replacements: { token },
                type: QueryTypes.UPDATE
            }
        );
    }

    async deleteExpiredTokens(): Promise<void> {
        await this.sequelize.query(
            `DELETE FROM refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP`,
            {
                type: QueryTypes.DELETE
            }
        );
    }

    // Game management (for future features)

    async createGame(title: string, description: string): Promise<any> {
        const result = await this.sequelize.query(
            `INSERT INTO games (title, description, created_at, updated_at) 
             VALUES (:title, :description, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
             RETURNING id, title, description, created_at, updated_at`,
            {
                replacements: { title, description },
                type: QueryTypes.INSERT
            }
        );
        return result[0][0];
    }

    async findGameById(gameId: number): Promise<any | null> {
        const result = await this.sequelize.query(
            `SELECT id, title, description, created_at, updated_at 
             FROM games WHERE id = :gameId LIMIT 1`,
            {
                replacements: { gameId },
                type: QueryTypes.SELECT
            }
        );
        return result.length > 0 ? result[0] : null;
    }

    // User statistics and analytics

    async getUserStats(userId: number): Promise<any> {
        const result = await this.sequelize.query(
            `SELECT 
                COUNT(*) as total_games,
                AVG(wpm) as avg_wpm,
                MAX(wpm) as best_wpm,
                AVG(accuracy) as avg_accuracy
             FROM game_sessions 
             WHERE user_id = :userId`,
            {
                replacements: { userId },
                type: QueryTypes.SELECT
            }
        );
        return result[0] || { total_games: 0, avg_wpm: 0, best_wpm: 0, avg_accuracy: 0 };
    }

    // Administrative functions

    async getTotalUsersCount(): Promise<number> {
        const result = await this.sequelize.query(
            `SELECT COUNT(*) as count FROM users`,
            {
                type: QueryTypes.SELECT
            }
        );
        return (result[0] as any).count;
    }

    async getActiveUsersLastWeek(): Promise<number> {
        const result = await this.sequelize.query(
            `SELECT COUNT(DISTINCT user_id) as count 
             FROM refresh_tokens 
             WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'`,
            {
                type: QueryTypes.SELECT
            }
        );
        return (result[0] as any).count;
    }
}