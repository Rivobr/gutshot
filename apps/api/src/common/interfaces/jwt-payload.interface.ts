export interface JwtPayload {
  sub: string;
  telegramId: string;
}

export interface AdminJwtPayload {
  sub: string;
  email: string;
  role: string;
}
