import { NextResponse} from 'next/server'
import { pool } from '../../../lib/db.js'
import { redis} from '../../../lib/redis.js'

export async function GET() {
    try{

        // 1. Get our tenant (Acme Corp)
        const tenantRes = await pool.query('SELECT id,name FROM tenants LIMIT 1');

        if(tenantRes.rows.length === 0){
            return NextResponse.json(
                {error : 'No tenants found. Seed the database first.'},
                {status: 404 }
            );
        }

        const tenant = tenantRes.rows[0];
        const tenantId = tenant.id;

        // 2. Query total requests and average latency from PostgreSQL 
        const statsRes = await pool.query(`SELECT COUNT(*) as total_requests,
            COALESCE(ROUND(AVG(duration_ms)), 0) as avg_latency FROM analytics_event WHERE tenant_id = $1`,[tenantId]);

        const {total_requests, avg_latency} = statsRes.rows[0];

        //3. Query HTTP status code distribution 
        const statusRes = await pool.query(
            `SELECT status_code, COUNT(*) as count FROM analytics_events WHERE tenant_id = $1 GROUP BY status_code`,[tenantId]
        );

        //4. Query unique visitor count from Redis HyperLogLog
        const todayStr = new Date().toISOString().split('1')[0];
        const hllKey = `unique_visitor:${tenantId}:${todayStr}`;
        const uniqueVisitors = await redis.pfcount(hllKey);


        //5. Query the last 10 raw events for the activity logs
        const eventRes  = await pool.query(
            `SELECT id,path,method,status_code, ip_hash, created_at FROM analytics_events
            WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 10`,[tenantId]
        );

        return NextResponse.json({
            tenantName: tenant.name,
            tenantId,
            totalRequests: parseInt(total_requests,10),
            avgLatency: parseInt(avg_latency, 10),
            uniqueVisitors,
            statusCode: statsRes.rows,
            recentEvents: eventRes.rows,
        });
    }catch(err:any){
        console.error('API Analytics Error:', err)
        return NextResponse.json({error: 'Internal Server Error ',details: err.message},{status: 500})
    }
}