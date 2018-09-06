const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const tools = require('./tools');
const config = require('./config');

const db = new sqlite3.Database('./server/data.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS Head_Invitees (
      ID INTEGER PRIMARY KEY,
      Name VARCHAR(255) NOT NULL,
      Email VARCHAR(255) NOT NULL,
      UniqueID VARCHAR(4) UNIQUE NOT NULL,
      MaxInvitations INTEGER NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS All_Invitees (
      ID INTEGER PRIMARY KEY,
      UniqueID VARCHAR(4) NOT NULL,
      Name VARCHAR(255) NOT NULL,
      FOREIGN KEY(UniqueID) REFERENCES Head_Invitees(UniqueID)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Unregistered_Credentials (
      ID INTEGER PRIMARY KEY,
      Email VARCHAR(255) NOT NULL,
      RoleID INTEGER NOT NULL,
      UniqueToken VARCHAR(40) NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Credentials (
      ID INTEGER PRIMARY KEY,
      Username VARCHAR(255) NOT NULL,
      Password VARCHAR(255) NOT NULL,
      Email VARCHAR(255) NOT NULL,
      RoleID INTEGER NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Email_Logs (
      ID INTEGER PRIMARY KEY,
      UniqueID VARCHAR(4) UNIQUE NOT NULL,
      IsInvitationEmailSent BOOLEAN NOT NULL,
      FOREIGN KEY(UniqueID) REFERENCES Head_Invitees(UniqueID)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS Automated_Event_Logs (
      ID INTEGER PRIMARY KEY,
      Date VARCHAR(10) UNIQUE NOT NULL
    );
  `);
});

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use((req, res, next) => {
  if (req.url !== '/api/login' && !req.url.startsWith('/api/isValidHeadInvitee') && !req.url.startsWith('/api/getSpecificHeadInvitee') && req.url !== '/api/addSubInvitees' && !req.url.startsWith('/api/getSubInvitees') && !req.url.startsWith('/api/checkIfValidToken') && req.url !== '/api/registerAdmin') {
    try {
      const payload = jwt.decode(req.get('Authorization').substr('Bearer '.length), config.JWT_SECRET);

      if (new Date().getTime() > payload.expiry) {
        res.status(401).end();
      } else {
        req.admin = {};
        req.admin.roleID = payload.roleID;

        next();
      }
    } catch (e) {
      res.status(401).end();
    }
  } else {
    next();
  }
});

const email = require('./email');

require('./routes')(app, db);
require('./adminRegister')(app, db);
require('./readOnlyAdminRoutes')(app, db);
require('./adminRoutes')(app, db);
require('./superAdminRoutes')(app, db, email);
require('./headAdminRoutes')(app, db, email);
require('./scheduler')(db, email);

app.listen(port, () => tools.log('Listening on port: ' + port));
