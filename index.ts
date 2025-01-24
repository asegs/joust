import express = require("express");
import favicon = require("serve-favicon");
import * as path from "path";
import { Logger } from "./Logger";
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
  Logger.info("Started Joust on port " + process.env.PORT);
});
app.get("/tournaments/:search", (req, res) => {
  Logger.info("Searched tournaments with " + req.params.search);
  getTournamentsByName(req.params.search).then((result) => res.send(result));
});

app.get("/tournaments", (req, res) => {
  Logger.info("Got all tournaments");
  getTournaments().then((result) => res.send(result));
});

app.get("/", async (req, res) => {
  const authedPlayer = res.locals.isAuthenticated
    ? await getPlayerByEmail(getLocalUserEmail(res))
    : null;
  Logger.info("Loaded main view");
  getTournaments().then((result) =>
    res.render("main", { tournaments: result, authedPlayer: authedPlayer }),
  );
});

app.get("/:tournamentId(\\d+)", async (req, res) => {
  const authedPlayer = res.locals.isAuthenticated
    ? await getPlayerByEmail(getLocalUserEmail(res))
    : null;

  Logger.info("Loaded page for tournament " + req.params.tournamentId);
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
  Logger.info("Loaded page for player " + req.params.playerId);
  getPlayerById(parseInt(req.params.playerId)).then((result) =>
    res.render("player", { player: result, authedPlayer: authedPlayer }),
  );
});

app.post("/player/:playerId(\\d+)/rating", async (req, res) => {
  const authedPlayer = res.locals.isAuthenticated
    ? await getPlayerByEmail(getLocalUserEmail(res))
    : null;
  Logger.info(
    "Requested a rating recalculation for player " + req.params.playerId,
  );
  if (!authedPlayer) {
    res.sendStatus(403);
    return;
  }
  try {
    const ratings = await getRatingsForUser(authedPlayer);
    if (Object.values(ratings).length === 0) {
      res.redirect("/player/" + authedPlayer.id);
      return;
    }
    const average = (array) => array.reduce((a, b) => a + b) / array.length;
    authedPlayer.neutralRating = average(Object.values(ratings));
    await updatePlayer(authedPlayer);
    res.redirect("/player/" + authedPlayer.id);
  } catch (e) {
    Logger.error(e);
    res.status(500).send("Failed to recalculate ratings");
  }
});

app.get("/create", (req, res) => {
  Logger.info("Loaded create new tournament page");
  res.render("new_tournament");
});

app.post("/create", async (req, res) => {
  Logger.info("Attempted to create a new tournament");
  Logger.info(req.body);
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
  Logger.info("Attempted to update player " + req.params.playerId);
  Logger.info(req.body);
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
  Logger.info("Attempted to register in tournament " + req.params.tournamentId);
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
  Logger.info(
    "Attempted to withdraw from tournament " + req.params.tournamentId,
  );
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

app.use((err, req, res, next) => {
  Logger.error(err.stack);
  res.status(500).send("That didn't work...");
});
