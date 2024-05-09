
# Jobly Backend
This is the Express backend for Jobly.
## Setup
To run this: `node server.js` or `nodemon server.js`
To seed: `psql -f jobly.sql`
To run the tests: `jest -i`

You will need to provide two .env files to successfully run Jobly: .env and .env.test
These files should be formatted like:

    DB_USERNAME=
    DB_PASSWORD=
    PORT=
    DATABASE_URL=
    SECRET_KEY=

  

To maintain authorization, you will need to add a header to each request, with key-value:

    Authorization: Bearer [token]

## Routes
Jobly is defined with 3 routes, with further sub-routes
- **/auth**
	- /POST: token - Pass a valid JSON object to login:
    { "username" : "testuser", "password" : "password" }
		
		This returns a token, which will look similar to: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3RhZG1pbiIsImlzQWRtaW4iOnRydWUsImlhdCI6MTcxNTEyNzExMH0.gR5HRG2wDuRe_qGOf9McE0cpEnqeyz-WU9LcrvMxqI0`

		For any routes or operations that require authorization, this token will need to be attached to future requests.

	- /POST: register - Register a user, passing a JSON object. 
	JSON should contain `username, password, firstName, lastName, email`
	
		Like /login, this will return a token.
- **/users**
	- /GET - returns all users
	- /POST - admin only. Create a user.
	- GET /users/[username]- returns info about a specific user.
	- PATCH /users/[username]- admin or same user only. Updates info about user. 
	- DELETE /users/[username]- admin or same user only. Deletes user.
- **/jobs**
	- /GET - returns all jobs.
	- /POST - admin only. add a job. Must pass JSON object: `{ title, salary, equity, company_handle }`
	- GET /jobs/[job id] - return specific job.
	- PATCH /jobs/[job id] - admin only. Update a job.
	- DELETE /jobs/[job id] - admin only. Delete a job. 
- **/companies**
	- /GET - return all companies.
	- /POST - admin only. Add a company. Must pass JSON object: `{ handle, name, description, numEmployees, logoUrl }`
	- GET /companies/[company handle] - returns specific company.
	- PATCH /companies/[company handle] - admin only. updates company.
	- DELETE /companies/[company handle] - admin only. Deletes company.
- **/applications**
