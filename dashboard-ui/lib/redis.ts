import { Redis} from 'ioredis';

const gloalForRedis = globalThis as unknown as {
    redisClient: Redis | undefined;
}

export const redis = gloalForRedis.redisClient ?? new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
})

if(process.env.NODE_ENV !== 'production') gloalForRedis.redisClient = redis;