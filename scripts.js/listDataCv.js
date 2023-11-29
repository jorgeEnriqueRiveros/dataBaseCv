const { Pool } = require('pg');

const pool = new Pool({
    user: 'default',
    host: 'ep-polished-glitter-00374982-pooler.us-east-1.postgres.vercel-storage.com',
    database: 'verceldb',
    password: 'bUMx6Ir4dWch',
    port: 5432,
    ssl: {rejectUnauthorized: false}
});


const listCvQuery = `SELECT * FROM users;`;

pool.query(listCvQuery)
    .then(res => {
        console.log("Updated personnel resume list: ", res.rows);
        pool.end();
    })
    .catch(err => {
        console.error(err);
        pool.end();
    });