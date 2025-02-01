import { Player, Tournament } from "tournament-organizer/components";
import { Tournament as DbTournament } from "@prisma/client";

// Probably should be tournament value!
const DEFAULT_RATING = 800;

// Cue prisma freaking out over types...but when I actually create a prisma include type it gets the structure wrong
// https://github.com/prisma/prisma/discussions/10928
export function getPairingsForTournament(tournamentDbObject: DbTournament) {
  const entriesDbList = tournamentDbObject["entries"];
  const players = entriesDbList.map((entry) => {
    const dbPlayer = entry.player;
    const player = new Player(
      String(dbPlayer.id),
      dbPlayer.firstName + " " + dbPlayer.lastName,
    );
    player.active = entry.type === "entry";
    player.value = dbPlayer.neutralRating || DEFAULT_RATING;
    return player;
  });

  const tournament = new Tournament(
    String(tournamentDbObject.id),
    tournamentDbObject.name,
  );
  tournament.players = players;
  tournament.start();
  console.log(tournament);
}
