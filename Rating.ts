import { Equine } from "equine";

import ChessWebAPI = require("chess-web-api");
import { Player } from "@prisma/client";
const chessComAsyncClient = new ChessWebAPI();

import * as chessComToUscf from "./public/data/chesscom_uscf.json";
import * as lichessToUscf from "./public/data/lichess_uscf.json";

const lichessAsyncClient = new Equine(process.env.LICHESS_TOKEN);
export async function getLichessUserRating(username: string): Promise<number> {
  // Maybe get other ratings
  return lichessAsyncClient.user
    .info({ username: username })
    .then((userInfo) => userInfo.perfs.rapid.rating);
}

//Blocked and throws from DigitalOcean droplet
export async function getChessComUserRating(username: string): Promise<number> {
  return chessComAsyncClient
    .getPlayerStats(username)
    .then((playerStats) => playerStats.body.chess_rapid.last.rating);
}

export async function getRatingsForUser(user: Player) {
  const ratings = [];
  ratings.push(
    !user.chessComProfile
      ? emptyPromise()
      : getChessComUserRating(user.chessComProfile),
  );
  ratings.push(
    !user.lichessProfile
      ? emptyPromise()
      : getLichessUserRating(user.lichessProfile),
  );
  ratings.push(
    !user.uscfProfile ? emptyPromise() : getUscfRatingForId(user.uscfProfile),
  );
  return Promise.all(ratings).then((table) => {
    const ratingMap = {};
    if (table[0]) {
      ratingMap["chessCom"] = mapRatingToUscf(table[0], "chesscom", "rapid");
    }
    if (table[1]) {
      ratingMap["lichess"] = mapRatingToUscf(table[1], "lichess", "rapid");
    }
    if (table[2]) {
      ratingMap["uscf"] = table[2];
    }
    return ratingMap;
  });
}

function getQueryString(id: string): string {
  return (
    "calls=%7B%22run%22%3A%5B%22SearchDisplay%22%2C%22run%22%2C%7B%22return%22%3A%22page%3A1%22%2C%22savedSearch%22%3A%22Member_Player_Search%22%2C%22display%22%3A%22Table%22%2C%22sort%22%3A%5B%5B%22sort_name%22%2C%22ASC%22%5D%5D%2C%22limit%22%3A50%2C%22seed%22%3A" +
    Date.now() +
    "%2C%22filters%22%3A%7B%22Player_Details.Rating%22%3A%7B%7D%2C%22Player_Details.Quick_Rating%22%3A%7B%7D%2C%22Player_Details.Blitz_Rating%22%3A%7B%7D%2C%22Player_Details.Online_Regular_Rating%22%3A%7B%7D%2C%22Player_Details.Online_Blitz_Rating%22%3A%7B%7D%2C%22Player_Details.Online_Quick_Rating%22%3A%7B%7D%2C%22Player_Details.Correspondence_Rating%22%3A%7B%7D%2C%22external_identifier%22%3A%22" +
    id +
    "%22%7D%2C%22afform%22%3A%22afsearchPlayerSearch1%22%7D%5D%7D"
  );
}

export async function getUscfRatingForId(id: string) {
  return fetch("https://new.uschess.org/civicrm/ajax/api4", {
    credentials: "include",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0",
      Accept: "*/*",
      "Accept-Language": "en-US,en;q=0.5",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      Priority: "u=0",
      Pragma: "no-cache",
      "Cache-Control": "no-cache",
    },
    referrer: "https://new.uschess.org/civicrm/player-search",
    body: getQueryString(id),
    method: "POST",
    mode: "cors",
  })
    .then((response) => response.json())
    .then((ob) => ob.run.values[0].data["Player_Details.Rating"]);
}

const emptyPromise = () => {
  return Promise.resolve(0);
};

function mapRatingToUscf(
  rating: number,
  platform: string,
  control: string,
): number {
  const reference = platform === "lichess" ? lichessToUscf : chessComToUscf;
  const categoryTable = reference[control];
  for (let i = 0; i < categoryTable.length; i++) {
    if (i === categoryTable.length - 1) {
      // Provided rating higher than table max
      return categoryTable[i][1];
    }
    const currentRating = categoryTable[i];
    const nextRating = categoryTable[i + 1];
    if (nextRating[0] >= rating) {
      // Player is within this rating band
      const sourceRange = nextRating[0] - currentRating[0];
      // How much the player is rated above the bottom of the range
      const playerRange = rating - currentRating[0];
      const ratingFraction = playerRange / sourceRange;
      const targetRange = nextRating[1] - currentRating[1];
      return ratingFraction * targetRange + currentRating[1];
    }
  }
}
