# Multi-Typer Game

## 🎯 Project Overview

A real-time multiplayer typing application with secure authentication and user management.

## 🔐 Authentication System

### Security Features
- **Dual-Layer Password Security**: Frontend SHA-256 hashing + backend bcrypt encryption
- **JWT Authentication**: Access and refresh token mechanism
- **HTTP-Only Cookies**: Secure token storage preventing XSS attacks
- **Route Protection**: Frontend guards for authenticated/guest routes
- **Input Validation**: Client and server-side validation

### User Management
- **Registration**: Secure account creation with validation
- **Login/Logout**: JWT-based authentication flow
- **Session Management**: Automatic token refresh
- **Demo Accounts**: Pre-configured test users available

### Database Schema
- **Users Table**: User credentials and profile data
- **Refresh Tokens Table**: Secure token management
- **PostgreSQL**: Production-ready database with Sequelize ORM

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd multityper
```

2. **Start database**
```bash
docker-compose up -d
```

3. **Backend setup**
```bash
cd server
npm install
npm run migration:run
npm run start:dev
```

4. **Frontend setup**
```bash
cd client
npm install
ng serve
```

### Demo Credentials
- **Username**: `admin` | **Password**: `password123`
- **Username**: `user1` | **Password**: `password123`

## 🛠️ Tech Stack

- **Frontend**: Angular 18, TypeScript, SCSS
- **Backend**: NestJS, TypeScript, JWT
- **Database**: PostgreSQL, Sequelize ORM
- **Security**: bcrypt, crypto-js, HTTP-only cookies

## 📁 Project Structure

```
multityper/
├── client/           # Angular frontend
│   ├── src/app/
│   │   ├── guards/   # Route protection
│   │   ├── services/ # Authentication service
│   │   └── login/    # Login component
├── server/           # NestJS backend
│   ├── src/
│   │   ├── auths/    # JWT strategy & guards
│   │   ├── users/    # User management
│   │   └── config/   # Database configuration
│   └── migrations/   # Database migrations
```

## 🔑 Authentication Flow

1. User submits login credentials
2. Frontend hashes password with SHA-256
3. Backend validates against bcrypt hash
4. JWT tokens generated and stored in HTTP-only cookies
5. Protected routes accessible with valid tokens
6. Automatic token refresh on expiration

---

**Status**: ✅ Authentication system complete and ready for development