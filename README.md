# rsvp
Simple web application that simplifies sending rsvp emails.

Frontend: React + Bootstrap 4 (`reactstrap` library)

Backend: Node.js + express + sqlite3

## Getting Started
Run the command `npm run install-all` in the base directory (same directory as the README.md) to automatically download packages for the server as well as the client.

## Configuration (each subheading is a file)
### `/server/config.json`
`JWT_SECRET` - Since the authentication is based on a [json web token](https://jwt.io/), the secret should only be kept on the server side and should be unique and randomly generated. Use a website like [this](https://passwordsgenerator.net/) to generate some random string.

`EMAIL` -> `HOST` - This is the SMTP host property. For my own uses, a simple `gmail` account could be used. View [this guide](https://medium.com/@manojsinghnegi/sending-an-email-using-nodemailer-gmail-7cfa0712a799) to set it up yourself.

`EMAIL` -> `USERNAME` - SMTP server username.

`EMAIL` -> `PASSWORD` - SMTP server password.

`HEAD_ADMIN` -> `EMAIL` - This email should be set to something you or a trusted individual can manage. This application relies on **one** head admin that has the role of adding new admins with different roles. When you first launch the server, you will automatically be sent an email (assuming the SMTP server and credentials are correct and the application has read/write access to generate the database file).

### `/client/src/themes/config.json`
`bride` - The bride's name.

`groom` - The groom's name.

`event` - The event name.

### There are other values that you can change as well, if required.

## Enabling Server
Run `npm start` from the base directory (same directory as the README.md).

## TODO (in no particular order):
- [ ] Make generic string replace based on variable name rather than `parseVariables` function in `/server/tools.js`.
- [ ] Organize themes into separate folders
- [ ] Better formatted NoAuth URLs in `/server/server.js`.
- [ ] Modularize `/client/src/admin/AdminPanel.js` as it seems somewhat clumped.
- [ ] Display names of admin types (such as Read Only, Regular, Super, and Head Admin) instead of letting Head Admin input any role ID. 
- [ ] Save latest invitation email in database to make it easier for admins to send invitation email.
- [ ] Add information for all the config variables.
