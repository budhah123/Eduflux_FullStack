export function validateEnv() {
  const required = [
    'FRONTEND_URL',
    'MONGO_URI',
    'DB_NAME',
    'ACCESS_TOKEN_SECRET',
    'REFRESH_TOKEN_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'KHALTI_SECRET_KEY',
    'KHALTI_VERIFY_URL',
    'ESEWA_MERCHANT_CODE',
    'ESEWA_SECRET_KEY',
    'ESEWA_VERIFY_URL',
    'GROQ_API_KEY',
    'GROQ_CHAT_MODEL',
    'INSTITUTIONAL_EMAIL_DOMAINS',
    'MAIL_USER',
    'MAIL_PASSWORD',
  ];

  if (process.env.SWAGGER_ENABLED === 'true') {
    required.push('SWAGGER_USER', 'SWAGGER_PASSWORD');
  }

  const missing = required.filter(
    (key) => !process.env[key] || process.env[key]?.trim() === '',
  );

  if (missing.length > 0) {
    throw new Error(
      `[Startup Error] Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  const frontendUrl = process.env.FRONTEND_URL?.trim() || '';
  if (!/^https?:\/\//i.test(frontendUrl)) {
    throw new Error(
      `[Startup Error] FRONTEND_URL must start with http:// or https:// (received: "${frontendUrl}")`,
    );
  }

  const khaltiVerifyUrl = process.env.KHALTI_VERIFY_URL?.trim() || '';
  if (!/^https?:\/\//i.test(khaltiVerifyUrl)) {
    throw new Error(
      `[Startup Error] KHALTI_VERIFY_URL must start with http:// or https:// (received: "${khaltiVerifyUrl}")`,
    );
  }

  const esewaVerifyUrl = process.env.ESEWA_VERIFY_URL?.trim() || '';
  if (!/^https?:\/\//i.test(esewaVerifyUrl)) {
    throw new Error(
      `[Startup Error] ESEWA_VERIFY_URL must start with http:// or https:// (received: "${esewaVerifyUrl}")`,
    );
  }

  const mongoUri = process.env.MONGO_URI?.trim() || '';
  if (!/^mongodb(\+srv)?:\/\//i.test(mongoUri)) {
    throw new Error(
      `[Startup Error] MONGO_URI must start with mongodb:// or mongodb+srv://`,
    );
  }
}
