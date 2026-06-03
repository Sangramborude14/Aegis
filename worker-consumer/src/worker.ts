import {Redis} from 'ioredis'
import { parse } from 'path';
import pg from 'pg'

const {Pool} = pg;

//1. Database connection pool

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433', 10),
    user: process.env.DB_USER || 'aegis_user',
    password: process.env.DB_PASSWORD || 'aegis_password',
    database: process.env.DB_NAME || 'aegis_analytics',
})

//2. Redis connection client
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
});
console.log(`Worker started. Monitoring Redis Stream: "analytics_stream`)

//3. Main processing Loop
async function processStream(){
    let lastId = '0-0';

    while(true){
        try{
            const results = await redis.xread('COUNT', 2000, 'BLOCK', 100, 'STREAMS', 'analytics_stream', lastId);

            if(!results) {
                continue;
            }

            const [_streamName, messages] = results[0];
            if(messages.length === 0){
                continue;
            }

            console.log(`Processing batch of ${messages.length} events`)

            const values: any[] = [];
            const placeholders: string[] = [];
            const messageIdsToDelete: string[] = [];

            messages.forEach((msg: [string,string[]],index: number) => {
                const messageId = msg[0];
                const payloadStr = msg[1][1];

                const event = JSON.parse(payloadStr);
                messageIdsToDelete.push(messageId);
                lastId = messageId;

                const tenantId = event.tenantId;
                const path = event.path;
                const method = event.method;
                const statusCode = event.statusCode || 200;
                const ipHash = event.ipHash;
                const createdAt = new Date(parseInt(event.timestamp || Date.now().toString(), 10))
                const base = index * 6;
                placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`);

                values.push(tenantId,path,method,statusCode,ipHash,createdAt);


         

            });

                   //4. Bulk insertion into PostgreSQL
                const query = `INSERT INTO analytics_events (tenant_id, path, method, status_code, ip_hash, created_at) VALUES ${placeholders.join(', ')}`;
                await pool.query(query,values)

                console.log(`Successfully bulk-inserted ${messages.length} events into PostgreSQL`);

                //5. Delete processed messages from the Redis Stream to conserve RAM
                await redis.xdel('analytics_stream', ...messageIdsToDelete);
        }catch(err){
            console.error(`Error in worker processing loop`, err);

            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }


}
processStream().catch((err) => {
    console.error(`Fatal worker error`,err)
    process.exit(1)
})