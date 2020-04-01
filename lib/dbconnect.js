const { execSync } = require('child_process');

let dbUrl = process.env.DATABASE_URL;

// Check if we are on a local server and haven't defined the DATABASE_URL environment variable
if (typeof dbUrl === 'undefined') {

  // execute the heroku command, and make sure it's SSL
  dbUrl = execSync('heroku config:get DATABASE_URL').toString() + '?ssl=true';

  // we end up with an unwanted \n, which we remove here
  dbUrl = dbUrl.replace(/(\r\n|\n|\r)/gm, "");
}

// create our database connection
const { Pool } = require('pg');
const pool = new Pool({ 
  connectionString: dbUrl 
});

// Export our pool for use elsewhere
exports.pool = pool;

