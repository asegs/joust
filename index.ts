import express = require('express');
import * as path from "path";
import {
    createTournament,
    getPlayerByEmail,
    getPlayerById,
    getTournamentById,
    getTournaments,
    getTournamentsByName, registerPlayerForTournament, updatePlayer
} from "./Database";
import favicon = require('serve-favicon');
require("dotenv").config();
import {configureMainWithAuth, getLocalUserEmail} from "./Auth"

const app = express()
const port = process.env.PORT
app.set('view engine', 'pug');
app.use(favicon(path.join(__dirname,'public','images','favicon.ico')));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public/css'))
configureMainWithAuth(app);



app.listen(port, () => {
    console.log(`Joust running on ${port}`)
})

app.get("/index.js", (req, res) => {
    res.sendFile(path.join(__dirname, '/view/index.js'));
})

app.get("/tournaments/:search", (req, res) => {
    getTournamentsByName(req.params.search).then(result => res.send(result));
})

app.get("/tournaments", (req, res) => {
    getTournaments().then(result => res.send(result));
})

app.get("/", (req, res) => {
    getTournaments().then(result => res.render('main', {tournaments: result}));
})

app.get("/:tournamentId(\\d+)", (req, res) => {
    getTournamentById(parseInt(req.params.tournamentId)).then(result => res.render('tournament', {tournament: result}))
})

app.get("/player/:playerId(\\d+)", async (req, res) => {
    const authedPlayer = res.locals.isAuthenticated ? await getPlayerByEmail(getLocalUserEmail(res)) : null;
    getPlayerById(parseInt(req.params.playerId)).then(result => res.render('player', {player: result, authedPlayer: authedPlayer}))
})

app.get("/create", (req, res) => {
    res.render('new_tournament')
})

app.post("/create", (req, res) => {
    if (!res.locals.isAuthenticated) {
        res.sendStatus(401);
        return;
    }
    createTournament(req.body).then(result => res.redirect("/" + result.id))
})

app.post("/player/:playerId(\\d+)", async (req, res) => {
    const authedPlayer = res.locals.isAuthenticated ? await getPlayerByEmail(getLocalUserEmail(res)) : null;
    if (!res.locals.isAuthenticated) {
        res.sendStatus(401);
        return;
    }
    if (!authedPlayer || !(authedPlayer.id === parseInt(req.params.playerId))) {
        res.sendStatus(403);
        return;
    }
    updatePlayer({...authedPlayer, ...req.body}).then(p => res.redirect("/player/" + req.params.playerId))
})

app.post("/register/:tournamentId(\\d+)", async (req, res) => {
    const authedPlayer = res.locals.isAuthenticated ? await getPlayerByEmail(getLocalUserEmail(res)) : null;
    const tournamentId = parseInt(req.params.tournamentId);
    if (!res.locals.isAuthenticated) {
        res.sendStatus(401);
        return;
    }
    if (!authedPlayer) {
        res.sendStatus(403);
        return;
    }
    registerPlayerForTournament(authedPlayer.id, tournamentId).then(p => res.redirect("/" + tournamentId));
})
