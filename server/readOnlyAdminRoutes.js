const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const tools = require('./tools');
const config = require('./config');

module.exports = function (app, db) {
  app.post('/api/login', (req, res) => {
    if (!req.body.username || !req.body.password) {
      res.status(401).end();
      return;
    }

    db.get(`
      SELECT Password
      FROM Credentials
      WHERE LOWER(Username) = LOWER(?);
    `, req.body.username, (err, row) => {
      if (err) {
        console.error(err);
        res.status(401).end();
        return;
      }

      tools.log(req.body.username + ' has attempted to log in.');

      if (row && row.Password) {
        bcrypt.compare(req.body.password, row.Password, function(err, valid) {
          if (err) {
            console.error(err);
            res.status(401).end();
            return;
          }

          if (valid) {
            tools.log(req.body.username + ' has logged in successfully.');

            db.get(`
              SELECT RoleID
              FROM Credentials
              WHERE LOWER(Username) = LOWER(?);
            `, req.body.username, (err, row) => {
              if (err) {
                console.error(err);
                res.status(401).end();
                return;
              }
        
              const token = jwt.sign({
                username: req.body.username,
                roleID: row.RoleID,
                expiry: new Date().getTime() + 60 * 60 * 24 * 1000
              }, config.JWT_SECRET);

              res.set('Content-Type', 'application/json').send({
                success: true,
                user: req.body.username,
                token: token,
                roleID: row.RoleID
              });
            });
          } else {
            res.status(401).end();
          }
        });
      } else {
        res.status(401).end();
      }
    });
  });

  app.get('/api/getSpecificSubInvitees', (req, res) => {
    if (!req.query.id) {
      res.status(401).end();
      return;
    }

    db.all(`
      SELECT Name
      FROM All_Invitees
      WHERE UniqueID = ?;
    `, req.query.id, (err, rows) => {
      if (err) {
        console.error(err);
        res.status(401).end();
        return;
      }

      res.set('Content-Type', 'application/json').send(rows);
    });
  });
  
  app.get('/api/getAllHeadInvitees', (req, res) => {
    db.all(`
      SELECT
        hi.UniqueID,
        Name,
        Email,
        MaxInvitations,
        (
          SELECT COUNT(*)
          FROM All_Invitees AS ai
          WHERE ai.UniqueID = hi.UniqueID
        ) AS SelectedInvitations,
        CASE el.IsInvitationEmailSent
          WHEN 1 THEN 'Yes'
          ELSE 'No'
        END AS InvitationSent
      FROM Head_Invitees AS hi
      JOIN Email_Logs AS el ON el.UniqueID = hi.UniqueID;
    `, (err, rows) => {
      if (err) {
        console.error(err);
        res.status(401).end();
        return;
      }

      res.set('Content-Type', 'application/json').send(rows);
    });
  });
}
