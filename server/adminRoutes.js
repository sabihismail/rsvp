const tools = require('./tools');

module.exports = function (app, db) {
  app.use((req, res, next) => {
    if (!req.admin || !req.admin.roleID || req.admin.roleID < 2) {
      res.status(401).end();
      return;
    }

    next();
  });

  app.delete('/api/deleteHeadInvitee', (req, res) => {
    if (!req.body.id) {
      res.status(400).end();
      return;
    }

    db.run(`
      DELETE FROM Head_Invitees
      WHERE UniqueID = ?;

      DELETE FROM All_Invitees
      WHERE UniqueID = ?;
    `, req.body.id, (err) => {
      if (err) {
        console.error(err);
        res.status(500).end();
      } else {
        res.status(200).end();
      }
    });
  });

  app.post('/api/editSpecificHeadInvitee', (req, res) => {
    if (!req.body.id || !req.body.name || !req.body.email || !tools.isValidEmail(req.body.email) || !req.body.maxInvitations || isNaN(req.body.maxInvitations)) {
      res.status(400).end();
      return;
    }

    db.get(`
      SELECT COUNT(*) AS count
      FROM Head_Invitees
      WHERE Email = ?;
    `, req.body.email, (err, row) => {
      if (err) {
        console.error(err);
        res.status(401).end();
        return;
      }

      if (row.count !== 0) {
        res.status(404).set('Content-Type', 'application/json').send({
          error: 'Email already exists. Suspect email: \'' + req.body.email + '\'.'
        });
      } else {
        db.run(`
          UPDATE Head_Invitees
          SET Name = ?, Email = ?, MaxInvitations = ?
          WHERE UniqueID = ?;
        `, req.body.name, req.body.email, parseInt(req.body.maxInvitations), req.body.id, (err) => {
          if (err) {
            console.error(err);
            res.status(500).end();
          } else {
            res.status(200).end();
          }
        });
      }
    });
  });

  app.post('/api/addHeadInvitee', (req, res) => {
    if (!req.body.name || !req.body.email || !tools.isValidEmail(req.body.email) || !req.body.maxInvitations || isNaN(req.body.maxInvitations)) {
      res.status(400).end();
      return;
    }

    db.get(`
      SELECT COUNT(*) AS count
      FROM Head_Invitees
      WHERE Email = ?;
    `, req.body.email, (err, row) => {
      if (err) {
        console.error(err);
        res.status(401).end();
        return;
      }

      if (row.count !== 0) {
        res.status(404).set('Content-Type', 'application/json').send({
          error: 'Email already exists. Suspect email: \'' + req.body.email + '\'.'
        });
      } else {
        generateUniqueID(id => {
          db.serialize(() => {
            db.run(`
              INSERT INTO Head_Invitees (Name, Email, UniqueID, MaxInvitations)
              VALUES (?, ?, ?, ?);
            `, req.body.name, req.body.email, id, parseInt(req.body.maxInvitations), (err) => {
              if (err) {
                console.error(err);
                res.status(500).end();
              }
            });

            db.run(`
              INSERT INTO Email_Logs (UniqueID, IsInvitationEmailSent)
              VALUES (?, ?);
            `, id, 0, (err) => {
              if (err) {
                console.error(err);
                res.status(500).end();
              } else {
                res.status(200).end();
              }
            });
          });
        });
      }
    });
  });

  function generateUniqueID(callback) {
    const uniqueID = tools.generateRandomString(4);

    db.get(`
      SELECT COUNT(*) AS count
      FROM Head_Invitees
      WHERE UniqueID = ?;
    `, uniqueID, (err, row) => {
      if (err) {
        console.error(err);
      }

      if (row.count === 0) {
        callback(uniqueID);
      } else {
        generateUniqueID(callback);
      }
    });
  }
}
