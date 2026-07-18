# JWT Authentication Implementation

## Summary

I've implemented JWT token and refresh token authentication with Passport strategies and guards for your NestJS application.

## Changes Made

### 1. **DTOs**

- [src/auth/dto/token.output.ts](src/auth/dto/token.output.ts) - Response DTO for login containing `accessToken`, `refreshToken`, `tokenType`, and `expiresIn`

### 2. **Strategies**

- [src/auth/strategies/jwt.strategy.ts](src/auth/strategies/jwt.strategy.ts) - JWT strategy that extracts and validates Bearer tokens
- [src/auth/strategies/refresh-token.strategy.ts](src/auth/strategies/refresh-token.strategy.ts) - Refresh token strategy for token rotation

### 3. **Guards**

- [src/auth/guards/jwt-auth.guard.ts](src/auth/guards/jwt-auth.guard.ts) - Guard to protect routes with JWT validation
- [src/auth/guards/refresh-token.guard.ts](src/auth/guards/refresh-token.guard.ts) - Guard for refresh token endpoints

### 4. **Services & Controllers**

- Updated [src/auth/auth.service.ts](src/auth/auth.service.ts):
  - Added `generateTokens()` method that returns both access and refresh tokens
  - Enhanced `validateUser()` to verify password before returning user
- Updated [src/auth/auth.controller.ts](src/auth/auth.controller.ts):
  - Modified `login()` endpoint to return `TokenOutput` with access and refresh tokens

### 5. **Module Configuration**

- Updated [src/auth/auth.module.ts](src/auth/auth.module.ts):
  - Imported `JwtModule` and `PassportModule`
  - Registered JWT configuration with secret and expiration
  - Added strategies as providers

### 6. **Environment Variables**

- Updated [.env.example](.env.example) with JWT configuration:
  ```
  JWT_SECRET=your-secret-key-change-in-production
  JWT_EXPIRES_IN=1h
  REFRESH_TOKEN_SECRET=your-refresh-secret-key-change-in-production
  REFRESH_TOKEN_EXPIRES_IN=7d
  ```

## Usage

### Login Endpoint

**POST** `/auth/login`

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

### Protected Routes

To protect routes with JWT authentication:

```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@CurrentUser() user: UserEntity) {
  return user;
}
```

## Tokens

- **Access Token**: Valid for 1 hour (configurable via JWT_EXPIRES_IN)
- **Refresh Token**: Valid for 7 days (configurable via REFRESH_TOKEN_EXPIRES_IN)
- Both tokens use different secrets for security

The implementation is complete and compiles successfully!
