const bcrypt = require('bcrypt');

module.exports = function (app, db) {
  app.get('/api/checkIfValidToken', (req, res) => {
    if (!req.query.token) {
      res.status(401).end();
      return;
    }

    db.get(`
      SELECT Email, UniqueToken
      FROM Unregistered_Credentials
      WHERE UniqueToken = ?;
    `, req.query.token, (err, row) => {
      if (err) {
        console.error(err);
      }

      res.set('Content-Type', 'application/json').send(row);
    });
  });

  app.post('/api/registerAdmin', (req, res) => {
    if (!req.body.username || !req.body.password || !req.body.token) {
      res.status(401).end();
      return;
    }

    db.get(`
      SELECT COUNT(*) as count
      FROM Credentials
      WHERE LOWER(Username) = LOWER(?);
    `, req.body.username, (err, row) => {
      if (err) {
        console.error(err);
        res.status(401).end();
        return;
      }
      
      if (row.count > 0) {
        res.set('Content-Type', 'application/json').send({ error: 'This username is already taken' });
        return;
      }
      
      db.get(`
        SELECT COUNT(*) as count, Email, RoleID
        FROM Unregistered_Credentials
        WHERE UniqueToken = ?;
      `, req.body.token, (err, row) => {
        if (err) {
          console.error(err);
        }

        if (row.count > 0) {
          bcrypt.hash(req.body.password, 10, (err, hash) => {
            if (err) {
              console.error(err);
            }

            db.serialize(() => {
              db.run(`
                INSERT INTO Credentials (Username, Password, Email, RoleID)
                VALUES (?, ?, ?, ?);
              `, req.body.username, hash, row.Email, row.RoleID);

              db.run(`
                DELETE FROM Unregistered_Credentials
                WHERE UniqueToken = ?;
              `, req.body.token);
            });

            res.set('Content-Type', 'application/json').send({ success: true });
          });
        } else {
          res.status(401).end();
        }
      });
    });
  });
}
