"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { title, salary, equity, company_handle }
   *
   * Throws BadRequestError if job already in database.
   * */

  static async create({ title, salary, equity, company_handle }) {
    const duplicateCheck = await db.query(
          `SELECT title, company_handle
           FROM jobs
           WHERE title = $1 AND company_handle=$2`,
        [title, company_handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate job: ${title}, ${company_handle}`);

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING title, salary, equity, company_handle`,
        [
            title, salary, equity, company_handle
        ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ title, salary, equity, company_handle}, ...]
   * */

  static async findAll() {
    const jobsRes = await db.query(
          `SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           ORDER BY company_handle`);
    return jobsRes.rows;
  }

  /** Get jobs based on query parameters.
   *
   * Returns [{ title, salary, equity, company_handle }, ...]
   * */

  static async getJobs(titleLike, companyLike, minSalary, hasEquity) {

    let query = 'SELECT * FROM jobs WHERE 1=1';

    const params = [];

    // Map possible params
    const paramMapping = {
        titleLike: { name: 'title', operator: 'ILIKE' },
        companyLike: { name: 'company_handle', operator: 'ILIKE' },
        minSalary: { name: 'salary', operator: '>=' },
        hasEquity: {name: 'equity', operator: (hasEquity ? '>' : '>='), value: (hasEquity ? 0 : null)}
    };

    // Go through params to add conditions to query and push to params array
    Object.keys(paramMapping).forEach(param => {
      const paramInfo = paramMapping[param];
      let value;
  
      if (param === 'titleLike') {
          value = titleLike;
      } else if (param === 'companyLike') {
          value = companyLike;
      } else {
          value = (param === 'minSalary') ? minSalary : hasEquity;
      }
  
      // If values are defined and not null, they can be pushed to query and params
      if (value !== undefined && value !== null) {
        // hasEquity is treated different as a boolean
          if (param === 'hasEquity') {
              if (value === 'true') {
                  query += ` AND ${paramInfo.name} ${paramInfo.operator} $${params.length + 1}`;
                  params.push(paramInfo.value);
              }
          } else {
              query += ` AND ${paramInfo.name} ${paramInfo.operator} $${params.length + 1}`;
              params.push((paramInfo.operator === 'ILIKE') ? `%${value}%` : value);
          }
      }
  });
  

    // Fetch relevant jobs
    try {
        const jobs = await db.query(query, params);
        return jobs.rows;
    } catch (error) {
        throw new Error(`Error executing query: ${error.message}`);
    }
}


  /** Given a job id, return data about job.
   *
   * Returns { title, salary, equity, company_handle }
   * 
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${title}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity, company_handle}
   *
   * Returns {title, salary, equity, company_handle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {

    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          title: "title", 
          salary: "salary", 
          equity: "equity", 
          company_handle: "company_handle"
        });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE jobs = ${idVarIdx} 
                      RETURNING title, salary, equity, company_handle AS "companyHandle"
                      `
    const result = await db.query(querySql, [...values, handle]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING title`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);
  }
}


module.exports = Job;
