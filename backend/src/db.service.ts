import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DbService {
  private pool = new Pool({
    process.env.DB_HOST
    process.env.DB_USER   
    process.env.DB_PASSWORD 
    process.env.DB_NAME
  });

  query(sql: string, params: unknown[] = []) {
    return this.pool.query(sql, params);
  }
}
