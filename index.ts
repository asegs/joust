import express = require('express');
import * as path from "path";
import {createTournament, getPlayerById, getTournamentById, getTournaments, getTournamentsByName} from "./Database";
import favicon = require('serve-favicon');
import expressSession = require("express-session");
import * as passport from "passport";
require("dotenv").config();
import {authRouter, session, strategy} from "./Auth"

const app = express()
const port = process.env.PORT
app.set('view engine', 'pug');
app.use(favicon(path.join(__dirname,'public','images','favicon.ico')));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public/css'))

app.use(passport.initialize());
app.use(expressSession(session));
app.use(passport.session());
app.use("/", authRouter);

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

app.get("/player/:playerId(\\d+)", (req, res) => {
    getPlayerById(parseInt(req.params.playerId)).then(result => res.render('player', {player: result}))
})

app.get("/create", (req, res) => {
    res.render('new_tournament')
})

app.post("/create", (req, res) => {
    createTournament(req.body).then(result => res.redirect("/" + result.id))
})
