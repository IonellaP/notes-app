
import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { createToken } from './auth';
import { DbService } from './db.service';
import * as bcrypt from 'bcryptjs';

@Controller('auth')
  export class AuthController {
  constructor(private db: DbService) {}

  @Post('register')
  async register(
    @Body() body: { username: string; password: string },
  ) {
    const { username, password } = body;

    if (!username?.trim() || !password) {
      throw new BadRequestException(
        'Completează utilizatorul și parola',
      );
    }

    // Minimum 12 caractere
    if (password.length < 12) {
      throw new BadRequestException(
        'Parola trebuie să conțină minimum 12 caractere',
      );
    }

    // Cel puțin o literă mare și una mică
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
      throw new BadRequestException(
        'Parola trebuie să conțină o literă mare și una mică',
      );
    }

    // Hash-uim parola înainte de salvare
    const hash = await bcrypt.hash(password, 10);

    try {
      const result = await this.db.query(
        `INSERT INTO users (username, password)
         VALUES ($1, $2)
         RETURNING id, username`,
        [username.trim(), hash],
      );

      const user = result.rows[0];

      return {
        token: createToken(user),
        username: user.username,
      };
    } catch (error) {
      if (error?.code === '23505') {
        throw new BadRequestException(
          'Utilizatorul există deja',
        );
      }

      throw error;
    }
  }

  // Maximum 5 încercări în 5 minute
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @Post('login')
  async login(
    @Body() body: { username: string; password: string },
  ) {
    const { username, password } = body;

    if (!username || !password) {
      throw new BadRequestException(
        'Completează utilizatorul și parola',
      );
    }

    // Interogare SQL parametrizată
    const result = await this.db.query(
      `SELECT id, username, password
       FROM users
       WHERE username = $1`,
      [username],
    );

    const user = result.rows[0];

    if (
      !user ||
      !(await bcrypt.compare(password, user.password))
    ) {
      throw new UnauthorizedException(
        'Utilizator sau parolă greșită',
      );
    }

    return {
      token: createToken(user),
      username: user.username,
    };
  }
}
