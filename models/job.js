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
           RETURNING id, title, salary, equity, company_handle`,
        [title, salary, equity, company_handle]
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

    // If hasEquity is the only parameter provided, handle it separately
    if (titleLike === undefined && companyLike === undefined && minSalary === undefined && hasEquity !== undefined) {
        query += ` AND equity ${hasEquity ? '>' : '='} 0`;
    } else {
        // Map possible params
        const paramMapping = {
            titleLike: { name: 'title', operator: 'ILIKE' },
            companyLike: { name: 'company_handle', operator: 'ILIKE' },
            minSalary: { name: 'salary', operator: '>=' }
        };

        // Add conditions to query and push params to array
        Object.keys(paramMapping).forEach(param => {
            const paramInfo = paramMapping[param];
            let value = (param === 'titleLike') ? titleLike : (param === 'companyLike') ? companyLike : minSalary;

            // If values are defined and not null, add them to query and params array
            if (value !== undefined && value !== null) {
                query += ` AND ${paramInfo.name} ${paramInfo.operator} $${params.length + 1}`;
                params.push((paramInfo.operator === 'ILIKE') ? `%${value}%` : value);
            }
        });
    }

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

    if (!job) throw new NotFoundError(`No job with ${id}`);

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
                      WHERE id = ${idVarIdx} 
                      RETURNING title, salary, equity, company_handle AS "companyHandle"
                      `
    const result = await db.query(querySql, [...values, id]);

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
