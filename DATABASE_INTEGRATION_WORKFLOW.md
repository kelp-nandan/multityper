# Database Integration Workflow

## Overview
This document outlines the complete database integration workflow for the Multi-Typer Game project, including setup, development practices, and team collaboration guidelines.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Angular 21    │    │    NestJS API    │    │   PostgreSQL    │
│   Frontend      │◄──►│    Backend       │◄──►│   Database      │
│                 │    │                  │    │                 │
│ - Auth Guards   │    │ - JWT Strategy   │    │ - Users Table   │
│ - HTTP Client   │    │ - Sequelize ORM  │    │ - Tokens Table  │
│ - Interceptors  │    │ - Migrations     │    │ - Game Tables   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Database Technology Stack

### Core Technologies
- **Database**: PostgreSQL 15+
- **Query Interface**: Raw SQL with Sequelize connection
- **Container**: Docker for local development
- **Migration Tool**: Sequelize CLI with manual SQL
- **Authentication**: JWT with Refresh Tokens

### Architecture Approach
- **100% Manual SQL Queries**: No ORM methods, pure SQL for all operations
- **Centralized Query Management**: All SQL queries in dedicated query class
- **Migration-First Schema**: Database structure defined through raw SQL migrations
- **Parameterized Queries**: SQL injection protection through parameter binding

### Project Structure
```
server/
├── config/
│   └── config.json              # Sequelize CLI configuration
├── migrations/                  # Raw SQL schema definitions
│   ├── 01-create-users-table.js
│   ├── 02-create-refresh-tokens-table.js
│   └── 03-seed-demo-users.js
├── models/
│   └── index.js                 # Sequelize instance loader (unused)
└── src/
    ├── config/
    │   ├── database.config.ts   # Raw Sequelize connection provider
    │   └── configuration.ts     # Environment configuration
    ├── database/
    │   └── queries.ts           # Centralized SQL queries class
    └── users/
        ├── dto/                 # Data transfer objects
        ├── users.controller.ts  # API endpoints
        ├── users.service.ts     # Business logic with raw queries
        └── users.module.ts      # Module configuration
```

## Development Workflow

### 1. Initial Setup Process

#### Prerequisites
```bash
# Required software
- Node.js 18+
- Docker Desktop
- PostgreSQL Client (optional)
- Git
```

#### Database Container Setup
```bash
# 1. Create and start PostgreSQL container
docker run --name postgres-local \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin123 \
  -e POSTGRES_DB=testdb \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  -d postgres:15

# 2. Verify container is running
docker ps | grep postgres-local

# 3. Test database connection
docker exec -it postgres-local psql -U admin -d testdb
```

#### Project Setup
```bash
# 1. Clone repository
git clone <repository-url>
cd multityper

# 2. Install dependencies
cd server && npm install
cd ../client && npm install

# 3. Copy environment file
cp server/.env.example server/.env

# 4. Update database credentials in .env
DATABASE_URL=postgresql://admin:admin123@localhost:5432/testdb
```

### 2. Migration Workflow

#### Understanding Migrations
Migrations are **version-controlled database changes** that allow teams to:
- Track database schema evolution
- Synchronize database changes across environments
- Rollback changes if needed
- Collaborate safely on database modifications

#### Current Migration Files

**01-create-users-table.js**
```javascript
// Creates the main users table with authentication fields
- id (Primary Key)
- email (Unique)
- password (Hashed)
- created_at/updated_at timestamps
```

**02-create-refresh-tokens-table.js**
```javascript
// Creates refresh tokens table for JWT authentication
- id (Primary Key)
- user_id (Foreign Key to users)
- token (Unique refresh token)
- expires_at (Token expiration)
- created_at timestamp
```

**03-seed-demo-users.js**
```javascript
// Seeds initial demo users for development/testing
- Demo User (demo@multityper.com)
- Admin User (admin@multityper.com)
- Test User (test@multityper.com)
```

#### Running Migrations
```bash
# Navigate to server directory
cd server

# Run all pending migrations
npx sequelize-cli db:migrate

# Check migration status
npx sequelize-cli db:migrate:status

# Rollback last migration (if needed)
npx sequelize-cli db:migrate:undo

# Rollback all migrations (reset database)
npx sequelize-cli db:migrate:undo:all
```

### 3. Adding New Features

#### Creating New Tables
```bash
# 1. Generate migration file
npx sequelize-cli migration:generate --name create-games-table

# 2. Edit the migration file
# migrations/YYYYMMDDHHMMSS-create-games-table.js
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('games', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      // ... other fields
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('games');
  }
};

# 3. Run the migration
npx sequelize-cli db:migrate
```

#### Creating Seeders (Optional)
```bash
# 1. Generate seeder file
npx sequelize-cli seed:generate --name demo-games

# 2. Edit seeder file
# seeders/YYYYMMDDHHMMSS-demo-games.js
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('games', [
      {
        title: 'Speed Typing Challenge',
        description: 'Test your typing speed',
        created_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('games', null, {});
  }
};

# 3. Run seeder
npx sequelize-cli db:seed:all
```

### 4. NestJS Integration

#### Raw Query Implementation
```typescript
// src/database/queries.ts - Centralized SQL Query Class
import { Sequelize, QueryTypes } from 'sequelize';

export class DatabaseQueries {
    constructor(private sequelize: Sequelize) {}

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
}
```

#### Service Implementation with Raw Queries
```typescript
// src/users/users.service.ts
@Injectable()
export class UsersService {
    private dbQueries: DatabaseQueries;

    constructor(
        @Inject('SEQUELIZE')
        private sequelize: Sequelize,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {
        this.dbQueries = new DatabaseQueries(sequelize);
    }

    async register(createUserDto: CreateUserDto): Promise<any> {
        const { name, email, password } = createUserDto;
        
        // Check if email is already taken
        const userExists = await this.dbQueries.checkUserExists(email);
        if (userExists) {
            throw new ConflictException('Email already in use');
        }

        // Password comes pre-hashed from frontend, add server-side bcrypt
        const serverHash = await bcrypt.hash(password, 12);

        // Save new user to database
        const newUser = await this.dbQueries.createUser(name, email, serverHash);
        return newUser;
    }
}
```

#### Database Provider Configuration
```typescript
// src/config/database.config.ts
export const databaseProviders = [
    {
        provide: 'SEQUELIZE',
        useFactory: async () => {
            const sequelize = new Sequelize({
                dialect: 'postgres',
                host: ENV.DATABASE_HOST,
                port: ENV.DATABASE_PORT,
                username: ENV.DATABASE_USER,
                password: ENV.DATABASE_PASSWORD,
                database: ENV.DB_NAME,
                logging: false, // No SQL query logging in console
            });

            await sequelize.authenticate();
            return sequelize;
        },
    },
];
```

## Complete Database Integration Workflow

### Phase 1: Database Schema Creation

#### Migration Files (Raw SQL)
All database structure is defined through raw SQL migrations:

**1. Create Users Table (01-create-users-table.js)**
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX idx_users_email ON users(email);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
BEFORE UPDATE ON users 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**2. Create Refresh Tokens Table (02-create-refresh-tokens-table.js)**
```sql
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(500) NOT NULL UNIQUE,
    user_id INTEGER NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_tokens_user_id 
      FOREIGN KEY (user_id) 
      REFERENCES users(id) 
      ON DELETE CASCADE 
      ON UPDATE CASCADE
);

-- Performance indexes
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

**3. Seed Demo Users (03-seed-demo-users.js)**
```javascript
// Demo user password: Demo@123
const demoSha256Hash = crypto.createHash('sha256').update('Demo@123').digest('hex');
const demoHashedPassword = await bcrypt.hash(demoSha256Hash, 12);

await queryInterface.sequelize.query(`
    INSERT INTO users (name, email, password, created_at, updated_at) VALUES 
    ('Demo User', 'demo@multityper.com', '${demoHashedPassword}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Admin User', 'admin@multityper.com', '${adminHashedPassword}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('Test User', 'test@multityper.com', '${testHashedPassword}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
`);
```

### Phase 2: Application Layer Integration

#### Database Query Architecture
```typescript
// Central query management system
export class DatabaseQueries {
    constructor(private sequelize: Sequelize) {}

    // User management queries
    async findUserByEmail(email: string): Promise<any | null> { /* Raw SQL */ }
    async createUser(name: string, email: string, hashedPassword: string): Promise<any> { /* Raw SQL */ }
    async checkUserExists(email: string): Promise<boolean> { /* Raw SQL */ }
    async getAllUsers(): Promise<any[]> { /* Raw SQL */ }

    // Token management queries  
    async createRefreshToken(token: string, userId: number, expiresAt: Date): Promise<void> { /* Raw SQL */ }
    async findRefreshTokenWithUser(token: string): Promise<any | null> { /* Raw SQL */ }
    async revokeRefreshToken(token: string): Promise<void> { /* Raw SQL */ }

    // Future feature queries
    async createGame(title: string, description: string): Promise<any> { /* Raw SQL */ }
    async getUserStats(userId: number): Promise<any> { /* Raw SQL */ }
}
```

#### Service Layer Implementation
```typescript
@Injectable()
export class UsersService {
    private dbQueries: DatabaseQueries;

    constructor(@Inject('SEQUELIZE') sequelize: Sequelize) {
        this.dbQueries = new DatabaseQueries(sequelize);
    }

    // All business logic uses centralized queries
    async register() { return await this.dbQueries.createUser(...); }
    async login() { return await this.dbQueries.findUserByEmail(...); }
    async refresh() { return await this.dbQueries.findRefreshTokenWithUser(...); }
}
```

### Phase 3: Security Integration

#### Password Security Flow
```
1. Frontend: User Input → SHA-256 Hash → Send to Backend
2. Backend: Receive SHA-256 → bcrypt Hash → Store in Database
3. Login: Frontend SHA-256 → Backend bcrypt.compare() → Verify
```

#### Authentication Flow
```
1. Registration: Raw SQL INSERT into users table
2. Login: Raw SQL SELECT user by email + password verification
3. Token Generation: Raw SQL INSERT refresh token + JWT creation
4. Protected Routes: JWT verification + Raw SQL user lookup
5. Token Refresh: Raw SQL SELECT refresh token + generate new JWT
6. Logout: Raw SQL UPDATE refresh token to revoked
```

### Phase 4: Data Flow Architecture

#### Complete Request-Response Cycle

**User Registration:**
```
POST /api/users/register
├── users.controller.ts → Validate DTO
├── users.service.ts → Business logic
├── database/queries.ts → checkUserExists()
│   └── Raw SQL: SELECT id FROM users WHERE email = :email
├── database/queries.ts → createUser()
│   └── Raw SQL: INSERT INTO users (...) RETURNING id, name, email
└── Response: User data (without password)
```

**User Login:**
```
POST /api/users/login  
├── users.controller.ts → Validate credentials
├── users.service.ts → Authentication logic
├── database/queries.ts → findUserByEmail()
│   └── Raw SQL: SELECT * FROM users WHERE email = :email
├── bcrypt.compare() → Verify password
├── database/queries.ts → createRefreshToken()
│   └── Raw SQL: INSERT INTO refresh_tokens (...)
├── JWT generation → Access token
└── Response: { user, accessToken, refreshToken }
```

**Token Refresh:**
```
POST /api/users/refresh
├── users.controller.ts → Extract refresh token
├── users.service.ts → Token validation
├── database/queries.ts → findRefreshTokenWithUser()
│   └── Raw SQL: SELECT rt.*, u.* FROM refresh_tokens rt JOIN users u...
├── Token expiration check → Validate timing
├── JWT generation → New access token  
└── Response: { accessToken }
```

### Phase 5: Development Workflow Integration

#### Adding New Features
```bash
# 1. Create migration for new table
npx sequelize-cli migration:generate --name create-games-table

# 2. Write raw SQL in migration
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TABLE games (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        max_players INTEGER DEFAULT 4,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
};

# 3. Add queries to DatabaseQueries class
async createGame(title: string, description: string): Promise<any> {
    const result = await this.sequelize.query(
        `INSERT INTO games (title, description, created_at) 
         VALUES (:title, :description, CURRENT_TIMESTAMP) 
         RETURNING *`,
        { replacements: { title, description }, type: QueryTypes.INSERT }
    );
    return result[0][0];
}

# 4. Use in service layer
async createGameRoom(gameDto: CreateGameDto) {
    return await this.dbQueries.createGame(gameDto.title, gameDto.description);
}
```

### Phase 6: Production Deployment Integration

#### Environment Configuration
```typescript
// Production database provider
export const databaseProviders = [
    {
        provide: 'SEQUELIZE',
        useFactory: async () => {
            const sequelize = new Sequelize({
                dialect: 'postgres',
                host: process.env.DATABASE_HOST,
                port: parseInt(process.env.DATABASE_PORT),
                username: process.env.DATABASE_USER,
                password: process.env.DATABASE_PASSWORD,
                database: process.env.DB_NAME,
                logging: false, // No SQL logging in production
                pool: {
                    max: 20,
                    min: 0,
                    acquire: 60000,
                    idle: 10000
                }
            });
            await sequelize.authenticate();
            return sequelize;
        },
    },
];
```

#### Migration Deployment
```bash
# Production migration workflow
1. Deploy code to staging → Test migrations
2. Backup production database → Safety measure  
3. Run migrations → npx sequelize-cli db:migrate
4. Verify data integrity → Manual checks
5. Deploy application → Zero downtime deployment
```

## Team Collaboration Guidelines

### 1. Branch Strategy
```bash
# Feature development workflow
git checkout -b feature/game-rooms
# Make database changes (migrations)
# Test locally
git add migrations/
git commit -m "Add: Game rooms table migration"
git push origin feature/game-rooms
# Create pull request
```

### 2. Migration Best Practices

#### DO's ✅
- **Always use migrations** for schema changes
- **Test migrations locally** before pushing
- **Use descriptive names** for migration files
- **Add rollback logic** in down() methods
- **Review migrations in PRs** carefully
- **Run migrations on staging** before production

#### DON'Ts ❌
- **Never modify existing migrations** after they're merged
- **Don't skip migrations** when pulling changes
- **Avoid manual database changes** in shared environments
- **Don't commit .env files** with real credentials
- **Never force-push** migration changes

### 3. Code Review Checklist

#### Migration Review
- [ ] Migration file follows naming convention
- [ ] Up and down methods are properly implemented
- [ ] Foreign key constraints are properly defined
- [ ] Indexes are added for performance-critical fields
- [ ] Migration is tested locally
- [ ] Rollback procedure is documented

#### Entity Review
- [ ] TypeScript interfaces match database schema
- [ ] Proper data validation decorators
- [ ] Relationships are correctly defined
- [ ] Security considerations (password hashing, etc.)

### 4. Environment Management

#### Development Environment
```bash
# .env.development
NODE_ENV=development
DATABASE_URL=postgresql://admin:admin123@localhost:5432/testdb
JWT_SECRET=dev-secret-key-not-for-production
```

#### Production Environment
```bash
# .env.production
NODE_ENV=production
DATABASE_URL=${DATABASE_URL}  # From hosting provider
JWT_SECRET=${JWT_SECRET}      # Strong generated secret
```

## Troubleshooting Guide

### Common Issues

#### 1. Migration Fails
```bash
# Check current migration status
npx sequelize-cli db:migrate:status

# View detailed error logs
npx sequelize-cli db:migrate --debug

# Rollback problematic migration
npx sequelize-cli db:migrate:undo

# Fix migration file and try again
npx sequelize-cli db:migrate
```

#### 2. Database Connection Issues
```bash
# Test database connection
docker exec -it postgres-local psql -U admin -d testdb

# Check container status
docker ps | grep postgres

# Restart database container
docker restart postgres-local

# Check application logs
npm run start:dev
```

#### 3. Raw Query Debugging
```bash
# Test individual queries in psql
docker exec -it postgres-local psql -U admin -d testdb

# Test user lookup query
SELECT id, name, email FROM users WHERE email = 'demo@multityper.com';

# Test refresh token query with join
SELECT rt.id, rt.token, rt.expires_at, rt.revoked, 
       u.id as user_id, u.name, u.email 
FROM refresh_tokens rt 
JOIN users u ON rt.user_id = u.id 
WHERE rt.token = 'your-token-here';

# Check query performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
```

#### 4. Database Query Issues
```typescript
// Debug query execution in development
async findUserByEmail(email: string): Promise<any | null> {
    console.log('Executing query for email:', email);
    const result = await this.sequelize.query(
        `SELECT id, name, email, password, created_at, updated_at 
         FROM users WHERE email = :email LIMIT 1`,
        {
            replacements: { email },
            type: QueryTypes.SELECT,
            logging: console.log // Enable logging for this query
        }
    );
    console.log('Query result:', result);
    return result.length > 0 ? result[0] : null;
}
```

### Performance Considerations

#### Database Indexing
```javascript
// Add indexes in migrations for performance
await queryInterface.addIndex('users', ['email']);
await queryInterface.addIndex('games', ['created_at']);
await queryInterface.addIndex('refresh_tokens', ['user_id', 'expires_at']);
```

#### Connection Pooling
```typescript
// Configure connection pool in production
const sequelize = new Sequelize(databaseUrl, {
  pool: {
    max: 20,
    min: 0,
    acquire: 60000,
    idle: 10000
  }
});
```

## Security Best Practices

### 1. Environment Variables
- Use strong, unique JWT secrets
- Never commit actual credentials
- Use different secrets per environment
- Rotate secrets regularly

### 2. Database Security
- Use parameterized queries (Sequelize handles this)
- Implement proper input validation
- Hash passwords before storage
- Use HTTPS in production
- Implement rate limiting

### 3. Authentication Security
- Use httpOnly cookies for tokens
- Implement token refresh mechanism
- Set appropriate token expiration times
- Log authentication attempts

## Monitoring and Maintenance

### 1. Database Monitoring
```bash
# Monitor database size
docker exec postgres-local psql -U admin -d testdb -c "
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
  FROM pg_tables 
  WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# Check active connections
docker exec postgres-local psql -U admin -d testdb -c "
  SELECT count(*) as active_connections 
  FROM pg_stat_activity 
  WHERE state = 'active';
"
```

### 2. Migration Monitoring
```bash
# Regular migration status checks
npx sequelize-cli db:migrate:status

# Backup before major migrations
docker exec postgres-local pg_dump -U admin testdb > backup-$(date +%Y%m%d).sql
```

## Future Enhancements

### 1. Planned Features
- Game rooms and sessions
- Real-time typing statistics
- Leaderboards and rankings
- User profiles and achievements
- Game history and analytics

### 2. Database Scaling
- Read replicas for heavy queries
- Partitioning for large tables
- Caching layer (Redis)
- Database sharding considerations

---

## Quick Reference Commands

```bash
# Database Management
docker start postgres-local              # Start database
docker stop postgres-local               # Stop database
docker exec -it postgres-local psql -U admin -d testdb  # Connect to DB

# Migration Commands
npx sequelize-cli db:migrate             # Run migrations
npx sequelize-cli db:migrate:undo        # Rollback last migration
npx sequelize-cli migration:generate --name <name>  # Create migration

# Development
npm run start:dev                        # Start NestJS server
npm run start                           # Start Angular client
```

---

**Last Updated**: December 18, 2025
**Version**: 1.0
**Maintainer**: Development Team