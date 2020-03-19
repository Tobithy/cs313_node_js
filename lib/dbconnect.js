const { execSync } = require('child_process');

let dbUrl = process.env.DATABASE_URL;

// console.log(execSync('heroku config:get DATABASE_URL'));
// Check if we are on a local server and haven't defined the DATABASE_URL environment variable
if (typeof dbUrl === 'undefined') {
  // exec('heroku config:get DATABASE_URL', (err, stdout, stderr) => {
  //   if (err) {
  //     console.error('Error: ' + err);
  //   } else {
  //     dbUrl =  stdout;
  //   }
  // });

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


// // test it works
// let sql = "SELECT * FROM test_table";


// pool.query(sql, function (err, result) {
//   // If an error occurred...
//   if (err) {
//     console.log("Error in query: ")
//     console.log(err);
//   }

//   // Log this to the console for debugging purposes.
//   console.log("Back from DB with result:");
//   console.log(result.rows[0]);
// });     

