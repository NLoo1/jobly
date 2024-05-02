"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}


/** Checks if user is an admin.
 *
 * If not, raises Unauthorized.
 */
function isAdmin(req,res,next){
  try{
    if(!res.locals.user) throw new UnauthorizedError();
    if(!res.locals.user.isAdmin) throw new UnauthorizedError("Need admin access")
    return next()
  } catch(err) 
  {return next(err)}
}


/** Checks if user is admin or the same user as in URL.
 *
 * If not, raises Unauthorized.
 */
function isUserOrAdmin(req, res, next) {
  try {
      if(!res.locals.user) throw new UnauthorizedError("Not logged in");
      const requestedUsername = req.params.username;
      const loggedInUser = res.locals.user;

      if (loggedInUser.username === requestedUsername || loggedInUser.isAdmin) {
          // User is the same as the requested user OR is an admin
          return next();
      } else {
          throw new UnauthorizedError();
      }
      
  } catch (err) {
      return next(err);
  }
}




module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  isAdmin,
  isUserOrAdmin
};
