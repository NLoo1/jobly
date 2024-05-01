"use strict";
/** Database setup for jobly. */
const { Client } = require("pg");
const { DB_USERNAME, DB_PASSWORD, DB_URI } = require("./config");

let db;

db = new Client({

  user: DB_USERNAME,
  host: 'localhost',
  password: DB_PASSWORD,
  database: DB_URI
});


db.connect();

module.exports = db;