var sslRedirect = require('heroku-ssl-redirect');
const cool = require('cool-ascii-faces');
const express = require('express');
const app = express();
const path = require('path');
const PORT = process.env.PORT || 5000;
const giphy = require('giphy-api')(); // use the public beta key for now

app.use(sslRedirect()); // enforce ssl at heroku

// get a pool from our dbconnect module. use the {pool} notation since our export is actually an object, 
//  and we need the pool inside the object.
const {pool} = require(__dirname + '/lib/dbconnect.js');

// yesql ability to use named placeholders
const yesql = require('yesql').pg;

// used for checking and sanitizing user input
const { check, validationResult } = require('express-validator');

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

///// GifChat  /////////
var serverMessageId = 1000;     // global integer that tracks the current chat message number. start at 1000 for fun.
var messages = [];              // global array of messages to hold all user chat messages in. We'll keep it to <= 100 messages
const MAXMESSAGES = 100;        // max number of messages we keep available on the server. 

// lines to enable proper POST extraction
app.use(express.urlencoded({
  extended: true
}));  // apparently I need urlencoded for this, not json.
app.use(express.json()); // support json encoded requests

// Retrieve a user. This was mainly for testing purposes
/* app.post('/retrieveuser', (req, res) => {
  let userId = req.body.userId;
  var resRows;
  var sql1 = "SELECT * FROM user_account WHERE user_account_id = :userId";    // Filter those DB queries! 
  pool.query(yesql(sql1)({userId: userId}), function (err, result) {          //  using yesql!
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
}); */

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

app.post('/postmessage', [
  check('username').trim().escape(),      // trim and escape the username and text of the message to avoid exploits
  check('text').trim().escape()
], (req, res) => {
  let newMessage = req.body;
  
  // check the username is valid. For now we just call an empty function, hopefully we get to implement user validation
  if (!validateUsername(newMessage)){
    res.status(400).json({ success: false, data: 'Invalid username'});
    return;
  }

  // Also to do: We need to add the gif mp4 link to the Message object

  newMessage.messageId = serverMessageId++;   // add the current server ID to the message and then increment it
  messages.push(newMessage);
  if (messages.length > MAXMESSAGES) {
    messages.shift(); // cut off the first one
  }
  res.status(200).send('Message posted!')
  // res.status(200).json(newMessage);
});

app.post('/getmessages', (req, res) => {
  // if messages is empty, return a blank array
  if (messages.length === 0) {
    res.status(200).json([]);
    return;
  }
  // get the client's most recently retrieved message
  let clientMessageId = req.body.clientMessageId;

  // find what message in the array this corresponds to (to check: What happens if messages is empty?)
  let curMessage = clientMessageId - messages[0].messageId;
  if (curMessage < 0) {curMessage = -1;} // in this case, the client has possibly missed some messages, or it's just starting out

  res.status(200).json(messages.slice(curMessage + 1)); // send back json array of messages sliced off the end  
});


///// Control functions ////////
//////////// gifchat functions //////////
function validateUsername(message) {
  // for now just make sure it's not blank
  if (message.username === "") {
    return false;
  } else {
    return true;
  }
}


///////////// other assignment functions //////////////////
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

// app.get('/getuser', function (req, res) {
//   let userId = req.query.userId;
//   var resRows;
//   var sql1 = "SELECT * FROM user_account WHERE user_account_id = " + userId;
//   pool.query(sql1, function (err, result) {
//     // If an error occurred...
//     if (err || result.rowCount != 1) {
//       res.status(500).json({success: false, data: err});
//       console.log("Error in query: ")
//       console.log(err);
//       return;
//     }

//     // Log this to the console for debugging purposes.
//     console.log("Back from DB with result:");
//     resRows = result.rows;
//     // resRows = [resRows[0], resRows[0]];
//     console.log(resRows);
//     res.status(200).json(resRows);
//   });
// });


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

// put this at the end to handle otherwise unhandled routes
app.use(function (req, res, next) {
  res.status(404).send('Sorry can\'t find that! <a href="/">Click here</a> to return to the main page.');
});