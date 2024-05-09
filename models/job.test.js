require("dotenv").config({ path: "../.env.test" });
("use strict");

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError.js");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("create", function () {
  const newJob = {
    title: "testjob",
    salary: 123,
    equity: 0,
    company_handle: "c1",
  };

  it("works", async () => {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      company_handle: "c1",
      equity: "0",
      id: 4,
      salary: 123,
      title: "testjob",
    });
  });

  const dupe = {
    title: "test",
    salary: 123,
    equity: 0,
    company_handle: "c1",
  };

  it("fails duplicate check", async () => {
    try {
      await Job.create(dupe);
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

describe("findAll", () => {
  test("finds all", async () => {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      { title: "test", salary: 123, equity: "0", companyHandle: "c1" },
      { title: "test2", salary: 456, equity: "0.1", companyHandle: "c2" },
      { title: "test3", salary: 789, equity: "0.2", companyHandle: "c3" },
    ]);
  });
});

describe("getJobs", () => {

  test("gets jobs: no filter", async () => {
    let jobs = await Job.getJobs();
    expect(jobs).toEqual([
      { company_handle: "c1", equity: "0", id: 1, salary: 123, title: "test" },
      {
        company_handle: "c2",
        equity: "0.1",
        id: 2,
        salary: 456,
        title: "test2",
      },
      {
        company_handle: "c3",
        equity: "0.2",
        id: 3,
        salary: 789,
        title: "test3",
      },
    ]);
  });

  test("gets jobs: title like", async () => {
    let jobs = await Job.getJobs("test", undefined, undefined, undefined);
    expect(jobs).toEqual([
      { company_handle: "c1", equity: "0", id: 1, salary: 123, title: "test" },
      {
        company_handle: "c2",
        equity: "0.1",
        id: 2,
        salary: 456,
        title: "test2",
      },
      {
        company_handle: "c3",
        equity: "0.2",
        id: 3,
        salary: 789,
        title: "test3",
      },
    ]);
  });

  test("gets jobs: title like", async () => {
    let jobs = await Job.getJobs(undefined, "c", undefined, undefined);
    expect(jobs).toEqual([
      { company_handle: "c1", equity: "0", id: 1, salary: 123, title: "test" },
      {
        company_handle: "c2",
        equity: "0.1",
        id: 2,
        salary: 456,
        title: "test2",
      },
      {
        company_handle: "c3",
        equity: "0.2",
        id: 3,
        salary: 789,
        title: "test3",
      },
    ]);
  });

  test("gets jobs: min salary", async () => {
    let jobs = await Job.getJobs(undefined, undefined, 700, undefined);
    expect(jobs).toEqual([
      {
        company_handle: "c3",
        equity: "0.2",
        id: 3,
        salary: 789,
        title: "test3",
      },
    ]);
  });

  test("gets jobs: has equity", async () => {
    let jobs = await Job.getJobs(undefined, undefined, undefined, true);
    expect(jobs).toEqual([
      {
        company_handle: "c2",
        equity: "0.1",
        id: 2,
        salary: 456,
        title: "test2",
      },
      {
        company_handle: "c3",
        equity: "0.2",
        id: 3,
        salary: 789,
        title: "test3",
      }
    ]);
  });




});

describe("get", () => {
  it("works", async () => {
    let job = await Job.get(1);
    expect(job).toEqual({
      title: "test",
      salary: 123,
      equity: "0",
      companyHandle: "c1",
    });
  });

  it("fails for nonexistent job", async () => {
    try {
      await Job.get(123213213);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});


describe('update', () => {

  const updateData = {
    title: "test", 
    salary: 1234567, 
    equity: 0.9, 
    company_handle: "c1"
  }
  test('works', async () => {
    let job = await Job.update(1, updateData)
    expect(job).toEqual({"companyHandle": "c1", "equity": "0.9", "salary": 1234567, "title": "test"})
  })
  
  test('fails if job not found', async () => {
    try {
      await Job.update(124, updateData);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  })

})

describe('delete', () =>{
  test('works', async () => {
    let job = await Job.remove(1)
    expect(job).toBeUndefined()

  })  
  test('fails for nonexistent job', async () => {
    try {
      await Job.remove(124);
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  })  
})
