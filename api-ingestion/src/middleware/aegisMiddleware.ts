import { FastifyRequest , FastifyReply,} from 'fastify';
import crypto from 'crypto';
import { pool } from '../config/db.js';
import { redis} from "../scripts/rateLimiter.js"


interface Tenant {
    id: string;
    name: string;
    api_key_hash: string;
    rate_limit_rpm: number;
}

function hashApiKey(key: string): string{
return crypto.createHash('sha256').update(key).digest('hex');
}

async function getTenant(apiKeyHash: string): Promise<Tenant | null>{
const cacheKey = `tenant:${apiKeyHash}`

//1. check redis query
const cached = await redis.get(cacheKey);
if(cached) return JSON.parse(cached);

//2. Query Postgres
const result = await pool.query(
    'SELECT id,name, api_key_hash, rate_limit_rpm FROM tenants WHERE api_key_hash = $1',
    [apiKeyHash]
)

if(result.rows.length === 0) return null;
const tenant: Tenant = result.rows[0];

//3. Cache redis for 5 minutes
await redis.set(cacheKey, JSON.stringify(tenant),'EX',300);
return tenant;
}

export const aegisMiddleware: any = async (
    request: FastifyRequest,reply: FastifyReply
) => {
    const apiKey = request.headers['x-api-key'] as string;

    if(!apiKey){
        return reply.status(401).send({error: `Unauthorized missing API key`});
    }

    const apiKeyHash = hashApiKey(apiKey);
    const tenant = await getTenant(apiKeyHash);

    if(!tenant){
        return reply.status(401).send({error: `Unauthorized: Invalid API key`})
    }

    //attach tenant info to request context
    request.headers['x-tenant-id'] = tenant.id;

    const now = Date.now();
    const rateLimitKey = `rate_limit:${tenant.id}`
    const windowMs = 60000;

    //1. evalute rat limit atomically
    const allowed = await redis.slidingRateLimit(
        rateLimitKey,
        now,
        windowMs,
        tenant.rate_limit_rpm
    );

    if(allowed === 0){
        return reply.status(429).send({error: `Too Many Requests`});
    }

    //2. Track Unique Visitor via HyperLogLog
    const todayStr = new Date().toISOString().split('T')[0];
    const hllKey = `unique_visitor:${tenant.id}:${todayStr}`;

    const ipHash = crypto.createHash('md5').update(request.ip).digest('hex');
        await redis.pfadd(hllKey, ipHash)

    //3. Stream Telemetry Event to Redis Stream
    const eventPayload = {
        tenantId: tenant.id,
        path: request.url,
        method: request.method,
        ipHash,
        timeStamp: now.toString(),
    }

    await redis.xadd('analytics_stream','*','event',JSON.stringify(eventPayload));
}