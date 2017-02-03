# Working Hours
Interface to print monthly sheets with working hours, based on Google Calendar.

### How it works

- User maintains two calendars in [Google Calendar](https://calendar.google.com/)
 - One for duty-roster (fast with recurring events)
 - One for working hours (on the go with any calendar application)
- User connects with this interface to Google and could print monthly sheets with working hours

### Requirements

- Admin: Google and Firebase account
- User: Google account
- Developer: Knowledge in [Node.js and npm](https://docs.npmjs.com/getting-started/what-is-npm), [Bootstrap](http://getbootstrap.com/), [Firebase](https://firebase.google.com/)

### Development

- Run `npm install` to install dependencies
- Update *src/config.example.json* and save as *src/config.json*
- Run `npm run dev` to start development server at localhost:8080
  - Code will be checked and fixed as far as possible according [Standard JavaScript](http://standardjs.com/) before
- Run `npm run patch` for version bump and build after bugfixes and improvements
  - Code will be checked and fixed as far as possible according [Standard JavaScript](http://standardjs.com/) before
- Run `npm run minor` for version bump and build after adding new functionality
  - Code will be checked and fixed as far as possible according [Standard JavaScript](http://standardjs.com/) before
- Run `npm run major` for version bump and build after breaking backward-capability
  - Code will be checked and fixed as far as possible according [Standard JavaScript](http://standardjs.com/) before
- Run `npm run deploy` to push latest build to [Firebase Hosting](https://firebase.google.com/docs/hosting/)
- Run `npm run backup` to save Firebase database to *database-backup.json* file
