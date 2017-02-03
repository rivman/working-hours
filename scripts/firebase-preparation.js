// Import config
var cfg = require('../src/config.json')

// Import packages
var isThere = require('is-there')
var write = require('write')
var saveJSON = require('jsonfile')
saveJSON.spaces = 2

// Write project config
if (!isThere('./.firebaserc')) {
  write.sync('./.firebaserc', '{}')
}
saveJSON.writeFileSync('./.firebaserc', {
  'projects': {
    'default': cfg.firebase.authDomain.substr(0, cfg.firebase.authDomain.indexOf('.firebaseapp.com'))
  }
})

// Write Firebase config
var firebaseConfig = {
  hosting: {
    'public': 'dist'
  },
  database: {
    rules: 'database-rules.json'
  }
}
saveJSON.writeFileSync('./firebase.json', firebaseConfig)
