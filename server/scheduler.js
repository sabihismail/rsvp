const dateFormat = require('dateformat');
const schedule = require('node-schedule');
const config = require('./config');
const tools = require('./tools');

module.exports = function (db, email) {
  schedule.scheduleJob(config.REMINDER_EMAIL.SCHEDULE_TIME, () => {
    const date = dateFormat(new Date(), 'yyyy-mm-dd');

    tools.log('Scheduler job check for automatic email notification. Date: ' + date);

    if (config.REMINDER_EMAIL.DATES.includes(date)) {
      db.get(`
        SELECT COUNT(*) as count
        FROM Automated_Event_Logs
        WHERE Date = ?;
      `, date, (err, row) => {
        if (err) {
          console.error(err);
          return;
        }

        if (row.count === 0) {
          db.serialize(() => {
            db.all(`
              SELECT  UniqueID,
                      Name,
                      Email,
                      (
                        SELECT COUNT(*)
                        FROM All_Invitees AS ai
                        WHERE ai.UniqueID = hi.UniqueID
                      ) AS SelectedInvitations
              FROM Head_Invitees AS hi
              WHERE SelectedInvitations = 0;
            `, (err, rows) => {
              if (err) {
                console.error(err);
              }
        
              rows.forEach(row => {
                email.sendMessage(row.Email, tools.parseVariables(config.INVITATION_EMAIL.SUBJECT, row), tools.parseVariables(config.REMINDER_EMAIL.MESSAGE, row), (err, info) => {
                  if (err) {
                    console.error(err);
                  }
                });
              });
            });
  
            db.run(`
              INSERT INTO Automated_Event_Logs (Date)
              VALUES (?);
            `, date);
          });
        }
      });
    }
  });
}
