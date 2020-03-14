const cool = require('cool-ascii-faces');
const express = require('express');
const app = express();
const path = require('path');
const PORT = process.env.PORT || 5000;
const giphy = require('giphy-api')(); // use the public beta key for now

// get a pool from our dbconnect module. use the {pool} notation since our export is actually an object, 
//  and we need the pool inside the object.
const {pool} = require(__dirname + '/lib/dbconnect.js');

// const { Pool } = require('pg');
// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: true
// });

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.get('/', (req, res) => res.render('pages/index'));
app.get('/cool', (req, res) => res.send(cool()));
app.listen(PORT, () => console.log(`Listening on ${ PORT }`));

// Node.js project - gifchat
app.get('/gifchat', (req, res) => res.render('pages/gifchat'));


//////////// Control //////////////////
///// Control pages ////////
// Prove 09 - postal calculator
app.get('/postal', (req, res) => res.render('pages/postal'));
app.get('/getrate', handleGetrate);

app.get('/db', handleDb);

// test app.post

app.use(express.urlencoded({
  extended: true
}));  // apparently I need urlencoded for this, not json.
app.use(express.json()); // support json encoded requests

// app.post('/retrieveuser', (req, res) => {
//   let userId = req.body.userId;
//   // let successText = 'You made a POST request!\nYou sent ' + userId;
//   res.send(successText);
// });

app.post('/retrieveuser', (req, res) => {
  let userId = req.body.userId;
  var resRows;
  var sql1 = "SELECT * FROM user_account WHERE user_account_id = " + userId;
  pool.query(sql1, function (err, result) {
    // If an error occurred...
    if (err || result.rowCount != 1) {
      res.status(500).json({ success: false, data: err });
      console.log("Error in query: ")
      console.log(err);
      return;
    }

    // Log this to the console for debugging purposes.
    console.log("Back from DB with result:");
    resRows = result.rows;
    console.log(resRows);
    res.status(200).json(resRows);
  });
});

app.post('/gifsearch', (req, res) => {
  let searchPhrase = req.body.searchPhrase;
  giphy.search(searchPhrase, (err, result) => {
    if (err) {
      res.status(500).json({ success: false, data: err });
      console.log("Error in query: ")
      console.log(err);
      return;
    }
    res.status(200).json(result);
  });
});

///// Control functions ////////
function handleGetrate (req, res) {
  let weight = Number(req.query.weight);
  let mailType = req.query.mail_type;
  let rate = calculateRate(weight, mailType);

  let params = {
    weight: weight,
    mailType: mailType,
    rate: rate
  };
  res.render('pages/getrate', params);
}

async function handleDb (req, res) {
  // try {
  //   const client = await pool.connect();
  //   const result = await client.query('SELECT * FROM test_table');
  //   const results = { 'results': (result) ? result.rows : null };
  //   res.render('pages/db', results);
  //   client.release();
  // } catch (err) {
  //   console.error(err);
  //   res.send("Error " + err);
  // }

  // do it as a single query, the preferred method
  pool.query('SELECT * FROM test_table', (err, result) => {
    if (err) {
      console.error(err);
      res.send('Error: ' + err);
    }

    const results = { 'results': (result) ? result.rows : null };
    res.render('pages/db', results);
  });
}

app.get('/getuser', function (req, res) {
  let userId = req.query.userId;
  var resRows;
  var sql1 = "SELECT * FROM user_account WHERE user_account_id = " + userId;
  pool.query(sql1, function (err, result) {
    // If an error occurred...
    if (err || result.rowCount != 1) {
      res.status(500).json({success: false, data: err});
      console.log("Error in query: ")
      console.log(err);
      return;
    }

    // Log this to the console for debugging purposes.
    console.log("Back from DB with result:");
    resRows = result.rows;
    // resRows = [resRows[0], resRows[0]];
    console.log(resRows);
    res.status(200).json(resRows);
  });
});


//////////// Model (business logic) ////////////////
// function calculateRate
//  weight is in ounces
//  returns the rate for valid weights, but for invalid we return 999. i.e. no real bounds checking.
function calculateRate(weight, mailType) {
  let rate = 0.0;
  // determine what kind of shipment
  switch (mailType.toLowerCase()) {
    case "stamped_letter":
      if (weight > 0.0 && weight <= 3.5){
        rate = 0.55 + 0.15 * Math.ceil(weight - 1.0);
      } else {
        rate = 999;
      }
      break;
    case "metered_letter":
      if (weight > 0.0 && weight <= 3.5) {
        rate = 0.50 + 0.15 * Math.ceil(weight - 1.0);
      } else {
        rate = 999;
      }
      break;
    case "large_envelope":
      if (weight > 0.0 && weight <= 13.0) {
        rate = 1.0 + 0.20 * Math.ceil(weight - 1.0);
      } else {
        rate = 999;
      }
      break;
    case "first_class_package":
      if (weight > 0.0 && weight <= 4.0) {
        rate = 3.8;
      } else if (weight > 4.0 && weight <= 8.0) {
        rate = 4.6;
      } else if (weight > 8.0 && weight <= 12.0) {
        rate = 5.3;
      } else if (weight > 12.0 && weight <= 13.0) {
        rate = 5.9;
      } else {
        rate = 999;
      }
      break;
  
    default:
      console.error("Mail Type does not match!");
      rate = 999;
      break;
  }
  return rate;
}
