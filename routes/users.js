"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const db = require("../db")
const { ensureLoggedIn, isAdmin, isUserOrAdmin } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router();


/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: admin
 **/

router.post("/", isAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});


/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: admin
 **/

router.get("/", isAdmin, async function (req, res, next) {
  try {
    const users = await User.findAll();
    const jobApps = await User.getAllUserJobApps()
    return res.json({ users, jobApps});
  } catch (err) {
    return next(err);
  }
});


/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin }
 *
 * Authorization required: admin or same user
 **/

router.get("/:username", isUserOrAdmin, async function (req, res, next) {
  try {
    const user = await User.get(req.params.username);
    const jobApps = await User.getAllJobApps(req.params.username)
    return res.json({ user, jobs: jobApps });
  } catch (err) {
    return next(err);
  }
});



/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: admin or same user
 **/

router.patch("/:username", isUserOrAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.update(req.params.username, req.body);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: admin or same user
 **/

router.delete("/:username", isUserOrAdmin, async function (req, res, next) {
  try {
    // Delete all job apps from user
    await db.query(`DELETE FROM applications WHERE username=$1`, [req.params.username])

    await User.remove(req.params.username);
    return res.json({ deleted: req.params.username });
  } catch (err) {
    return next(err);
  }
});


/******************** APPLICATION ROUTES */

/** POST /[username]/jobs/:id => { applied: jobId }
 *
 * Returns job apps.
 *
 * Authorization required: admin or same user
 **/
router.post("/:username/jobs/:id", isUserOrAdmin, async function(req,res,next){
  try{
    const apply = await User.addJobApp(req.params.username, req.params.id)
    return res.json({applied: req.params.id})
  } catch(err){
    return next(err)
  }
})

/** DELETE /[username]/jobs/:id => { deleted: jobId }
 *
 * Returns job apps.
 *
 * Authorization required: admin or same user
 **/
router.delete("/:username/jobs/:id"), isUserOrAdmin, async function(req,res,next){
  try{
    const del = await User.deleteJobApp(req.params.username, req.params.id)
    return res.json({deleted: req.params.id})
  } catch(err){
    return next(err)
  }
}

/** GET /[username]/jobs => { user, jobs: jobApps }
 *
 * Returns job apps.
 *
 * Authorization required: admin or same user
 **/
router.get("/:username/jobs", isUserOrAdmin, async function (req, res, next) {
  try {
    const jobApps = await User.getAllJobApps(req.params.username)
    return res.json({jobs: jobApps });
  } catch (err) {
    return next(err);
  }
});


/** GET /[username]/jobs/:id => { job }
 *
 * Returns job app by id.
 *
 * Authorization required: admin or same user
 **/
router.get("/:username/jobs/:id", isUserOrAdmin, async function (req, res, next) {
  try {
    const jobApps = await User.getJobApp(req.params.username, req.params.id)
    return res.json({job: jobApps });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;

