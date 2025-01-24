import * as Pino from "pino";
import * as Pretty from "pino-pretty";

const stream = Pretty.PinoPretty({
  levelFirst: true,
  colorize: true,
  ignore: "hostname,pid",
});

const logger = Pino.pino(
  {
    name: "Joust",
    level: "info",
  },
  stream,
);

export const Logger = Pino.pino({
  transport: {
    targets: [
      {
        target: "pino-pretty",
        options: {
          destination: `${__dirname}/logs/joust.log`,
          colorize: false,
          translateTime: "UTC:yyyy-mm-dd HH:MM:ss.l o",
          ignore: "pid",
          levelFirst: true,
        },
      },
    ],
  },
});
