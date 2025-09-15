import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const cookieName = 'celbridge_token';

export async function hashPassword(pw) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pw, salt);
}
export function comparePassword(pw, hash) {
  return bcrypt.compare(pw, hash);
}

export function signCookie(user) {
  const token = jwt.sign(
    { sub: user.id, email: user.email, displayName: user.displayName },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  const secure = process.env.NODE_ENV === 'production' ? ' Secure;' : '';
  return {
    header: cookieName,
    value: `${cookieName}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800;${secure}`
  };
}

export function clearCookie() {
  return {
    header: cookieName,
    value: `${cookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
  };
}

export function verifyTokenFromCookies(cookieHeader = '') {
  const token = (cookieHeader.split(';')
    .map(s => s.trim())
    .find(p => p.startsWith(cookieName + '=')) || '')
    .split('=')[1];
  if (!token) return null;
  try { return jwt.verify(token, process.env.JWT_SECRET); }
  catch { return null; }
}
