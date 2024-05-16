export interface JwtTokenPayload {
  userId: string;
  role: 'user' | 'admin';
}
