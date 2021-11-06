import emoji from 'node-emoji';
import { createLogger, format, transports } from 'winston';
export default {
  info: (s) => console.log(emoji.emojify(':information_source: ::: ' + s)),
  debug: (s) => console.log(emoji.emojify(':wrench: DEBUG ::: ' + s)),
  warn: (s) => console.log(emoji.emojify(':thinking_face: ' + s)),
  error: (s) => console.log(emoji.emojify(':red_circle: ' + s)),
  success: (s) => console.log(emoji.emojify(':white_check_mark: ' + s))
};

const { combine, timestamp, label, printf, colorize } = format;

const logFormat = printf(({ level, message, label, defaultMeta, timestamp }) => {
  return `${timestamp} [${label}] ${level} - ${JSON.stringify(message)}, ${JSON.stringify(defaultMeta)}`;
});

class Logger {
  private logger;

  constructor() {
    this.logger = createLogger({
      level: process.env.LOGGER_LEVEL || 'info',
      format: combine(label({ label: 'App Logger' }), timestamp(), colorize(), logFormat),
      transports: [new transports.Console()]
    });
  }

  private logHelper(level: string, metadata: object, message: string) {
    this.logger.log({
      level,
      defaultMeta: metadata,
      message
    });
  }

  public debug(message: string, metadata: object) {
    this.logHelper('debug', metadata, message);
  }

  public warn(message: string, metadata: object) {
    this.logHelper('warn', metadata, message);
  }

  public error(message: string, metadata: object) {
    this.logHelper('error', metadata, message);
  }

  public info(message: string, metadata: object) {
    this.logHelper('info', metadata, message);
  }
}

export const logger = new Logger();
