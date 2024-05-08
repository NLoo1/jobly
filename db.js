"use strict";
/** Database setup for jobly. */
const { Client } = require("pg");
const { DB_USERNAME, DB_PASSWORD, DB_URI, PORT } = require("./config");

let db;

console.log("PORT")
console.log(PORT)

db = new Client({

  user: DB_USERNAME,
  host: 'localhost',
  password: DB_PASSWORD,
  database: DB_URI
});

db.connect();

module.exports = db;