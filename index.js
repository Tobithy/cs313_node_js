const cool = require('cool-ascii-faces');
const express = require('express');
const app = express();
const path = require('path');
const PORT = process.env.PORT || 5000;
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.get('/', (req, res) => res.render('pages/index'));
app.get('/cool', (req, res) => res.send(cool()));
app.listen(PORT, () => console.log(`Listening on ${ PORT }`));


//////////// Control //////////////////
///// Control pages ////////
// Prove 09 - postal calculator
app.get('/postal', (req, res) => res.render('pages/postal'));
app.get('/getrate', handleGetrate);

app.get('/db', handleDb);

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
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM test_table');
    const results = { 'results': (result) ? result.rows : null };
    res.render('pages/db', results);
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
}


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
