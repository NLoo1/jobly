require("dotenv").config({ path: "../.env.test" });

("use strict");

const request = require("supertest");

const db = require("../db");
const app = require("../app");
const Job = require("../models/job");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("/GET jobs by id", () => {
  it("should get a job by id", async () => {
    const resp = await request(app).get(`/jobs/1`);
    expect(resp.body).toEqual({
      job: { companyHandle: "c1", equity: "0", salary: 123, title: "test" },
    });
  });

  it("should throw error if job not found", async () => {
    const resp = await request(app).get(`/jobs/1234567`);
    expect(resp.statusCode).toBe(404);
    expect(resp.body).toEqual({
      error: { message: "No job with 1234567", status: 404 },
    });
  });
});

describe("/GET all jobs", () => {
  it("should get all jobs", async () => {
    const resp = await request(app).get(`/jobs`);
    expect(resp.statusCode).toBe(200);
    expect(resp.body).toEqual([
      { company_handle: "c1", equity: "0", id: 1, salary: 123, title: "test" },
      { company_handle: "c1", equity: "0", id: 2, salary: 123, title: "test2" },
      { company_handle: "c3", equity: "0", id: 3, salary: 123, title: "test" },
    ]);
  });
});

describe("/PATCH jobs", () => {
  it("should patch a job", async () => {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .set("authorization", `Bearer ${u1Token}`)
      .send({
        title: "testpatch",
      });
    expect(resp.body).toEqual({
      job: {
        companyHandle: "c1",
        equity: "0",
        salary: 123,
        title: "testpatch",
      },
    });
  });
  it('should fail to patch with no token', async () => {
    const resp = await request(app)
      .patch(`/jobs/1`)
      .send({
        title: "testpatch",
      });
    expect(resp.statusCode).toBe(401)
  })

  it('should fail to patch if no job found', async () => {
    const resp = await request(app)
      .patch(`/jobs/123123211`)
      .set("authorization", `Bearer ${u1Token}`)
      .send({
        title: "testpatch",
      });
    expect(resp.statusCode).toBe(404)
  })
});

describe('/DELETE jobs', () => {
  it('should delete a job', async () => {
    const resp = await request(app)
    .delete(`/jobs/1`)
    .set("authorization", `Bearer ${u1Token}`)
    expect(resp.body).toEqual({deleted: "1"})
  })

  it('should not delete job without admin', async () => {
    const resp = await request(app)
    .delete(`/jobs/1`)
    expect(resp.statusCode).toBe(401)
  })

  it('should not delete job not found', async () => {
    const resp = await request(app)
    .delete(`/jobs/1123213213123`)
    expect(resp.statusCode).toBe(401)
  })
})