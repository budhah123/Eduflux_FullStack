import { registerAs } from '@nestjs/config';
import { UPLOAD_CONFIG_NAME } from '../constants';

export default registerAs(UPLOAD_CONFIG_NAME, () => ({
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER ?? 'eduflux/docs',
  },
}));
