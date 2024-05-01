"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError, ExpressError } = require("../expressError");
const { ensureLoggedIn, isAdmin } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");

const router = new express.Router();

/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: admin
 */

router.post("/", isAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  } catch (err) {
    return next(err);
  }
});

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  try {
    if (Object.keys(req.query).length === 0) {
      const companies = await Company.findAll();
      return res.json({ companies });
    } else{

    // Going by the assumption that queries can ONLY be minEmployees, maxEmployees, and/or nameLike

    const minEmployees = parseInt(req.query.minEmployees) || 0;
    const maxEmployees = parseInt(req.query.maxEmployees) || 9999999;
    const nameLike = req.query.nameLike;

    // Edge case: minEmployees or maxEmployees < 0
    if (
      minEmployees &&
      maxEmployees &&
      (minEmployees < 0 || maxEmployees < 0)
    ) {
      throw new ExpressError("minEmployees or maxEmployees is negative", 400);
    }
    // Edge case: minEmployees > maxEmployees
    if (minEmployees && maxEmployees && (minEmployees > maxEmployees)) {
      throw new ExpressError(
        "minEmployees cannot be more than maxEmployees",
        400
      );
    }


    const companies = await Company.findAll();


    const filtered_companies = companies.filter((company) => {

      let passMinEmployeesCheck = true;
      let passMaxEmployeesCheck = true;
      let passNameLikeCheck = true;

      // If minEmployees is passed, compare employees to minEmployees.
      // Keep true if number of employees meets requirements
      if (minEmployees !== undefined) {
        passMinEmployeesCheck = company.numEmployees >= minEmployees;
      }

      if (maxEmployees !== undefined) {
        passMaxEmployeesCheck = company.numEmployees <= maxEmployees;
      }

      if (nameLike !== undefined && nameLike.trim() !== "") {
        let lowercaseCompanyName = company.name.toLowerCase();
        let lowercaseNameLike = nameLike.toLowerCase().trim(); // Ensure trimmed lowercase query
        passNameLikeCheck = lowercaseCompanyName.includes(lowercaseNameLike);
    }
    

      return (
        passMinEmployeesCheck && passMaxEmployeesCheck && passNameLikeCheck
      );
    });
    return res.json({ filtered_companies });
    }
  } catch (err) {
    return next(err);
  }
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, salary, equity }, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  try {
    const company = await Company.get(req.params.handle);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: admin
 */

router.patch("/:handle", isAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.update(req.params.handle, req.body);
    return res.json({ company });
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
    await Company.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
