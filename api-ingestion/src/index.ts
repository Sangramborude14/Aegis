import Fastify from "fastify";
import { aegisMiddleware } from "./middleware/aegisMiddleware.js";

//Turn on High Performance Logger
const fastify = Fastify({
    logger: true,
})

//1. Health Check route
fastify.get('/health', async () => {
    return { status: 'healthy', timestamp: new Date().toISOString()};
})

// 2. Protected Gateway Routes

//isolated sandbox
fastify.register((instance, opts, done) => {

    instance.addHook('preHandler', aegisMiddleware);
    instance.get('/v1/data', async (request,reply) => {
        return {
            message: `Access granted to Aegis protected resource!`,
            tenantId: request.headers['x-tenant-id'],
            timeStamp: new Date().toISOString(),
        }
    })
    done();
},{ prefix: '/api'})


//starting Fastify server
const port = parseInt(process.env.PORT || '3000', 10);
const start = async () => {
    try{
        await fastify.listen({port, host: '0.0.0.0'});
        console.log(`Ingestion API running on http://localhost:${port}`);
    }catch(err){
        fastify.log.error(err);
        process.exit(1);
    }
}
start();