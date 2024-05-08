"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError, ExpressError } = require("../expressError");
const { ensureLoggedIn, isAdmin, isUserOrAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, company_handle }
 *
 * Returns { title, salary, equity, company_handle }
 *
 * Authorization required: admin
 */

router.post("/", ensureLoggedIn, isAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { jobs: [ { title, salary, equity, company_handle }, ...] }
 *
 * Can filter on provided search filters:
 * - titleLike
 * - hasEquity
 * - companyLike
 * - minSalary
 * 
 * Filters are passed as queries: http://127.0.0.1:3001/jobs?minSalary=60000
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {

  const { titleLike, hasEquity, companyLike, minSalary } = req.query;

  // Validate salary.
  if (parseInt(minSalary) < 0) {
      return res.status(400).json({ error: 'Invalid salary' });
  }

  // Validate equity.
  if (parseFloat(hasEquity) < 0 ) {
      return res.status(400).json({ error: 'Invalid equity' });
  }

  try {
      // Get jobs based on filters
      const jobs = await Job.getJobs(titleLike, companyLike, minSalary, hasEquity);
      return res.json(jobs);
  } catch (err) {
      return next(err)
  }
});

/** GET /[id]  =>  { job }
 *
 *  Job is { handle, name, description, numEmployees, logoUrl, jobs }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  try {
    const job = await Job.get(req.params.id);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[id] { fld1, fld2, ... } => { company }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 * ID and company_handle cannot be updated.
 *
 * Returns { title, salary, equity, company_handle }
 *
 * Authorization required: admin
 */

router.patch("/:id", isAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobUpdateSchema);

    // Validation
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.update(req.params.handle, req.body);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: admin
 */

router.delete("/:handle", isAdmin, async function (req, res, next) {
  try {
    await Job.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
