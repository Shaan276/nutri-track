const { newDb } = require("pg-mem");

const db = newDb();
db.public.none(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  INSERT INTO users (id, name, email, username, password_hash)
  VALUES ('cuid_1', 'Piyush Sharma', 'piyush@example.com', 'piyush', 'hashed_pw');
`);

const users = db.public.many("SELECT * FROM users");
console.log("pg-mem users count:", users.length, users[0].email);
