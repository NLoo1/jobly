const { BadRequestError } = require("../expressError");

/**
* Takes updated data and JSON to return new JSON containing updated values.
* Used to create a partial SQL update.
*
* @param {Object} dataToUpdate JSON object containing updated data
* @param {Object} jsToSql Takes JSON object of columns to update
* @returns {Object} JSON with String of new cols to set/update and updated data values.
*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {

  // In dataToUpdate, get the keys.
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");


  // Using keys, cols is a map of dataToUpdate.
  // The key is named using matching keys in jsToSql.
  // If jsToSql does not have colName, default to standard colName

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );


  // {
  //   setCols: '"first_name"=$1, "last_name"=$2, "age"=$3, "email"=$4',
  //   values: ['John', 'Doe', 30, 'john.doe@example.com']
  // }
  
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
