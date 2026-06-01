import { redis } from '../config/redis.js'

const rateLimitLua = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGv[1])
local limit = tonumber(ARGV[3])
local clearBefore = now - window

-- Remove timestamps older than the sliding window
redis.call('ZRMRANGEBYSCORE', key, 0, clearBefore)

-- Get current request count in the window
local currentRequests = redis.call('ZCARD', key)

if currentRequests < limit then
    --Log the current request
    redis.call('ZADD', key, now, now)
    --Keep the key alive for at least the window duration
    redis.call('EXPIRE', key, math.cell(window / 1000))
    return 1 --Allowed
else
    return 0 -- Rate Limited
end
`;  

redis.defineCommand('slidingRateLimit',{
    numberOfKeys: 1,
    lua: rateLimitLua,
})
declare module 'ioredis'{
    interface Redis {
        slidingRateLimit(key: string, now: number, window: number, limit: number): Promise<number>;
    }
}

export {redis};