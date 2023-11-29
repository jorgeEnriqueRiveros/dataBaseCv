const { Pool } = require('pg');

const pool = new Pool({
    user: 'default',
    host: "ep-polished-glitter-00374982-pooler.us-east-1.postgres.vercel-storage.com",
    database: 'verceldb',
    password: "bUMx6Ir4dWch",
    port: 5432,
    ssl: { rejectUnauthorized: false },
  });


  const createCvTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      document_number SERIAL PRIMARY KEY,
      full_name VARCHAR(100) NOT NULL,
      profession VARCHAR(50),
      studies TEXT,
      experience TEXT,
      cv TEXT
    );`;

pool.query(createCvTableQuery)
    .then(res => {
        console.log("Table created successfully.");
        pool.end();
    })
    .catch(err => {
        console.error('Error creating table:', err);
        pool.end();
    });