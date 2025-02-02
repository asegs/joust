import { Player, Tournament } from "tournament-organizer/components";
import { Tournament as DbTournament } from "@prisma/client";

const MIN_PLAYERS = 2;
const activeTournaments = {};

export function pairTournament(
  tournamentDbObject: DbTournament,
  dryRun: boolean,
) {
  const tournament = getTournament(tournamentDbObject);
}
export function getTournament(tournamentDbObject: DbTournament) {
  if (tournamentDbObject.id in activeTournaments) {
    return activeTournaments[tournamentDbObject.id];
  }

  const tournament = createTournament(tournamentDbObject);
  activeTournaments[tournamentDbObject.id] = tournament;
  return tournament;
}

// Cue prisma freaking out over types...but when I actually create a prisma include type it gets the structure wrong
// https://github.com/prisma/prisma/discussions/10928
function createTournament(tournamentDbObject: DbTournament) {
  const entriesDbList = tournamentDbObject["entries"];
  const players = entriesDbList.map((entry) => {
    const dbPlayer = entry.player;
    const player = new Player(
      String(dbPlayer.id),
      dbPlayer.firstName + " " + dbPlayer.lastName,
    );
    player.active = entry.type === "entry";
    player.value =
      dbPlayer.neutralRating || tournamentDbObject["defaultRating"];
    return player;
  });

  const stageOne = {
    consolation: false,
    format: tournamentDbObject.pairingSystem,
    initialRound: 1,
    maxPlayers: tournamentDbObject.maxPlayers,
    rounds: tournamentDbObject.rounds,
  };

  const settings = {
    bye: 1,
    win: 1,
    draw: 0.5,
    loss: 0,
    tiebreaks: [tournamentDbObject.tiebreakSystem],
  };
  const tournament = new Tournament(
    String(tournamentDbObject.id),
    tournamentDbObject.name,
  );
  tournament.players = players;
  tournament.stageOne = stageOne;
  tournament.settings = settings;
  return tournament;
}

export const PAIRING_SYSTEMS = [
  "single-elimination",
  "double-elimination",
  "stepladder",
  "swiss",
  "round-robin",
  "double-round-robin",
];

export const TIEBREAK_SYSTEMS = [
  "median buchholz",
  "solkoff",
  "sonneborn berger",
  "cumulative",
  "versus",
  "game win percentage",
  "opponent game win percentage",
  "opponent match win percentage",
  "opponent opponent match win percentage",
];
