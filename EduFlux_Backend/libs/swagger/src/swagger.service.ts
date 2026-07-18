import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export class SwaggerService {
  static setup(app: INestApplication): void {
    const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
    const googleCallbackUrl =
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3000/auth/google/callback';

    // Admin API Documentation
    const adminConfig = new DocumentBuilder()
      .setTitle('Assignment Access System - Admin API')
      .setDescription(
        'Admin API documentation for Assignment Access System - Manage assignments, submissions, access control, and user administration',
      )
      .setVersion('1.0')
      .addTag('Admin Auth', 'Admin authentication endpoints')
      .addTag('Admin User Management', 'Admin user management endpoints')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    // Regular API Documentation
    const regularConfig = new DocumentBuilder()
      .setTitle('Assignment Access System API')
      .setDescription(
        'API documentation for Assignment Access System - Manage assignments, submissions, and access control',
      )
      .setVersion('1.0')
      .addTag('Auth', 'Authentication endpoints')
      .addTag('User', 'User management endpoints')
      .addTag('Assignments', 'Assignment management endpoints')
      .addTag('Submissions', 'Submission management endpoints')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addOAuth2(
        {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
              tokenUrl: 'https://oauth2.googleapis.com/token',
              scopes: {
                email: 'Access your email address',
                profile: 'Access your profile information',
              },
            },
          },
        },
        'Google-OAuth',
      )
      .build();

    // Create admin document - includes only admin controllers
    const adminDocument = SwaggerModule.createDocument(app, adminConfig, {
      ignoreGlobalPrefix: false,
    });

    // Filter admin document to only include admin routes
    if (adminDocument.paths) {
      const adminPaths = {};
      Object.keys(adminDocument.paths).forEach((path) => {
        if (path.startsWith('/admin/')) {
          adminPaths[path] = adminDocument.paths[path];
        }
      });
      adminDocument.paths = adminPaths;
    }

    // Create regular document
    const regularDocument = SwaggerModule.createDocument(app, regularConfig, {
      ignoreGlobalPrefix: false,
    });

    // Filter regular document to exclude admin routes
    if (regularDocument.paths) {
      const regularPaths = {};
      Object.keys(regularDocument.paths).forEach((path) => {
        if (!path.startsWith('/admin/')) {
          regularPaths[path] = regularDocument.paths[path];
        }
      });
      regularDocument.paths = regularPaths;
    }

    // Setup regular API documentation
    SwaggerModule.setup('docs', app, regularDocument, {
      customSiteTitle: 'Assignment Access System API',
      customfavIcon: 'https://nestjs.com/img/logo_text.svg',
      swaggerOptions: {
        persistAuthorization: true,
        oauth: {
          clientId: googleClientId,
          appName: 'Assignment Access System',
          scopes: ['email', 'profile'],
        },
      },
    });

    // Setup admin API documentation
    SwaggerModule.setup('admin/docs', app, adminDocument, {
      customSiteTitle: 'Assignment Access System API - Admin',
      customfavIcon: 'https://nestjs.com/img/logo_text.svg',
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }
}
