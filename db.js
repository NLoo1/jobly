"use strict";
/** Database setup for jobly. */
const { Client } = require("pg");
const { DB_USERNAME, DB_PASSWORD, DB_URI } = require("./config");

let db;

if (process.env.NODE_ENV === "production") {
  db = new Client({

    user: DB_USERNAME,
    host: 'localhost',
    password: DB_PASSWORD,
    database: DB_URI,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  db = new Client({
    user: DB_USERNAME,
    host: 'localhost',
    password: DB_PASSWORD,
    database: DB_URI,
  });
}

const client = new Client({
  user: DB_USERNAME,
  host: 'localhost',
  password: DB_PASSWORD,
  database: DB_URI,
});

db.connect();

module.exports = db;