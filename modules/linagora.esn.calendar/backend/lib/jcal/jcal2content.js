'use strict';

var icaljs = require('ical.js');
var moment = require('moment');
var url = require('url');

/**
 * Return a formatted, easily usable data for an email template from a jcal object
 * @param {String} icalendar Representation of a icalendar object as a string.
 * @return {Object} content
 * {
      summary: 'aSummary',
      start: {
        date: '06/12/2015',
        time: '3:00 PM'
      },
      end: {
        date: '06/12/2015',
        time: '3:30 PM'
      },
      location: 'aLocation',
      description: 'aDescription',
      organizer: {
        cn: 'aOrganizer',
        mail: 'aorganizer@linagora.com',
        avatar: 'http://localhost:8080/api/avatars?objectType=user&email=aorganizer@linagora.com'
      },
      attendees: {
        'aattendee@linagora.com>: {
          cn: 'aattendee',
          partstat: 'ACCEPTED',
        },
        'aattendee2@linagora.com>: {
          cn: 'aattendee2',
          partstat: 'NEEDS-ACTION',
        }
      }
   }
 */
function jcal2content(icalendar, baseUrl) {
  var vcalendar = icaljs.Component.fromString(icalendar);
  var vevent = vcalendar.getFirstSubcomponent('vevent');
  var method = vcalendar.getFirstPropertyValue('method');

  var attendees = {};
  vevent.getAllProperties('attendee').forEach(function(attendee) {
    var partstat = attendee.getParameter('partstat');
    var cn = attendee.getParameter('cn');
    var mail = attendee.getFirstValue().replace(/^MAILTO:/i, '');
    attendees[mail] = {
      partstat: partstat,
      cn: cn
    };
  });

  var end;
  if (method === 'CANCEL') {
    end = null
  } else {
    var period = icaljs.Period.fromData({
      start: vevent.getFirstPropertyValue('dtstart'),
      end: vevent.getFirstPropertyValue('dtend') || null,
      duration: vevent.getFirstPropertyValue('duration') || null
    });

    var endDate = moment(moment(period.getEnd().toJSDate()));
    end = {
      date: endDate.format('L'),
      time: endDate.format('LT')
    }
  }

  var organizer = vevent.getFirstProperty('organizer');
  var cn = organizer.getParameter('cn');
  var mail = organizer.getFirstValue().replace(/^MAILTO:/i, '');
  organizer = {
    cn: cn,
    mail: mail,
    avatar: url.resolve(baseUrl, 'api/avatars?objectType=user&email=' + mail)
  };

  var startDate = moment(vevent.getFirstPropertyValue('dtstart').toJSDate());

  var content = {
    summary: vevent.getFirstPropertyValue('summary'),
    location: vevent.getFirstPropertyValue('location'),
    description: vevent.getFirstPropertyValue('description'),
    start: {
      date: startDate.format('L'),
      time: startDate.format('LT')
    },
    end: end,
    attendees: attendees,
    organizer: organizer
  };

  return content;
}

module.exports = jcal2content;
