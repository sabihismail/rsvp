const tools = require('./tools');
const config = require('./config');

generateToken = () => {
  return tools.generateRandomString(40);
}

module.exports = function (app, db, email) {
  db.all(`
    SELECT COUNT(*) as count
    FROM Credentials
    WHERE Email = ?
    UNION
    SELECT COUNT(*) as count
    FROM Unregistered_Credentials
    WHERE Email = ?;
  `, config.HEAD_ADMIN.EMAIL, config.HEAD_ADMIN.EMAIL, (err, rows) => {
    if (err) {
      console.error(err);
    }

    if (!rows.some(row => row.count > 0)) {
      const token = generateToken();
      const message = tools.parseVariables(config.HEAD_ADMIN.MESSAGE, { url: 'http://localhost/admin/register/' + token });

      email.sendMessage(config.HEAD_ADMIN.EMAIL, config.HEAD_ADMIN.SUBJECT, message, (err, _) => {
        if (err) {
          console.error(err);
        }

        db.run(`
          INSERT INTO Unregistered_Credentials (Email, RoleID, UniqueToken)
          VALUES (?, ?, ?);
        `, config.HEAD_ADMIN.EMAIL, 4, token);
      });
    }
  });

  app.use((req, res, next) => {
    if (!req.admin || !req.admin.roleID || req.admin.roleID < 4) {
      res.status(401).end();
      return;
    }

    next();
  });

  app.get('/api/getAllAdmins', (req, res) => {
    db.all(`
      SELECT Username, Email, RoleID
      FROM Credentials;
    `, (err, rows) => {
      if (err) {
        console.error(err);
      }

      res.set('Content-Type', 'application/json').send(rows);
    });
  });

  app.get('/api/getAllUnregisteredAdmins', (req, res) => {
    db.all(`
      SELECT Email, RoleID
      FROM Unregistered_Credentials;
    `, (err, rows) => {
      if (err) {
        console.error(err);
      }

      res.set('Content-Type', 'application/json').send(rows);
    });
  });

  app.post('/api/addNewAdmin', (req, res) => {
    if (!req.body.email || !req.body.roleID || !tools.isValidEmail(req.body.email)) {
      res.status(400).end();
      return;
    }

    const token = generateToken();

    callback = (successful) => {
      if (successful) {
        db.run(`
          INSERT INTO Unregistered_Credentials (Email, RoleID, UniqueToken)
          SELECT ?, ?, ?
          WHERE NOT EXISTS (
            SELECT 1 FROM Unregistered_Credentials WHERE Email = ?
          ) AND NOT EXISTS (
            SELECT 1 FROM Credentials WHERE Email = ?
          )
        `, req.body.email, req.body.roleID, token, req.body.email, req.body.email);
      }
    }

    const host = req.get('host').split(':')[0];

    const subject = tools.parseVariables(config.NEW_ADMIN.SUBJECT, { 
      host: req.protocol + '://' + host
    });
    const message = tools.parseVariables(config.NEW_ADMIN.MESSAGE, { 
      host: host,
      url: req.protocol + '://' + host + '/admin/register/' + token
    });

    email.sendMessage(req.body.email, subject, message, (err, info) => {
      if (err) {
        console.error(err);
      } else {
        callback(info.accepted.length > 0);
      }
    });

    res.status(200).end();
  });

  app.delete('/api/deleteAdmin', (req, res) => {
    if (!req.body.email || !tools.isValidEmail(req.body.email)) {
      res.status(400).end();
      return;
    }

    db.run(`
      DELETE FROM Credentials
      WHERE Email = ? AND RoleID <> 4;
    `, req.body.email);
    
    res.status(200).end();
  });

  app.delete('/api/deleteUnregisteredAdmin', (req, res) => {
    if (!req.body.email || !tools.isValidEmail(req.body.email)) {
      res.status(400).end();
      return;
    }

    db.run(`
      DELETE FROM Unregistered_Credentials
      WHERE Email = ?;
    `, req.body.email);

    res.status(200).end();
  });

  app.post('/api/editAdminEmail', (req, res) => {
    if (!req.body.email || !req.body.roleID || !tools.isValidEmail(req.body.email)) {
      res.status(400).end();
      return;
    }

    db.run(`
      UPDATE Credentials
      SET RoleID = ?
      WHERE Email = ? AND RoleID <> 4;
    `, req.body.roleID, req.body.email);

    res.status(200).end();
  });

  app.post('/api/resendAdminEmail', (req, res) => {
    if (!req.body.email || !tools.isValidEmail(req.body.email)) {
      res.status(400).end();
      return;
    }

    db.get(`
      SELECT Email, UniqueToken
      FROM Unregistered_Credentials
      WHERE Email = ?;
    `, req.body.email, (err, row) => {
      if (err) {
        console.error(err);
        return;
      }

      if (!res) {
        res.status(400).end();
        return;
      }

      const host = req.get('host').split(':')[0];

      const subject = tools.parseVariables(config.NEW_ADMIN.SUBJECT, { 
        host: req.protocol + '://' + host 
      });
      const message = tools.parseVariables(config.NEW_ADMIN.MESSAGE, { 
        host: host,
        url: req.protocol + '://' + host + '/admin/register/' + row.UniqueToken 
      });
  
      email.sendMessage(row.Email, subject, message, (err) => {
        if (err) {
          console.error(err);
        }
      });
    });
  });
}
