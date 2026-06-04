import pg from 'pg'

const {Pool} = pg;
const globalForDb = globalThis as unknown as {
    pgPool: pg.Pool | undefined;
}

export const pool = globalForDb.pgPool ??
new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433',10),
    user: process.env.DB_USER || 'aegis_user',
    password: process.env.DB_PASSWORD || 'aegis_password',
    database: process.env.DB_NAME || 'aegis_analytics',
})

if(process.env.NODE_ENV !== 'production') globalForDb.pgPool = pool;

