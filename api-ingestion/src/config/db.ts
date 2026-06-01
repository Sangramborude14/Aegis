import pg from 'pg';

const {Pool} = pg;

export const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'aegis_user',
    password: process.env.DB_PASSWORD ||'aegis_password',
    database: process.env.DB_NAME || 'aegis_analytics',
});

pool.query('SELECT NOW()', (err,res) => {
    if(err){
        console.error('PostgreSQL Connection Error:',err);
    }else{
        console.log(`PostgreSQL connection successful`)
    }
})