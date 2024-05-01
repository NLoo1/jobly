const supertest = require("supertest");
const { sqlForPartialUpdate } = require("./sql");
const { json } = require("body-parser");
const { BadRequestError, ExpressError } = require("../expressError");

describe("Test SQL for partial update", function(){


  test("Returns JSON containing setCols and values", function(){
    let dataToUpdate = {
      "first_name": "John",
      "last_name": "Doe",
      "age": 34,
      "email": "john.doe@example.com"
    }

    let jsToSql = {
      firstName: 'first_name',
      lastName: 'last_name'
    };
    

    let test = sqlForPartialUpdate(dataToUpdate, jsToSql)

    expect(test).toEqual({
      setCols: '"first_name"=$1, "last_name"=$2, "age"=$3, "email"=$4',
      values: ['John', 'Doe', 34, 'john.doe@example.com']
    })
  })

  test("Throws error if no keys", function(){
    let dataToUpdate = {}
    let jsToSql = {
      firstName: 'first_name',
      lastName: 'last_name'
    };
    let test = () => {sqlForPartialUpdate(dataToUpdate, jsToSql)}
    expect(test).toThrow(new BadRequestError("No data"))
  })

  test("Returns without colNames in jsToSql", function() {
    let dataToUpdate = {
      "first_name": "John",
      "last_name": "Doe",
      "age": 34,
      "email": "john.doe@example.com"
    }
    let jsToSql = {}

    let test = sqlForPartialUpdate(dataToUpdate, jsToSql)

    expect(test).toEqual({
      setCols: '"first_name"=$1, "last_name"=$2, "age"=$3, "email"=$4',
      values: ['John', 'Doe', 34, 'john.doe@example.com']
    })
  })


  // NOTE: Function will works with bad data
  test("Processes bad data", function() {

    /* Will output 
    {
      setCols: '"0"=$1, "1"=$2, ... '
      values: {'b', 'a', 'd', ' ', 'd', 'a', 't', 'a'}
    }
    */
    let dataToUpdate = "bad data"


    let jsToSql = {
      firstName: 'first_name',
      lastName: 'last_name'
    };

    let test = () => {sqlForPartialUpdate(dataToUpdate, jsToSql)}

    expect(test).not.toThrow(ExpressError)
  })
})