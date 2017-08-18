const log4js = require('log4js');


log4js.configure({
    appenders: {
        out: {
            type: 'console'
        },
        log_meeting: {
            type: 'dateFile',
            filename: './logs/meeting/date',
            alwaysIncludePattern: true,
            pattern: "-yyyy-MM-dd-hh.log",
            maxLogSize: 10
        },
        log_socketClient: {
            type: 'dateFile',
            filename: './logs/socketClient/date',
            alwaysIncludePattern: true,
            pattern: "-yyyy-MM-dd-hh.log"
        }
    },
    categories: {
        default: {
            appenders: ['out'],
            level: 'info'
        },
        log_meeting: {
            appenders: ['log_meeting'],
            level: 'ALL'
        },
        log_socketClient: {
            appenders: ['log_socketClient'],
            level: 'ALL'
        }
    }
});

module.exports = {
    log_meeting: log4js.getLogger('log_meeting'),
    log_socketClient: log4js.getLogger('log_socketClient'),
    out: log4js.getLogger('out')
};