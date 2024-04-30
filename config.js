"use strict";

/** Shared config for application; can be required many places. */

const dotenvConfig = { path: process.env.NODE_ENV ? ".env." + process.env.NODE_ENV : ".env" }
require("dotenv").config(dotenvConfig)
require("colors");

const SECRET_KEY = process.env.SECRET_KEY || "secret-dev";

const DB_USERNAME = process.env.DB_USERNAME
const DB_PASSWORD = process.env.DB_PASSWORD 
const DB_URI = process.env.DATABASE_URL
const PORT = +process.env.PORT || 3001;


// Use dev database, testing database, or via env var, production database
// function getDatabaseUri() {
//   return (process.env.NODE_ENV === "test")
//       ? "postgresql:///jobly_test"
//       : process.env.DATABASE_URL || "postgresql:///jobly";
// }

// Speed up bcrypt during tests, since the algorithm safety isn't being tested
//
// WJB: Evaluate in 2021 if this should be increased to 13 for non-test use
const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 12;

console.log("Jobly Config:".green);
console.log("SECRET_KEY:".yellow, SECRET_KEY);
console.log("PORT:".yellow, PORT.toString());
console.log("BCRYPT_WORK_FACTOR".yellow, BCRYPT_WORK_FACTOR);
console.log("Database:".yellow, DB_URI);
console.log("---");

module.exports = {
  SECRET_KEY,
  PORT,
  BCRYPT_WORK_FACTOR,
  DB_USERNAME,
  DB_PASSWORD,
  DB_URI
};
