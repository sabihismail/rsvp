const tools = require('./tools');
const config = require('./config');

module.exports = function (app, db, email) {
  app.use((req, res, next) => {
    if (!req.admin || !req.admin.roleID || req.admin.roleID < 3) {
      res.status(401).end();
      return;
    }

    next();
  });

  app.get('/api/getAllHeadInviteesNotYetInvited', (req, res) => {
    db.all(`
      SELECT hi.UniqueID as id, Name as name, Email as email
      FROM Head_Invitees hi
      JOIN Email_Logs el ON el.UniqueID = hi.UniqueID
      WHERE el.IsInvitationEmailSent = 0;
    `, (err, rows) => {
      if (err) {
        console.error(err);
      }

      res.set('Content-Type', 'application/json').send(rows);
    });
  });

  app.get('/api/getAllHeadInviteesNotYetInputted', (req, res) => {
    db.all(`
      SELECT
        hi.UniqueID AS id,
        Name AS name,
        Email AS email
      FROM Head_Invitees AS hi
      WHERE (SELECT COUNT(*) FROM All_Invitees AS ai WHERE ai.UniqueID = hi.UniqueID) = 0
    `, (err, rows) => {
      if (err) {
        console.error(err);
      }

      res.set('Content-Type', 'application/json').send(rows);
    });
  });

  app.post('/api/executeEmailToHeadInvitees', (req, res) => {
    if (!req.body.html || !req.body.recipients || req.body.recipients.length === 0) {
      res.status(400).end();
      return;
    }

    req.body.recipients.forEach((recipient, i) => {
      const callback = (successful) => {
        if (successful) {
          if (req.body.isInvitationEmail) {
            db.run(`
              UPDATE Email_Logs
              SET IsInvitationEmailSent = 1
              WHERE UniqueID = (
                SELECT UniqueID 
                FROM Head_Invitees
                WHERE Email = ?
              );
            `, recipient.email);
          }

          tools.log('Email sent to: ' + recipient.email);
        } else {
          tools.log('Email failed to send to: ' + recipient.email);
        }
      }

      setTimeout(() => {
        email.sendMessage(recipient.email, tools.parseVariables(config.INVITATION_EMAIL.SUBJECT, recipient), tools.parseVariables(req.body.html, recipient), (err, info) => {
          if (err) {
            console.error(err);
          } else {
            callback(info.accepted.length > 0);
          }
        });
      }, i * 1000);

      i += 3;
    });

    res.status(200).end();
  });
}
