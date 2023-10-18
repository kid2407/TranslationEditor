export const logger = {
  debugEnabled: false,
  PREFIX: 'Translation Editor',
  levels: ['ERROR, INFO', 'DEBUG'],
  _writeMessage: (message, level) => {
    if (!message || !level) {
      return;
    }

    if (logger.levels.indexOf(level) > 0) {
      if (level === 'DEBUG' && !logger.debugEnabled) {
        return;
      }
      let combinedMessage = logger.PREFIX + ' | ' + level + ' > ';
      const messageIsObject = typeof message === 'object';

      switch (level) {
        case 'ERROR':
          if (messageIsObject) {
            console.error(combinedMessage, message);
          } else {
            console.error(combinedMessage + message);
          }
          break;
        case 'INFO':
        case 'DEBUG':
          if (messageIsObject) {
            console.info(combinedMessage, message);
          } else {
            console.info(combinedMessage + message);
          }
          break;
      }
    }
  },
  debug: (message) => {
    logger._writeMessage(message, 'DEBUG');
  },
  info: (message) => {
    logger._writeMessage(message, 'INFO');
  },
  error: (message) => {
    logger._writeMessage(message, 'ERROR');
  },
};
