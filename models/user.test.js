require("dotenv").config({ path: "../.env.test" });

"use strict";

const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const db = require("../db.js");
const User = require("./user.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** authenticate */

describe("authenticate", function () {
  test("works", async function () {
    const user = await User.authenticate("u1", "password1");
    expect(user).toEqual({
      username: "u1",
      firstName: "U1F",
      lastName: "U1L",
      email: "u1@email.com",
      isAdmin: false,
    });
  });

  test("unauth if no such user", async function () {
    try {
      await User.authenticate("nope", "password");
    } catch (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    }
  });

  test("unauth if wrong password", async function () {
    try {
      await User.authenticate("c1", "wrong");
    } catch (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    }
  });
});

/************************************** register */

describe("register", function () {
  const newUser = {
    username: "new",
    firstName: "Test",
    lastName: "Tester",
    email: "test@test.com",
    isAdmin: false,
  };

  test("works", async function () {
    let user = await User.register({
      ...newUser,
      password: "password",
    });
    expect(user).toEqual(newUser);
    const found = await db.query("SELECT * FROM users WHERE username = 'new'");
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].is_admin).toEqual(false);
    expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
  });

  test("works: adds admin", async function () {
    let user = await User.register({
      ...newUser,
      password: "password",
      isAdmin: true,
    });
    expect(user).toEqual({ ...newUser, isAdmin: true });
    const found = await db.query("SELECT * FROM users WHERE username = 'new'");
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].is_admin).toEqual(true);
    expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
  });

  test("bad request with dup data", async function () {
    try {
      await User.register({
        ...newUser,
        password: "password",
      });
      await User.register({
        ...newUser,
        password: "password",
      });
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works", async function () {
    const users = await User.findAll();
    expect(users).toEqual([
      {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "u1@email.com",
        isAdmin: false,
      },
      {
        username: "u2",
        firstName: "U2F",
        lastName: "U2L",
        email: "u2@email.com",
        isAdmin: false,
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let user = await User.get("u1");
    expect(user).toEqual({
      username: "u1",
      firstName: "U1F",
      lastName: "U1L",
      email: "u1@email.com",
      isAdmin: false,
    });
  });

  test("not found if no such user", async function () {
    try {
      await User.get("nope");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    firstName: "NewF",
    lastName: "NewF",
    email: "new@email.com",
    isAdmin: true,
  };

  test("works", async function () {
    let job = await User.update("u1", updateData);
    expect(job).toEqual({
      username: "u1",
      ...updateData,
    });
  });

  test("works: set password", async function () {
    let job = await User.update("u1", {
      password: "new",
    });
    expect(job).toEqual({
      username: "u1",
      firstName: "U1F",
      lastName: "U1L",
      email: "u1@email.com",
      isAdmin: false,
    });
    const found = await db.query("SELECT * FROM users WHERE username = 'u1'");
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
  });

  test("not found if no such user", async function () {
    try {
      await User.update("nope", {
        firstName: "test",
      });
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request if no data", async function () {
    expect.assertions(1);
    try {
      await User.update("u1", {});
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await User.remove("u1");
    const res = await db.query(
        "SELECT * FROM users WHERE username='u1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such user", async function () {
    try {
      await User.remove("nope");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});


/********************************** applications */

describe('add app', () => {
  test('add app', async()=>{
    let jobApp = await User.addJobApp("u1", 1)
    expect(jobApp).toEqual({"job_id": 1, "username": "u1"})
  })
  test('failed to add app if wrong id', async ()=>{
    try {
      let jobApp = await User.addJobApp("u1", 123)
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  })
})

describe('get job app', () => {

  test('get job app', async() => {
    await User.addJobApp("u1", 1)
    let jobApp = await User.getJobApp("u1", 1)
    expect(jobApp).toEqual({"job_id": 1, "username": "u1"})
  })

  test('get users job apps', async() => {
    await User.addJobApp("u1", 1)
    let jobApp = await User.getAllJobApps("u1")
    expect(jobApp).toEqual([{"job_id": 1, "username": "u1"}])
  })

  test('get all users job apps', async() => {
    await User.addJobApp("u1", 1)
    await User.addJobApp("u1", 2)
    await User.addJobApp("u1", 3)
    await User.addJobApp("u2", 1)
    let jobApp = await User.getAllUserJobApps()
    expect(jobApp).toEqual([{"job_id": 1, "username": "u1"},
      {"job_id": 2, "username": "u1"},
      {"job_id": 3, "username": "u1"},
      {"job_id": 1, "username": "u2"}
    ])
  })

  test('failed to get job app if wrong id', async () => {
    try {
      let jobApp = await User.getJobApp("u1", 123)
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  })
})

describe('delete job app', () => {
  test('delete job app', async () => {
    await User.addJobApp("u1", 1)
    let test = await User.getJobApp("u1", 1)
    let jobApp = await User.deleteJobApp("u1", 1)
    expect(jobApp).toEqual({message: 'deleted'})
  })

  test('delete all user job apps', async () => {
    await User.addJobApp("u1", 1)
    let test = await User.getAllUserJobApps("u1")
    let jobApp = await User.deleteUserJobApps("u1")
    expect(jobApp).toEqual({message: 'deleted'})
  })
  test('failed to delete job app if wrong id', async()=>{
    try {
      let jobApp = await User.deleteJobApp("u1", 1)
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  })
})