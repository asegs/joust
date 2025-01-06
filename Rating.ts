import { Equine } from 'equine'

import ChessWebAPI = require('chess-web-api');
import {Player} from "@prisma/client";
const chessComAsyncClient = new ChessWebAPI();

const lichessAsyncClient = new Equine(process.env.LICHESS_TOKEN)
export async function getLichessUserRating(username: string): Promise<number> {
    // Maybe get other ratings
    return lichessAsyncClient.user.info({username: username})
        .then(userInfo => userInfo.perfs.rapid.rating)
}

export async function getChessComUserRating(username:string):Promise<number> {
    return chessComAsyncClient.getPlayerStats(username)
        .then(playerStats => playerStats.body.chess_rapid.last.rating)
}

export async function getRatingsForUser(user: Player) {
    const ratings = [];
    ratings.push(user.chessComProfile === null ? emptyPromise() : getChessComUserRating(user.chessComProfile));
    ratings.push(user.lichessProfile === null ? emptyPromise() : getLichessUserRating(user.lichessProfile));
    return Promise.all(ratings).then(table => {
        const ratingMap = {};
        if (table[0]) {
            ratingMap['chessCom'] = table[0];
        }
        if (table[1]) {
            ratingMap['lichess'] = table[1];
        }
        return ratingMap;
    })
}

const emptyPromise = () => {
    return new Promise(() => null);
}

