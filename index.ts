import express = require("express");
import favicon = require("serve-favicon");
import * as path from "path";
import {
  createTournament,
  getPlayerByEmail,
  getPlayerById,
  getTournamentById,
  getTournaments,
  getTournamentsByName,
  registerPlayerForTournament,
  setAdminById,
  updatePlayer,
  withdrawPlayerFromTournament,
} from "./Database";
import { configureMainWithAuth, getLocalUserEmail } from "./Auth";
import { getRatingsForUser } from "./Rating";

require("dotenv").config();

const app = express();
const port = process.env.PORT;
app.set("view engine", "pug");
app.use(favicon(path.join(__dirname, "public", "images", "favicon.ico")));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public/css"));
configureMainWithAuth(app);

app.listen(port, () => {
  console.log(`Joust running on ${port}`);
});

app.get("/index.js", (req, res) => {
  res.sendFile(path.join(__dirname, "/view/index.js"));
});

app.get("/tournaments/:search", (req, res) => {
  getTournamentsByName(req.params.search).then((result) => res.send(result));
});

app.get("/tournaments", (req, res) => {
  getTournaments().then((result) => res.send(result));
});

app.get("/", async (req, res) => {
  const authedPlayer = res.locals.isAuthenticated
    ? await getPlayerByEmail(getLocalUserEmail(res))
    : null;
  getTournaments().then((result) =>
    res.render("main", { tournaments: result, authedPlayer: authedPlayer }),
  );
});

app.get("/:tournamentId(\\d+)", async (req, res) => {
  const authedPlayer = res.locals.isAuthenticated
    ? await getPlayerByEmail(getLocalUserEmail(res))
    : null;
  getTournamentById(parseInt(req.params.tournamentId)).then((result) =>
    res.render("tournament", {
      tournament: result,
      authedPlayer: authedPlayer,
    }),
  );
});

app.get("/player/:playerId(\\d+)", async (req, res) => {
  const authedPlayer = res.locals.isAuthenticated
    ? await getPlayerByEmail(getLocalUserEmail(res))
    : null;
  getPlayerById(parseInt(req.params.playerId)).then((result) =>
    res.render("player", { player: result, authedPlayer: authedPlayer }),
  );
});

app.post("/player/:playerId(\\d+)/rating", async (req, res) => {
  const authedPlayer = res.locals.isAuthenticated
    ? await getPlayerByEmail(getLocalUserEmail(res))
    : null;
  if (!authedPlayer) {
    res.sendStatus(403);
    return;
  }
  const ratings = await getRatingsForUser(authedPlayer);
  if (Object.values(ratings).length === 0) {
    res.redirect("/player/" + authedPlayer.id);
  }
  const average = (array) => array.reduce((a, b) => a + b) / array.length;
  authedPlayer.neutralRating = average(Object.values(ratings));
  updatePlayer(authedPlayer).then((p) =>
    res.redirect("/player/" + authedPlayer.id),
  );
});

app.get("/create", (req, res) => {
  res.render("new_tournament");
});

app.post("/create", async (req, res) => {
  const authedPlayer = res.locals.isAuthenticated
    ? await getPlayerByEmail(getLocalUserEmail(res))
    : null;
  if (!res.locals.isAuthenticated) {
    res.sendStatus(401);
    return;
  }
  if (!authedPlayer) {
    res.sendStatus(403);
    return;
  }
  createTournament(req.body)
    .then((result) => setAdminById(authedPlayer.id, result.id, "owner"))
    .then((result) => res.redirect("/" + result.tournamentId));
});

app.post("/player/:playerId(\\d+)", async (req, res) => {
  const authedPlayer = res.locals.isAuthenticated
    ? await getPlayerByEmail(getLocalUserEmail(res))
    : null;
  if (!res.locals.isAuthenticated) {
    res.sendStatus(401);
    return;
  }

  if (!authedPlayer || !(authedPlayer.id === parseInt(req.params.playerId))) {
    res.sendStatus(403);
    return;
  }
  if (req.body.neutralRating) {
    req.body.neutralRating = parseInt(req.body.neutralRating);
  } else {
    delete req.body.neutralRating;
  }
  updatePlayer({ ...authedPlayer, ...req.body }).then((p) =>
    res.redirect("/player/" + req.params.playerId),
  );
});

app.post("/register/:tournamentId(\\d+)", async (req, res) => {
  const authedPlayer = res.locals.isAuthenticated
    ? await getPlayerByEmail(getLocalUserEmail(res))
    : null;
  const tournamentId = parseInt(req.params.tournamentId);
  if (!res.locals.isAuthenticated) {
    res.sendStatus(401);
    return;
  }
  if (!authedPlayer) {
    res.sendStatus(403);
    return;
  }
  registerPlayerForTournament(authedPlayer.id, tournamentId).then((p) =>
    res.redirect("/" + tournamentId),
  );
});

app.post("/withdraw/:tournamentId(\\d+)", async (req, res) => {
  const authedPlayer = res.locals.isAuthenticated
    ? await getPlayerByEmail(getLocalUserEmail(res))
    : null;
  const tournamentId = parseInt(req.params.tournamentId);
  if (!res.locals.isAuthenticated) {
    res.sendStatus(401);
    return;
  }
  if (!authedPlayer) {
    res.sendStatus(403);
    return;
  }
  withdrawPlayerFromTournament(authedPlayer.id, tournamentId).then((p) =>
    res.redirect("/" + tournamentId),
  );
});
