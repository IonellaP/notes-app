
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET lipsește sau este prea scurt');
}

export function createToken(user: { id: number; username: string }) {
  return jwt.sign(
    { sub: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '15m' },
  );
}

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const authorization = req.headers.authorization || '';

    if (!authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Trebuie să fii autentificat',
      );
    }

    const token = authorization.slice(7);

    try {
      req.user = jwt.verify(token, JWT_SECRET);
      return true;
    } catch {
      throw new UnauthorizedException(
        'Token invalid sau expirat',
      );
    }
  }
}
