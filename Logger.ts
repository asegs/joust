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
        target: "pino/file",
        options: {
          destination: `${__dirname}/logs/joust.log`,
        },
      },
    ],
  },
});
