import express = require("express");
import favicon = require("serve-favicon");
import * as path from "path";
import { Logger } from "./Logger";
import {
  createTournament,
  deleteTournament,
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
import { getTournament, PAIRING_SYSTEMS, TIEBREAK_SYSTEMS } from "./Organize";
import { Prisma, Player } from "@prisma/client";

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
app.get("/tournaments/:search", async (req, res, next) => {
  try {
    Logger.info("Searched tournaments with " + req.params.search);
    await getTournamentsByName(req.params.search).then((result) =>
      res.send(result),
    );
  } catch (e) {
    next(e);
  }
});

app.get("/tournaments", async (req, res, next) => {
  try {
    Logger.info("Got all tournaments");
    await getTournaments().then((result) => res.send(result));
  } catch (e) {
    next(e);
  }
});

app.get("/", async (req, res, next) => {
  try {
    const authedPlayer = await getAuthedPlayer(req, res);
    Logger.info("Loaded main view");
    await getTournaments().then((result) =>
      res.render("main", { tournaments: result, authedPlayer: authedPlayer }),
    );
  } catch (e) {
    next(e);
  }
});

app.get("/:tournamentId(\\d+)", async (req, res, next) => {
  try {
    const authedPlayer = await getAuthedPlayer(req, res);

    Logger.info("Loaded page for tournament " + req.params.tournamentId);
    await getTournamentById(parseInt(req.params.tournamentId)).then((result) =>
      res.render("tournament", {
        tournament: result,
        authedPlayer: authedPlayer,
      }),
    );
  } catch (e) {
    next(e);
  }
});

app.get("/player/:playerId(\\d+)", async (req, res, next) => {
  try {
    const authedPlayer = await getAuthedPlayer(req, res);
    Logger.info("Loaded page for player " + req.params.playerId);
    await getPlayerById(parseInt(req.params.playerId)).then((result) =>
      res.render("player", { player: result, authedPlayer: authedPlayer }),
    );
  } catch (e) {
    next(e);
  }
});

app.post("/player/:playerId(\\d+)/rating", async (req, res, next) => {
  try {
    const authedPlayer = await basicAuth(req, res);
    if (!authedPlayer) {
      return;
    }
    Logger.info(
      "Requested a rating recalculation for player " + req.params.playerId,
    );
    const ratings = await getRatingsForUser(authedPlayer);
    if (Object.values(ratings).length === 0) {
      res.redirect("/player/" + authedPlayer.id);
      return;
    }
    const average = (array) => array.reduce((a, b) => a + b) / array.length;
    authedPlayer.neutralRating = average(Object.values(ratings));
    await updatePlayer(authedPlayer).then((p) =>
      res.redirect("/player/" + authedPlayer.id),
    );
  } catch (e) {
    next(e);
  }
});

app.get("/create", async (req, res, next) => {
  try {
    Logger.info("Loaded create new tournament page");
    await res.render("new_tournament", {
      pairingOptions: PAIRING_SYSTEMS,
      tiebreakOptions: TIEBREAK_SYSTEMS,
    });
  } catch (e) {
    next(e);
  }
});

app.post("/create", async (req, res, next) => {
  try {
    Logger.info("Attempted to create a new tournament");
    Logger.info(req.body);
    const authedPlayer = await basicAuth(req, res);
    if (!authedPlayer) {
      return;
    }
    await createTournament(req.body)
      .then((result) => setAdminById(authedPlayer.id, result.id, "owner"))
      .then((result) => res.redirect("/" + result.tournamentId));
  } catch (e) {
    next(e);
  }
});

app.post("/player/:playerId(\\d+)", async (req, res, next) => {
  try {
    Logger.info("Attempted to update player " + req.params.playerId);
    Logger.info(req.body);
    const authedPlayer = await basicAuth(req, res);
    if (!authedPlayer) {
      return;
    }
    if (req.body.neutralRating) {
      req.body.neutralRating = parseInt(req.body.neutralRating);
    } else {
      delete req.body.neutralRating;
    }
    await updatePlayer({ ...authedPlayer, ...req.body }).then((p) =>
      res.redirect("/player/" + req.params.playerId),
    );
  } catch (e) {
    next(e);
  }
});

app.post("/register/:tournamentId(\\d+)", async (req, res, next) => {
  try {
    Logger.info(
      "Attempted to register in tournament " + req.params.tournamentId,
    );
    const authedPlayer = await basicAuth(req, res);
    if (!authedPlayer) {
      return;
    }
    const tournamentId = parseInt(req.params.tournamentId);
    await registerPlayerForTournament(authedPlayer.id, tournamentId).then((p) =>
      res.redirect("/" + tournamentId),
    );
  } catch (e) {
    next(e);
  }
});

app.post("/withdraw/:tournamentId(\\d+)", async (req, res, next) => {
  try {
    Logger.info(
      "Attempted to withdraw from tournament " + req.params.tournamentId,
    );
    const authedPlayer = await basicAuth(req, res);
    if (!authedPlayer) {
      return;
    }
    const tournamentId = parseInt(req.params.tournamentId);
    await withdrawPlayerFromTournament(authedPlayer.id, tournamentId).then(
      (p) => res.redirect("/" + tournamentId),
    );
  } catch (e) {
    next(e);
  }
});

// Still sticking with HTML, which only has GET and POST
app.post("/:tournamentId(\\d+)/delete", async (req, res, next) => {
  try {
    Logger.info("Attempted to delete tournament " + req.params.tournamentId);

    const authedPlayer = await basicAuth(req, res);
    if (!authedPlayer) {
      return;
    }
    const tournamentId = parseInt(req.params.tournamentId);
    const deleteKeyword = req.body.key;
    if (deleteKeyword !== "delete") {
      res.redirect("/" + req.params.tournamentId);
      return;
    }
    const tournament = await getTournamentById(tournamentId);
    const admins = tournament["admins"];
    const userIsAdmin = admins
      .map((admin) => admin.playerId)
      .includes(authedPlayer.id);
    if (!userIsAdmin) {
      res.status(403).send("Not an admin, can't delete this tournament.");
      return;
    }
    await deleteTournament(tournamentId).then((t) => res.redirect("/"));
  } catch (e) {
    next(e);
  }
});

app.post("/:tournamentId(\\d+)/pair", async (req, res, next) => {
  try {
    Logger.info("Attempted to pair tournament " + req.params.tournamentId);

    const authedPlayer = await basicAuth(req, res);
    if (!authedPlayer) {
      return;
    }

    const tournamentId = parseInt(req.params.tournamentId);

    const tournament = await getTournamentById(tournamentId);
    const admins = tournament["admins"];
    const userIsAdmin = admins
      .map((admin) => admin.playerId)
      .includes(authedPlayer.id);
    if (!userIsAdmin) {
      res.status(403).send("Not an admin, can't pair this tournament.");
      return;
    }

    const pairingTournament = getTournament(tournament);

    console.log(pairingTournament);
    res.redirect("/" + req.params.tournamentId);
  } catch (e) {
    next(e);
  }
});

app.use((err, req, res, next) => {
  Logger.error(err.message);
  Logger.error(err.stack);
  res.status(500).send("That didn't work...");
});

async function getAuthedPlayer(req, res): Promise<Player> {
  return res.locals.isAuthenticated
    ? await getPlayerByEmail(getLocalUserEmail(res))
    : null;
}

async function basicAuth(req, res): Promise<Player> {
  const authedPlayer = await getAuthedPlayer(req, res);
  if (!res.locals.isAuthenticated) {
    res.sendStatus(401);
    return;
  }
  if (!authedPlayer) {
    res.sendStatus(403);
    return;
  }

  return authedPlayer;
}
