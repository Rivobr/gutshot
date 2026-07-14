import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN,
  adminSecret: process.env.JWT_ADMIN_SECRET,
  adminExpiresIn: process.env.JWT_ADMIN_EXPIRES_IN,
}));
