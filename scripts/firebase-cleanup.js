// Import packages
var isThere = require('is-there')
var deleteFiles = require('delete')
var saveJSON = require('jsonfile')
saveJSON.spaces = 2

// Delete Firebase files
if (isThere('./.firebaserc')) {
  deleteFiles.sync(['./.firebaserc'], {force: true})
}
if (isThere('./firebase.json')) {
  deleteFiles.sync(['./firebase.json'], {force: true})
}

// Beautify Firebase backup
if (isThere('./database-backup.json')) {
  var data = require('../database-backup.json')
  saveJSON.writeFileSync('./database-backup.json', data)
}
