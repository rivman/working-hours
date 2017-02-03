# Working Hours
Interface to print monthly sheets with working hours, based on Google Calendar.

### How it works

- User maintains two calendars in [Google Calendar](https://calendar.google.com/)
 - One for duty-roster (fast with recurring events)
 - One for working hours (on the go with any calendar application)
- User connects with this interface to Google and could print monthly sheets with working hours
- Your working times are checked against the planning

### Calendar rules

- Duty-roster calender has name "Dienstplan"
  - Enter your regular times you have to work - be smart and use recurring events
  - Allowed allday events: *Arbeitsfrei*
- Working hours calendar has name "Arbeitszeiten"
  - Enter day per day your working time - one event per day
  - Allowed allday events:* Urlaub*, *Betriebsfrei*, *Krankheit*, *Gleitzeit*

### Requirements

- User: Google account
- Admin: Google / Firebase account
- Developer: Knowledge in [Node.js and npm](https://docs.npmjs.com/getting-started/what-is-npm), [jQuery](https://jquery.com/), [Bootstrap](http://getbootstrap.com/), [Firebase](https://firebase.google.com/)

### Development

- Run `npm install` to install dependencies
- Create project in the [Firebase Console](https://console.firebase.google.com/)
- Create project in the [Google Developers Console](https://console.developers.google.com/) with Google Calendar API and OAuth2.0 client
- Update *src/config.example.json* and save as *src/config.json*
- Run `npm run dev` to start development server at localhost:8080
  - Code will be checked and fixed as far as possible according [Standard JavaScript](http://standardjs.com/) before
- For code fix according [Standard JavaScript](http://standardjs.com/), version bump and build run
  - `npm run patch` after bugfixes and improvements
  - `npm run minor` after adding new functionality
  - `npm run major` after breaking backward-capability
- Run `npm run deploy` to push latest build to [Firebase Hosting](https://firebase.google.com/docs/hosting/)
- Run `npm run backup` to save Firebase database to *database-backup.json* file
