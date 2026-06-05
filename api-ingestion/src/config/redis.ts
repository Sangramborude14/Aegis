import { Redis } from 'ioredis';

export const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    maxRetriesPerRequest: null,
})

redis.on('connect', () => {
    console.log(`Redis connected Successfully`);
});

redis.on('error', (err: any) => {
    console.error('Redis Connection Error', err);
});