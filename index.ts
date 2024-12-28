import express = require('express');
import * as path from "path";
import {getTournaments, getTournamentsByName} from "./Database";

const app = express()
const port = 3000

app.listen(port, () => {
    console.log(`Joust running on ${port}`)
})

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, '/view/index.html'));
});

app.get("/index.js", (req, res) => {
    res.sendFile(path.join(__dirname, '/view/index.js'));
})

app.get("/tournaments/:search", (req, res) => {
    getTournamentsByName(req.params.search).then(result => res.send(result));
})

app.get("/tournaments", (req, res) => {
    getTournaments().then(result => res.send(result));
})

