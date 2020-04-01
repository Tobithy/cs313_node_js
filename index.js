var sslRedirect = require('heroku-ssl-redirect');
const cool = require('cool-ascii-faces');
const express = require('express');
const app = express();
const session = require('express-session');

const path = require('path');
const PORT = process.env.PORT || 5000;
const giphy = require('giphy-api')(process.env.GIPHY_KEY); // keep API key in environment variable

app.use(sslRedirect()); // enforce ssl at heroku

// bcrypt
const bcrypt = require('bcrypt');
const saltRounds = 10;

//session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}))

// get a pool from our dbconnect module. use the {pool} notation since our export is actually an object, 
//  and we need the pool inside the object.
const {pool} = require(__dirname + '/lib/dbconnect.js');

// yesql ability to use named placeholders
const yesql = require('yesql').pg;

// used for checking and sanitizing user input
const { check, validationResult } = require('express-validator');

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

///// GifChat  /////////
var serverMessageId = 1000;     // global integer that tracks the current chat message number. start at 1000 for fun.
var messages = [];              // global array of messages to hold all user chat messages in. We'll keep it to <= 100 messages
const MAXMESSAGES = 100;        // max number of messages we keep available on the server. 

// lines to enable proper POST extraction
app.use(express.urlencoded({
  extended: true
}));  // apparently I need urlencoded for this, not json.
app.use(express.json()); // support json encoded requests

// Node.js project - gifchat
app.get('/gifchat', (req, res) => {
  // only show the Chat if the user is logged in
  if (req.session.username) {
    let params = {
      username: req.session.username
    };
    res.render('pages/gifchat', params);
  } else {
    res.redirect('/gifchat_login');
  }
});

app.get('/gifchat_login', (req, res) => {
  if (req.session.username) {
    res.redirect('/gifchat');
  } else {
    res.render('pages/gifchat_login');
  }
});

// when the user actually tries to login
app.post('/login', [
  check('username').trim().escape()      // trim and escape the username to avoid exploits
], async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  
  let loginSuccess = await loginUser(username, password, req);
  if (loginSuccess) {
    res.status(200).json(req.session.username);
  } else {
    res.status(401).send("Invalid credentials");
  }

});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/gifchat_login');
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

app.post('/postmessage', [
  check('text').trim().escape()
], (req, res) => {
  if (!req.session.username) {
    res.status(401).json({ success: false, data: 'Unauthorized'});
  } else {
    let newMessage = req.body;
    newMessage.username = req.session.username;

    newMessage.messageId = serverMessageId++;   // add the current server ID to the message and then increment it
    messages.push(newMessage);
    if (messages.length > MAXMESSAGES) {
      messages.shift(); // cut off the first one
    }
    res.status(200).send('Message posted!')
  }
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
// async function so we can await. This logs in the user if they provided the correct username and password
async function loginUser(username, password, req) { 
  let resRows;
  let sql1 = "SELECT hashed_password FROM user_account WHERE username = :username";    
  try {
    resRows = await pool.query(yesql(sql1)({ username: username }));   // Filter dbqueries using yesql
  } catch(err) {
    console.error(err);
    return false; // db query failed, just return false for now
  }
  
  if (resRows.rowCount === 0) {  // in this case the username doesn't exist yet
    let hashedPassword = await bcrypt.hash(password, saltRounds); // use async/await
    let sql2 = "INSERT INTO user_account(username, hashed_password) VALUES(:username, :hashedPassword)";
    try {
      await pool.query(yesql(sql2)({username: username, hashedPassword: hashedPassword}));
      req.session.username = username;
      return true;
    } catch (err) {
      console.error(err);
      return false;   // db insert failed
    }
  } else if (resRows.rowCount === 1) {
    // check that the user's password matches
    // console.log(resRows.rows[0]);
    let match = await bcrypt.compare(password, resRows.rows[0].hashed_password);
    if (match) {
      req.session.username = username;
      return true;
    } else {
      console.log("Failed login for username: " + username);
      return false;
    }
  } else {
    // we shouldn't get here
    console.error("Too many db results!"); 
    return false;
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