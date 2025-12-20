# Security Implementation Guide

## Overview
This application implements multiple layers of security to protect user credentials and sessions.

## 🔐 Security Features Implemented

### 1. **Password Security**
- **Server-Side Hashing**: Passwords are securely hashed using bcrypt (12 salt rounds) on the server
- **HTTPS Recommended**: Use HTTPS in production to encrypt password transmission
- **No Client-Side Hashing**: Passwords sent as plain text over encrypted connection (HTTPS)
- **Strong Password Requirements**: 
  - Minimum 6 characters
  - Must contain uppercase, lowercase, and numbers

### 2. **JWT Token Management**
- **Short-Lived Access Tokens**: 15-minute expiry for enhanced security
- **Refresh Tokens**: 7-day expiry for seamless user experience
- **Automatic Token Refresh**: Interceptor automatically refreshes expired tokens
- **Token Expiry Monitoring**: Checks every minute for expired tokens

### 3. **Refresh Token System**
- **Database Storage**: Refresh tokens stored in separate `refresh_tokens` table
- **Revocation Support**: Tokens can be revoked on logout
- **Expiry Tracking**: Each token has an expiration date
- **User Association**: Tokens linked to user accounts

### 4. **HTTP Interceptor**
- **Automatic Authorization**: Adds Bearer token to all authenticated requests
- **Error Handling**: Catches 401 errors and attempts token refresh
- **Retry Logic**: Automatically retries failed requests after token refresh

## 📊 Architecture

### Client-Side Flow
```
User Input → Send to Server (HTTPS) → Receive Tokens → Store Tokens → Auto-refresh on expiry
```

### Server-Side Flow
```
Receive Password → Hash with bcrypt (12 rounds) → Store in DB → Generate JWT + Refresh Token
```

## 🔧 Configuration

### JWT Configuration
**Location**: `server/src/auth/auth.module.ts` & `server/src/user/user.module.ts`

```typescript
JwtModule.register({
  secret: 'your-secret-key', // Move to environment variables
  signOptions: { expiresIn: '15m' }
})
```

### Refresh Token Expiry
**Location**: `server/src/user/user.service.ts`

```typescript
expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
```

## 🚀 Usage Examples

### Login with Security
```typescript
// Client sends password over HTTPS
authService.login(email, password);
// Server hashes and verifies password
// Generates access token + refresh token
```

### Automatic Token Refresh
```typescript
// Interceptor handles this automatically
// If request fails with 401, token is refreshed
// Original request is retried
```

### Manual Token Refresh
```typescript
const success = await authService.refreshToken();
if (success) {
  // Token refreshed successfully
}
```

### Logout
```typescript
await authService.logout();
// Revokes refresh token on server
// Clears all local storage
```

## 🛡️ Security Best Practices

### ✅ Implemented
- ✅ Server-side password hashing with bcrypt (12 rounds)
- ✅ Short-lived access tokens (15 min)
- ✅ Long-lived refresh tokens (7 days)
- ✅ Automatic token refresh
- ✅ Token revocation on logout
- ✅ JWT guards on protected routes
- ✅ Environment-based configuration

### 🔄 Recommended Improvements
1. **Move JWT Secret to Environment Variables**
   ```typescript
   secret: process.env.JWT_SECRET
   ```

2. **Use HTTPS in Production**
   - Ensures encrypted transmission
   - Prevents man-in-the-middle attacks

3. **Implement Rate Limiting**
   - Prevent brute force attacks
   - Use `@nestjs/throttler`

4. **Add CSRF Protection**
   - Implement CSRF tokens for state-changing operations

5. **Enable HTTP-Only Cookies**
   - Store tokens in HTTP-only cookies instead of localStorage
   - Prevents XSS attacks

6. **Add IP Tracking**
   - Track login IPs for suspicious activity
   - Alert users of new device logins

7. **Implement 2FA (Two-Factor Authentication)**
   - Add extra layer of security
   - Use TOTP or SMS verification

## 📱 Testing

### Test Password Security
1. Open browser DevTools → Network tab
2. Login/Register with account
3. Check request payload
4. Password sent as plain text (ensure you're using HTTPS in production)

### Test Token Refresh
1. Login to application
2. Wait 15 minutes (or manually expire token)
3. Make an API call
4. Token should automatically refresh

### Test Logout
1. Login to application
2. Logout
3. Check localStorage (should be empty)
4. Try to access protected route (should redirect to login)

## 🔍 Monitoring

### Token Expiry Check
**Interval**: Every 60 seconds  
**Location**: `AuthService.startTokenExpiryCheck()`

### Failed Login Attempts
Monitor for:
- Multiple failed attempts from same IP
- Unusual login times
- Login from new locations

## 📝 API Endpoints

### Authentication Endpoints
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login (returns access + refresh tokens)
- `POST /api/users/refresh` - Refresh access token
- `POST /api/users/logout` - Logout (revokes refresh token)
- `GET /api/users/profile` - Get user profile (protected)

### Request Headers
```
Authorization: Bearer <access_token>
```

## 🐛 Troubleshooting

### Issue: "Invalid credentials" on login
- Verify password is correct
- Check server-side bcrypt hashing
- Ensure database has correct user record

### Issue: Token expired immediately
- Verify JWT expiry is set to '15m'
- Check system time is synchronized
- Ensure token payload includes 'exp' claim

### Issue: Refresh token not working
- Check refresh token exists in database
- Verify token hasn't been revoked
- Check token expiration date

## 📚 Dependencies

### Client
- No special dependencies for authentication (uses HttpClient)

### Server
- `bcrypt` - Password hashing
- `@nestjs/jwt` - JWT implementation
- `@nestjs/passport` - Authentication
- `@nestjs/config` - Environment configuration
- 
#
