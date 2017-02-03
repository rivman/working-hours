var $ = window.$
var localStorage = window.localStorage
var gapi = window.gapi
var firebase = window.firebase
var config = {}

function initFirebase (onSuccess, onError) {
  if (firebase.apps.length > 0) {
    onSuccess()
    return
  }
  var connected = false
  var fb = firebase.initializeApp(config.firebase)
  fb.database().ref('.info/connected').on('value', function (snapshot) {
    if (snapshot.val() === true) {
      connected = true
      onSuccess()
      return
    }
  })
  setTimeout(function () {
    if (!connected) {
      console.error('Timeout during Firebase initialization')
      onError()
      return
    }
  }, 3000)
}

function loginToGoogle (onSuccess, onError) {
  var provider = new firebase.auth.GoogleAuthProvider()
  provider.addScope('https://www.googleapis.com/auth/calendar.readonly')
  firebase.auth().signInWithPopup(provider).then(function (result) {
    onSuccess()
    return
  }).catch(function (error) {
    console.error('Error on Google login', error)
    onError(error.code)
    return
  })
}

function loadEvents (calendarName, onSuccess, onError) {
  var CLIENT_ID = config.googleClientID
  var SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'
  firebase.auth().currentUser.getToken().then(function (token) {
    gapi.load('client:auth', function () {
      gapi.auth.authorize({
        client_id: CLIENT_ID,
        scope: SCOPES,
        immediate: true
      }, function () {
        gapi.client.load('calendar', 'v3', function () {
          var req = gapi.client.calendar.calendarList.list()
          req.execute(function (resp) {
            if (resp.items) {
              var planCalendarId = null
              for (var i in resp.items) {
                if (resp.items[i].summary === calendarName) {
                  planCalendarId = resp.items[i].id
                }
              }
              if (planCalendarId) {
                gapi.client.request({
                  path: 'calendar/v3/calendars/' + planCalendarId + '/events',
                  params: {maxResults: 2500, singleEvents: true, timeMax: (new Date((new Date()).getFullYear(), (new Date()).getMonth(), (new Date()).getDate() + 1)).toISOString(), timeZone: 'Europe/Berlin', orderBy: 'startTime'}
                }).then(function (resp) {
                  if (resp.status === 200) {
                    if (resp.result.items) {
                      var planEvents = []
                      var e; var event
                      for (var i in resp.result.items) {
                        e = resp.result.items[i]
                        event = {
                          summary: (e.summary && e.summary.trim() !== '' ? e.summary : null),
                          start: (e.start.dateTime ? e.start.dateTime : e.start.date),
                          end: (e.end.dateTime ? e.end.dateTime : e.end.date),
                          description: (e.description && e.description.trim() !== '' ? e.description : null)
                        }
                        planEvents.push(event)
                      }
                      localStorage[(calendarName === 'Dienstplan' ? 'plan' : 'real')] = JSON.stringify(planEvents)
                      onSuccess()
                    }
                  } else {
                    onError(calendarName + '-Einträge konnten nicht geladen werden')
                  }
                })
              } else {
                onError('Erstelle einen Kalender "' + calendarName + '" in <a href="https://calendar.google.com/" target="_blank">Google Kalender</a>')
              }
            } else {
              onError('Kalender "' + calendarName + '" konnte nicht geladen werden')
            }
          })
        })
      })
    })
  })
}

function loadPlan (onSuccess, onError) {
  loadEvents('Dienstplan', onSuccess, onError)
}

function loadReal (onSuccess, onError) {
  loadEvents('Arbeitszeiten', onSuccess, onError)
}

/*
function handleFirebaseInit () {
  var start = new Date()
  $('#init-firebase').addClass('alert-info')
  $('#init-firebase').removeClass('alert-success')
  $('#init-firebase').removeClass('alert-danger')
  $('#init-firebase').html('<i class="fa fa-fw fa-spinner fa-spin"></i>&nbsp;&nbsp;Firebase-Anmeldung läuft ...')
  $('#init-firebase').fadeIn()
  initFirebase(function () {
    $('#init-firebase').addClass('alert-success')
    $('#init-firebase').removeClass('alert-info')
    $('#init-firebase').removeClass('alert-danger')
    $('#init-firebase').html('<i class="fa fa-fw fa-check"></i>&nbsp;&nbsp;Firebase-Anmeldung erfolgreich')
    setTimeout(handleGoogleLogin, Math.max(0, start - new Date() + 400))
  }, function () {
    $('#init-firebase').addClass('alert-danger')
    $('#init-firebase').removeClass('alert-info')
    $('#init-firebase').removeClass('alert-success')
    $('#init-firebase').html('<i class="fa fa-fw fa-warning"></i>&nbsp;&nbsp;Firebase-Anmeldung fehlgeschlagen')
    setTimeout(handleInitError, Math.max(0, start - new Date() + 400))
  })
}
*/

function handleGoogleLogin () {
  var start = new Date()
  $('#init-google').addClass('alert-info')
  $('#init-google').removeClass('alert-danger')
  $('#init-google').removeClass('alert-success')
  $('#init-google').html('<i class="fa fa-fw fa-spinner fa-spin"></i>&nbsp;&nbsp;Google-Anmeldung läuft ...')
  $('#init-google').fadeIn()
  loginToGoogle(function () {
    $('#init-google').removeClass('alert-info')
    $('#init-google').removeClass('alert-danger')
    $('#init-google').addClass('alert-success')
    $('#init-google').html('<i class="fa fa-fw fa-check"></i>&nbsp;&nbsp;Google-Anmeldung erfolgreich')
    setTimeout(handlePlanLoad, Math.max(0, start - new Date() + 400))
  }, function (errCode) {
    $('#init-google').removeClass('alert-info')
    $('#init-google').removeClass('alert-success')
    $('#init-google').addClass('alert-danger')
    $('#init-google').html('<i class="fa fa-fw fa-warning"></i>&nbsp;&nbsp;' + (errCode === 'auth/popup-blocked' ? 'Bitte Popupblocker deaktivieren' : 'Google-Anmeldung fehlgeschlagen'))
    setTimeout(handleInitError, Math.max(0, start - new Date() + 400))
  })
}

function handlePlanLoad () {
  var start = new Date()
  $('#init-plan').removeClass('alert-success')
  $('#init-plan').removeClass('alert-danger')
  $('#init-plan').addClass('alert-info')
  $('#init-plan').html('<i class="fa fa-fw fa-spinner fa-spin"></i>&nbsp;&nbsp;Dienstplan wird geladen ...')
  $('#init-plan').fadeIn()
  loadPlan(function () {
    $('#init-plan').removeClass('alert-info')
    $('#init-plan').removeClass('alert-danger')
    $('#init-plan').addClass('alert-success')
    $('#init-plan').html('<i class="fa fa-fw fa-check"></i>&nbsp;&nbsp;Dienstplan wurde erfolgreich geladen')
    if (!localStorage.real) {
      setTimeout(handleRealLoad, Math.max(0, start - new Date() + 400))
    } else {
      setTimeout(handleInitSuccess, Math.max(0, start - new Date() + 400))
    }
  }, function (errMsg) {
    $('#init-plan').removeClass('alert-info')
    $('#init-plan').removeClass('alert-success')
    $('#init-plan').addClass('alert-danger')
    $('#init-plan').html('<i class="fa fa-fw fa-warning"></i>&nbsp;&nbsp;' + errMsg)
    setTimeout(handleInitError, Math.max(0, start - new Date() + 400))
  })
}

function handleRealLoad () {
  var start = new Date()
  $('#init-real').addClass('alert-info')
  $('#init-real').removeClass('alert-danger')
  $('#init-real').removeClass('alert-success')
  $('#init-real').html('<i class="fa fa-fw fa-spinner fa-spin"></i>&nbsp;&nbsp;Arbeitszeiten werden geladen ...')
  $('#init-real').fadeIn()
  loadReal(function () {
    $('#init-real').removeClass('alert-info')
    $('#init-real').removeClass('alert-danger')
    $('#init-real').addClass('alert-success')
    $('#init-real').html('<i class="fa fa-fw fa-check"></i>&nbsp;&nbsp;Arbeitszeiten wurden erfolgreich geladen')
    setTimeout(handleInitSuccess, Math.max(0, start - new Date() + 400))
  }, function (errMsg) {
    $('#init-real').removeClass('alert-info')
    $('#init-real').removeClass('alert-success')
    $('#init-real').addClass('alert-danger')
    $('#init-real').html('<i class="fa fa-fw fa-warning"></i>&nbsp;&nbsp;' + errMsg)
    setTimeout(handleInitError, Math.max(0, start - new Date() + 400))
  })
}

function handleInitError () {
  $('#init-button').html('<i class="fa fa-fw fa-refresh"></i>&nbsp;&nbsp;Anmeldung erneut versuchen')
  $('#init-button').fadeIn()
  if (firebase.auth().currentUser !== null) {
    $('#init-cancel-button').fadeIn()
  }
}

function handleInitSuccess () {
  $('#init').fadeOut()
  handleAddressUpdate()
  updateView(true)
  setTimeout(function () {
    $('#view').fadeIn()
    $('#init-button').show()
    $('#init-google').hide()
    $('#init-plan').hide()
    $('#init-real').hide()
  }, 400)
}

function handleAddressUpdate () {
  firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/address').on('value', function (snapshot) {
    var address = snapshot.val()
    localStorage.address = JSON.stringify(address)

    // Flex time options
    var flexPlusMinus = address && address.flexPlusMinus ? address.flexPlusMinus : '+'
    var flexHours = address && address.flexHours ? address.flexHours : 0
    var flexMinutes = address && address.flexMinutes ? address.flexMinutes : 0
    $('#edit select[name=flexPlusMinus]').html('<option' + (flexPlusMinus !== '+' ? ' selected' : '') + '>+</option><option' + (flexPlusMinus === '-' ? ' selected' : '') + '>-</option>')
    var hOptions = []
    for (var h = 0; h <= 50; h += 1) {
      hOptions.push('<option' + (h === parseInt(flexHours) ? ' selected' : '') + ' value="' + h + '">' + h + '</option>')
    }
    $('#edit select[name=flexHours]').html(hOptions)
    var mOptions = []
    for (var m = 0; m <= 59; m += 1) {
      mOptions.push('<option' + (m === parseInt(flexMinutes) ? ' selected' : '') + ' value="' + m + '">' + (m < 10 ? '0' : '') + m + '</option>')
    }
    $('#edit select[name=flexMinutes]').html(mOptions)

    if (address && (address.name !== '' || address.street !== '' || address.city !== '')) {
      $('#view-address p').html(address.name + '<br />' + address.street + '<br />' + address.city)
      $('#view-address .editButton').fadeOut()
      $('#edit h4').html('Adresse bearbeiten')
      setTimeout(function () {
        $('#view-address p').fadeIn()
        $('#view-buttons .editButton').fadeIn()
      }, 400)
      $('#edit input[name=name]').val(address.name)
      $('#edit input[name=street]').val(address.street)
      $('#edit input[name=city]').val(address.city)
    } else {
      $('#view-address p').fadeOut()
      $('#view-buttons .editButton').fadeOut()
      $('#edit h4').html('Adresse hinzufügen')
      setTimeout(function () {
        $('#view-address .editButton').fadeIn()
      }, 400)
    }
  })
}

$('[data-toggle=tooltip]').tooltip({trigger: 'hover'})

$('.editButton').on('click', function () {
  $('#edit').modal('show')
})

$('#edit-save').on('click', function () {
  firebase.database().ref('users/' + firebase.auth().currentUser.uid + '/address').set({
    name: $('#edit input[name=name]').val(),
    street: $('#edit input[name=street]').val(),
    city: $('#edit input[name=city]').val(),
    flexPlusMinus: $('#edit select[name=flexPlusMinus]').val(),
    flexHours: $('#edit select[name=flexHours]').val(),
    flexMinutes: $('#edit select[name=flexMinutes]').val()
  })
  $('#edit').modal('hide')
  updateView()
})

$('#refresh-button').on('click', function () {
  $('#refresh-button i').addClass('fa-spin')
  loadPlan(function () {
    loadReal(function () {
      $('#refresh-button i').removeClass('fa-spin')
      $('[data-toggle="tooltip"]').tooltip('hide')
      updateView()
    }, function () {
      $('#refresh-button i').removeClass('fa-spin')
      updateView()
    })
  }, function () {
    $('#refresh-button i').removeClass('fa-spin')
    updateView()
  })
})

function handleLogout () {
  $('body').append('<iframe src="https://www.google.com/accounts/Logout?continue=https://appengine.google.com/_ah/logout" style="display: none"></iframe>')
  firebase.auth().signOut()
  localStorage.removeItem('plan')
  localStorage.removeItem('real')
  localStorage.removeItem('address')
  $('#init-firebase').fadeOut()
  $('#init-google').fadeOut()
  $('#init-plan').fadeOut()
  $('#init-real').fadeOut()
  $('#init-button').fadeIn()
  $('#init-cancel-button').fadeOut()
  $('#init-button').html('<i class="fa fa-fw fa-sign-in"></i>&nbsp;&nbsp; Mit meinem Google-Konto anmelden')
  $('#view').fadeOut()
  $('#edit input[name=name]').val('')
  $('#edit input[name=street]').val('')
  $('#edit input[name=city]').val('')
  setTimeout(function () {
    $('#init').fadeIn()
  }, 400)
}

$('#logout-button').on('click', function () { handleLogout() })
$('#init-cancel-button').on('click', function () { handleLogout() })

$('#init-button').on('click', function () {
  $('#init-firebase').fadeOut()
  $('#init-google').fadeOut()
  $('#init-plan').fadeOut()
  $('#init-real').fadeOut()
  $('#init-button').fadeOut()
  $('#init-cancel-button').fadeOut()
  setTimeout(handleGoogleLogin, 400)
})

var now = new Date()
var date = 'Druck: ' +
           (now.getDate() < 10 ? '0' : '') + now.getDate() + '.' +
           (now.getMonth() < 9 ? '0' : '') + (now.getMonth() + 1) + '.' +
           now.getFullYear()
$('#view-date').html(date)

function dateStr (date) {
  return date.getFullYear() + '-' + (date.getMonth() + 1 < 10 ? '0' : '') + (date.getMonth() + 1) + '-' + (date.getDate() < 10 ? '0' : '') + date.getDate()
}
function timeStr (date, leadingZero) {
  leadingZero = leadingZero || false
  if (date === 0) {
    return '-'
  }
  var minus = date < 0
  if (date < 0) {
    date = -1 * date
  }
  if (typeof date === 'number') {
    var second = 1000
    var minute = second * 60
    var hour = minute * 60
    var hours = Math.floor(date / hour)
    var minutes = Math.floor((date - hours * hour) / minute)
    return (minus ? '-' : '') + (hours < 10 && leadingZero === true ? '0' : '') + hours + ':' + (minutes < 10 ? '0' : '') + minutes
  } else {
    return (minus ? '-' : '') + (date.getHours() < 10 && leadingZero === true ? '0' : '') + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes()
  }
}

function updateView (withoutDelay) {
  withoutDelay = withoutDelay || false

  // Address
  var address = localStorage.address ? JSON.parse(localStorage.address) : null
  if (address !== null) {
    $('#view-address p').html(address.name + '<br />' + address.street + '<br />' + address.city)
    $('#view-address .editButton').hide()
    $('#edit h4').html('Adresse bearbeiten')
    $('#view-address p').show()
    $('#view-buttons .editButton').show()
    $('#edit input[name=name]').val(address.name)
    $('#edit input[name=street]').val(address.street)
    $('#edit input[name=city]').val(address.city)
  } else {
    $('#view-address p').hide()
    $('#view-buttons .editButton').hide()
    $('#edit h4').html('Adresse hinzufügen')
    $('#view-address .editButton').show()
  }

  // Assign values
  var currentMonth = $('#view-month select').val() ? new Date($('#view-month select').val().split('-')[0], $('#view-month select').val().split('-')[1] - 1) : new Date((new Date()).getFullYear(), (new Date()).getMonth())
  var months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
  var days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
  var planEvents = localStorage.plan ? JSON.parse(localStorage.plan) : []
  var realEvents = localStorage.real ? JSON.parse(localStorage.real) : []

  // Split events per day, get min start and max end
  function splitPerDay (events) {
    var perDay = []
    var e; var event; var start; var nextDay
    for (var i in events) {
      e = events[i]

      // Transform start/end to date objects
      e.start = e.start.length > 10 ? new Date(e.start) : new Date(e.start.substr(0, 4), e.start.substr(5, 2) - 1, e.start.substr(8, 2))
      e.end = e.end.length > 10 ? new Date(e.end) : new Date(e.end.substr(0, 4), e.end.substr(5, 2) - 1, e.end.substr(8, 2))

      // Loop per day
      start = new Date(e.start.getFullYear(), e.start.getMonth(), e.start.getDate(), e.start.getHours(), e.start.getMinutes())
      while (start < e.end) {
        // Calculate next day
        nextDay = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1)

        // Create event per day
        event = {
          start: start,
          end: e.end < nextDay ? e.end : nextDay,
          summary: e.summary,
          description: e.description
        }

        // Create day sub array
        if (!perDay[dateStr(start)]) {
          perDay[dateStr(start)] = []
        }

        // Add event
        perDay[dateStr(start)].push(event)

        // Jump to next day
        start = nextDay
      }
    }
    return perDay
  }
  var planPerDay = splitPerDay(planEvents)
  var realPerDay = splitPerDay(realEvents)

  // Get plan min/max days
  var minDay = new Date((new Date()).getFullYear(), (new Date()).getMonth())
  var maxDay = new Date((new Date()).getFullYear(), (new Date()).getMonth(), (new Date()).getDate())
  var parts; var day
  for (var d in planPerDay) {
    parts = d.split('-')
    day = new Date(parts[0], parts[1] - 1, parts[2])
    if (day < minDay) {
      minDay = new Date(day.getFullYear(), day.getMonth(), day.getDate(), day.getHours(), day.getMinutes())
    }
  }

  // Loop days
  var rows = []
  var flexBeforeMonth = 0
  if (localStorage.address) {
    var a = localStorage.address ? JSON.parse(localStorage.address) : {}
    if (a !== null && a.flexPlusMinus && a.flexHours && a.flexMinutes) {
      flexBeforeMonth = (a.flexPlusMinus === '-' ? -1 : 1) * (parseInt(a.flexHours) * 60 + parseInt(a.flexMinutes)) * 60 * 1000
    }
  }
  var errorBeforeMonth = null
  var flexThisMonth = 0
  var planThisMonth = 0
  var realThisMonth = 0
  var errorThisMonth = null
  day = new Date(minDay.getFullYear(), minDay.getMonth(), minDay.getDate())
  var tableStart = currentMonth
  var tableEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, currentMonth.getDate() - 1)
  if (tableEnd > maxDay) tableEnd = new Date(maxDay.getFullYear(), maxDay.getMonth(), maxDay.getDate())
  while (day <= maxDay) {
    var error = null

    // Check plan
    var plan = planPerDay[dateStr(day)] ? planPerDay[dateStr(day)][0] : []
    var planAllday = null
    if (!planPerDay[dateStr(day)]) error = 'Dienstplan vervollständigen'
    else if (planPerDay[dateStr(day)].length > 1) error = 'Überschneidung im Dienstplan beheben'
    else if (plan.start.getHours() === 0 && plan.start.getMinutes() === 0 && plan.end.getHours() === 0 && plan.end.getMinutes() === 0 && plan.summary !== 'Arbeitsfrei') error = 'Ganztägig ist im Dienstplan nur <em>Arbeitsfrei</em> erlaubt'
    else if (plan.start.getHours() === 0 && plan.start.getMinutes() === 0 && plan.end.getHours() === 0 && plan.end.getMinutes() === 0 && plan.summary === 'Arbeitsfrei') planAllday = 'Arbeitsfrei'
    var planTime = planAllday || !planPerDay[dateStr(day)] || error ? 0 : plan.end - plan.start - (plan.end - plan.start > 1000 * 60 * 60 * 6 ? 30 * 60 * 1000 : 0)
    var planBreak = planAllday ? 0 : (plan.end - plan.start > 1000 * 60 * 60 * 6 ? 30 * 60 * 1000 : 0)

    // Check real
    var real = realPerDay[dateStr(day)] ? realPerDay[dateStr(day)][0] : []
    var realAllday = (realPerDay[dateStr(day)] && real.start.getHours() === 0 && real.start.getMinutes() === 0 && real.end.getHours() === 0 && real.end.getMinutes() === 0 && (real.summary === 'Urlaub' || real.summary === 'Gleitzeit' || real.summary === 'Betriebsfrei' || real.summary === 'Krankheit')) ? real.summary : null
    if (!realPerDay[dateStr(day)] && !planAllday && !error) error = 'Arbeitszeit nachtragen'
    else if (realPerDay[dateStr(day)] && realPerDay[dateStr(day)].length > 1 && !error) error = 'Überschneidung der Arbeitszeiten beheben'
    else if (planAllday === 'Arbeitsfrei' && realAllday && !error) error = 'An normalerweise arbeitsfreien Tagen sind nur untertägige Arbeitszeiten erlaubt'
    else if (realPerDay[dateStr(day)] && real.start.getHours() === 0 && real.start.getMinutes() === 0 && real.end.getHours() === 0 && real.end.getMinutes() === 0 && (real.summary !== 'Urlaub' && real.summary !== 'Gleitzeit' && real.summary !== 'Betriebsfrei' && real.summary !== 'Krankheit') && !error) error = 'Ganztägig sind als Arbeitszeit nur <em>Urlaub</em>, <em>Gleitzeit</em>, <em>Betriebsfrei</em> und <em>Krankheit</em> erlaubt'
    var realTime = realAllday && realAllday !== 'Gleitzeit' ? planTime : (realAllday || !realPerDay[dateStr(day)] || error ? 0 : real.end - real.start - (real.end - real.start > 1000 * 60 * 60 * 6 ? 30 * 60 * 1000 : 0))
    var realBreak = realAllday ? planBreak : (real.end - real.start > 1000 * 60 * 60 * 6 ? 30 * 60 * 1000 : 0)

    // Free, but worked
    if (planAllday === 'Arbeitsfrei' && realPerDay[dateStr(day)] && !error) {
      planAllday = null
      planTime = 0
      planBreak = 0
      realTime = real.end - real.start - (real.end - real.start > 1000 * 60 * 60 * 6 ? 30 * 60 * 1000 : 0)
      realBreak = real.end - real.start > 1000 * 60 * 60 * 6 ? 30 * 60 * 1000 : 0
    }

    // Add row to table
    if (day >= tableStart && day <= tableEnd) {
      var row = '<tr' + (error ? ' style="color: red"' : '') + '>' +
                '<td class="text-right">' + days[day.getDay()] + ', ' + day.getDate() + '. ' + months[day.getMonth()] + ' ' + day.getFullYear() + '</td>'
      if (error || planAllday || realAllday === 'Urlaub' || realAllday === 'Betriebsfrei' || realAllday === 'Krankheit') {
        if (real.description) {
          row += '<td class="text-center" colspan="6">' + (error || planAllday || realAllday) + '</td>' +
                '<td class="text-left" style="max-width: 160px; overflow: hidden">' + real.description + '</td>'
        } else {
          row += '<td class="text-center" colspan="7">' + (error || planAllday || realAllday) + '</td>'
        }
      } else if (realAllday === 'Gleitzeit') {
        row += '<td class="text-center" colspan="3">' + (error || planAllday || realAllday) + '</td>' +
               '<td class="text-right">' + timeStr(realTime) + '</td>' +
               '<td class="text-right">' + timeStr(planTime) + '</td>' +
               '<td class="text-right">' + timeStr(realTime - planTime) + '</td>' +
               '<td class="text-left" style="max-width: 160px; overflow: hidden">' + (real.description ? real.description : '') + '</td>'
      } else {
        row += '<td class="text-right">' + timeStr(real.start) + '</td>' +
               '<td class="text-right">' + timeStr(real.end) + '</td>' +
               '<td class="text-right">' + timeStr(realBreak) + '</td>' +
               '<td class="text-right">' + timeStr(realTime) + '</td>' +
               '<td class="text-right">' + timeStr(planTime) + '</td>' +
               '<td class="text-right">' + timeStr(realTime - planTime) + '</td>' +
               '<td class="text-left" style="max-width: 160px; overflow: hidden">' + (real.description ? real.description : '') + '</td>'
      }
      row += '</tr>'
      rows.push(row)
    }

    // Cummulate times
    if (day >= tableStart && day <= tableEnd) {
      planThisMonth += planTime
      realThisMonth += realTime
    }
    if (day < tableStart && error) errorBeforeMonth = true
    else if (day <= tableEnd && error) errorThisMonth = true
    if (day < tableStart) flexBeforeMonth += realTime - planTime
    else if (day <= tableEnd) flexThisMonth += realTime - planTime

    // Increase day
    day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)
  }

  // Build flex time sum
  var errorSum = (errorThisMonth ? '<span style="color: red">Fehlerhafte ' : '') + 'Summe' + (errorThisMonth ? '</span>' : '') + '<br />' +
                 (errorBeforeMonth ? '<span style="color: red">Fehlerhafter ' : '') + 'Übertrag aus dem Vormonat' + (errorBeforeMonth ? '</span>' : '') + '<br />' +
                 '<strong>' + (errorBeforeMonth || errorThisMonth ? '<span style="color: red">Fehlerhafter aktueller' : 'Aktueller') + ' Stand' + (errorBeforeMonth || errorThisMonth ? '</span>' : '') + '</strong>'
  var flexTimeSum = (errorThisMonth ? '<span style="color: red">' : '') + timeStr(flexThisMonth) + (errorThisMonth ? '</span>' : '') + '<br />' +
                 (errorBeforeMonth ? '<span style="color: red">' : '') + timeStr(flexBeforeMonth) + (errorBeforeMonth ? '</span>' : '') + '<br />' +
                 '<strong>' + (errorBeforeMonth || errorThisMonth ? '<span style="color: red">' : '') + timeStr(flexThisMonth + flexBeforeMonth) + (errorBeforeMonth || errorThisMonth ? '</span>' : '') + '</strong>'

  // Fill table
  if (withoutDelay !== true) {
    $('#view table').fadeOut()
  }
  setTimeout(function () {
    $('#view tbody').html(rows)
    $($('#view tfoot td')[0]).html(errorSum)
    $($('#view tfoot td')[1]).html(timeStr(realThisMonth))
    $($('#view tfoot td')[2]).html(timeStr(planThisMonth))
    $($('#view tfoot td')[3]).html(flexTimeSum)

    // Show month selection
    var planStart = new Date(minDay.getFullYear(), minDay.getMonth())
    var planEnd = new Date(maxDay.getFullYear(), maxDay.getMonth() + 1)
    var monthOptions = []
    var month = new Date(planStart.getFullYear(), planStart.getMonth())
    while (month < planEnd) {
      var selected = (month.getFullYear() + '-' + month.getMonth() === currentMonth.getFullYear() + '-' + currentMonth.getMonth() ? ' selected' : '')
      monthOptions.push('<option value="' + month.getFullYear() + '-' + (month.getMonth() + 1) + '"' + selected + '>' + months[month.getMonth()] + ' ' + month.getFullYear() + '</option>')
      month = new Date(month.getFullYear(), month.getMonth() + 1)
    }
    $('#view-month select').html(monthOptions.reverse())
    $('#view h2').html(months[currentMonth.getMonth()])

    if (withoutDelay !== true) {
      $('#view table').fadeIn()
    }
  }, (withoutDelay !== true ? 400 : 0))
}

$('#view-month select').change(function () {
  updateView()
})

// Load config and start application initialization
$.getJSON('config.json', function (json) {
  config = json
  initFirebase(function () {
    if (firebase.auth().currentUser === null) {
      $('#init').fadeIn()
    } else {
      $('#init-button').hide()
      if (!localStorage.plan) {
        $('#init').fadeIn()
        setTimeout(handlePlanLoad, 400)
      } else if (!localStorage.real) {
        $('#init').fadeIn()
        setTimeout(handleRealLoad, 400)
      } else {
        handleAddressUpdate()
        updateView(true)
        $('#view').fadeIn()
      }
    }
  })
})
