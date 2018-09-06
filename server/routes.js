module.exports = function (app, db) {
  app.get('/api/isValidHeadInvitee', (req, res) => {
    if (!req.query.id) {
      res.status(400).end();
      return;
    }

    db.get(`
      SELECT COUNT(*) as count
      FROM Head_Invitees
      WHERE UniqueID = ?;
    `, req.query.id,
      (err, row) => {
        if (row.count > 0) {
          res.status(200).end();
        } else {
          res.status(400).end();
        }
      });
  });

  app.get('/api/getSpecificHeadInvitee', (req, res) => {
    if (!req.query.id || !req.query.name) {
      res.status(400).end();
      return;
    }

    db.get(`
      SELECT Name, MaxInvitations
      FROM Head_Invitees
      WHERE UniqueID = ? AND UPPER(Name) = UPPER(?);
    `, req.query.id, req.query.name,
      (err, row) => {
        if (row) {
          res.set('Content-Type', 'application/json').send(row);
        } else {
          res.status(400).end();
        }
      });
  });

  app.get('/api/getSubInvitees', (req, res) => {
    if (!req.query.id && !req.query.name) {
      res.status(400).end();
      return;
    }

    db.get(`
      SELECT COUNT(*) AS count
      FROM Head_Invitees
      WHERE UniqueID = ? AND Name = ?;
    `, req.query.id, req.query.name,
      (err, row) => {
        if (row.count === 0) {
          res.status(400).end();
          return;
        }

        db.all(`
          SELECT Name AS name
          FROM All_Invitees
          WHERE UniqueID = ?;
        `, req.query.id,
          (err, row) => {
            res.set('Content-Type', 'application/json').send(row);
          });
      });
  });

  app.post('/api/addSubInvitees', (req, res) => {
    if (!req.body.id || !req.body.inviteeData || req.body.inviteeData.find(invitee => invitee.name === '')) {
      res.status(400).end();
      return;
    }

    if (req.body.inviteeData.length === 0) {
      db.run(`
        DELETE FROM All_Invitees
        WHERE UniqueID = ?;
      `, req.body.id);

      res.status(200).end();
      return;
    }

    db.get(`
      SELECT COUNT(*) AS count, MaxInvitations
      FROM Head_Invitees
      WHERE UniqueID = ? AND Name = ?;
    `, req.body.id, req.body.name, (err, row) => {
      if (row.count === 0 || req.body.inviteeData.length > row.MaxInvitations) {
        res.status(400).end();
        return;
      }

      let query = 'INSERT INTO All_Invitees (UniqueID, Name) VALUES';
      const parameters = [];

      req.body.inviteeData.forEach(e => {
        query += '\n(?, ?),';

        parameters.push(req.body.id);
        parameters.push(e.name);
      });

      query = query.substr(0, query.length - 1) + ';';

      db.serialize(() => {
        db.run(`
          DELETE FROM All_Invitees
          WHERE UniqueID = ?;
        `, req.body.id);

        db.run(query, parameters, (err, row) => {
          if (err) {
            console.error(err);
            res.status(500).end();
          } else {
            res.status(200).end();
          }
        });
      });
    });
  });
}
