"use strict";

const db = require("../db");
const {
  BadRequestError,
  NotFoundError,
  ExpressError,
} = require("../expressError");
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

  // TODO: Find companies matching filter.

  /**
   * Find companies given param filter.
   * @param {Array} filter Used to filter companies.
   * @return Companies that meet filter criteria.
   */

  // static async filter(filters) {
  //   console.log(filters);

  //   const validFilters = [
  //     "minEmployees",
  //     "maxEmployees",
  //     "nameLike"
  //   ];

  //   const cols = Object.keys(filters)

  //   // Validation
  //   for(let i = 0; i < cols.length; i++){
  //     if(!(validFilters.includes(cols[i]))){
  //       throw new ExpressError(`${cols[i]} not in valid filters`, 400)
  //     }
  //   }


  //   // console.log(cols)

  //   // cols.forEach(col => {
  //   //   switch(col) {
  //   //     case 'minEmployees':
  //   //       console.log('has min employees');
  //   //       break;
  //   //     case 'maxEmployees':
  //   //       console.log('has max employees');
  //   //       break;
  //   //     case 'nameLike':
  //   //       console.log('has name like');
  //   //       break;
  //   //   }
  //   // });

  //   let query = 'SELECT * FROM companies WHERE 1=1';
  //   const params = [];
    
  //   if (filters.minEmployees !== undefined) {
  //     query += ' AND num_employees >= ?';
  //     params.push(filters.minEmployees);
  //   }
    
  //   if (filters.maxEmployees !== undefined) {
  //     query += ' AND num_employees <= ?';
  //     params.push(filters.maxEmployees);
  //   }
    
  //   if (filters.nameLike !== undefined) {
  //     query += ' AND name LIKE ?';
  //     params.push(`%${filters.nameLike}%`);
  //   }
    
  //   const companies = await db.query(query, params);
    
    
    

    



    // const companies = await db.query(
    //   `SELECT handle,
    //               name,
    //               description,
    //               num_employees AS "numEmployees",
    //               logo_url AS "logoUrl"
    //        FROM companies
    //        WHERE num_employees>=${filters[minEmployees]} AND num_employees<=${filters[maxEmployees]}
    //        AND name LIKE ${filters[nameLike]}
    //        ORDER BY name`);

  

    static async getCompanies(nameLike, minEmployees, maxEmployees) {
      // Construct base query
      let query = 'SELECT * FROM companies WHERE 1=1';
  
      const params = [];
  
      // Define an object to map parameter names to their positions in the query
      const paramMapping = {
          minEmployees: { name: 'num_employees', operator: '>=' },
          maxEmployees: { name: 'num_employees', operator: '<=' },
          nameLike: { name: 'name', operator: 'ILIKE' }
      };
  
      // Iterate over parameters and add conditions to the query and parameters array
      Object.keys(paramMapping).forEach((param, index) => {
          const paramInfo = paramMapping[param];
          const value = eval(param); // Dynamically access parameter value
          
          if (value !== undefined) {
              if(paramInfo.name === 'name') {
                  query += ` AND ${paramInfo.name} ${paramInfo.operator} $${params.length + 1}`;
                  params.push(`%${value}%`); // Add wildcard for ILIKE comparison
              } else {
                  query += ` AND ${paramInfo.name} ${paramInfo.operator} $${params.length + 1}`;
                  params.push(value);
              }
          }
      });
  
      try {
          // Execute the query with parameters
          const companies = await db.query(query, params);
          return companies.rows;
      } catch (error) {
          throw new Error(`Error executing query: ${error.message}`);
      }
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

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
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
