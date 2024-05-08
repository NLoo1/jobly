"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [handle, name, description, numEmployees, logoUrl]
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`
    );
    return companiesRes.rows;
  }

  /** Get companies based on query parameters.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async getCompanies(nameLike, minEmployees, maxEmployees) {
    // Base query
    // While this query can be dangerous by itself, parameter mapping negates this risk
    let query = "SELECT * FROM companies WHERE 1=1";

    const params = [];

    // Map possible params
    const paramMapping = {
      minEmployees: { name: "num_employees", operator: ">=" },
      maxEmployees: { name: "num_employees", operator: "<=" },
      nameLike: { name: "name", operator: "ILIKE" },
    };

    // Go through params to add conditions to query and push to params array
    Object.keys(paramMapping).forEach((param, index) => {
      const paramInfo = paramMapping[param];
      const value = eval(param);

      // If query params were passed properly
      if (value !== undefined) {
        // Name is treated differently here as a string
        if (paramInfo.name === "name") {
          query += ` AND ${paramInfo.name} ${paramInfo.operator} $${
            params.length + 1
          }`;
          params.push(`%${value}%`); // Add wildcard for ILIKE comparison
        } else {
          query += ` AND ${paramInfo.name} ${paramInfo.operator} $${
            params.length + 1
          }`;
          params.push(value);
        }
      }
    });

    // Fetch relevant companies
    try {
      const companies = await db.query(query, params);
      return companies.rows;
    } catch (error) {
      throw new Error(`Error executing query: ${error.message}`);
    }
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(`
    SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"
    FROM companies
    WHERE handle = $1`, [handle])
    const jobRes = await db.query(`
    SELECT id, title, salary, equity, company_handle AS "companyHandle" FROM jobs WHERE company_handle = $1`, [handle])
    const company = companyRes.rows[0]
    const jobs = jobRes.rows
    console.log(jobs)

    if (!company) throw new NotFoundError(`No company: ${handle}`, 400);
    return {company, jobs};
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]
    );
    const company = result.rows[0];
    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}

module.exports = Company;
