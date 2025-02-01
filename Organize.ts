import { Player, Tournament } from "tournament-organizer/components";

const t = new Tournament("test-tournament", "Test tournament");
const p = new Player("123", "Magnus Carlsen");
t.players = [p];
console.log(t);
