import * as express from "express";
import { Express } from "express";
import * as passport from "passport";
import { createPlayerByEmail, getPlayerByEmail } from "./Database";

export const authRouter = express.Router();
import querystring = require("querystring");
import Auth0Strategy = require("passport-auth0");
import expressSession = require("express-session");

require("dotenv").config();

const onProduction = process.env.ENVIRONMENT === "production";

export const session = {
  secret: process.env.SESSION_SECRET,
  cookie: { secure: onProduction },
  resave: false,
  saveUninitialized: false,
  proxy: onProduction,
};

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

export const strategy = new Auth0Strategy(
  {
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL: process.env.AUTH0_CALLBACK_URL,
  },
  function (accessToken, refreshToken, extraParams, profile, done) {
    return done(null, profile);
  },
);

passport.use(strategy);

authRouter.get(
  "/login",
  passport.authenticate("auth0", {
    scope: "openid email profile",
  }),
  (req, res) => {
    res.redirect("/");
  },
);

authRouter.get("/callback", (req, res, next) => {
  passport.authenticate("auth0", (err, user, info) => {
    getPlayerByEmail(user.emails[0].value).then((p) => {
      if (!p) {
        createPlayerByEmail(user.emails[0].value);
      }
    });
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/login");
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      const returnTo = req.session.returnTo;
      delete req.session.returnTo;
      res.redirect(returnTo || "/");
    });
  })(req, res, next);
});

authRouter.get("/logout", (req, res, next) => {
  req.logOut(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });

  let returnTo = req.protocol + "://" + req.hostname;
  const port = req.connection.localPort;

  if (port !== undefined && port !== 80 && port !== 443) {
    returnTo =
      process.env.NODE_ENV === "production"
        ? `${returnTo}/`
        : `${returnTo}:${port}/`;
  }

  const logoutURL = new URL(`https://${process.env.AUTH0_DOMAIN}/v2/logout`);

  logoutURL.search = querystring.stringify({
    client_id: process.env.AUTH0_CLIENT_ID,
    returnTo: returnTo,
  });
});

export function configureMainWithAuth(router: Express) {
  router.use(passport.initialize());
  router.use(expressSession(session));
  router.use(passport.session());
  router.use("/", authRouter);
  router.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.user = req.user;
    next();
  });
  if (onProduction) {
    router.set("trust proxy", 1);
  }
}

export function getLocalUserEmail(res): string {
  return res.locals.user.emails[0].value;
}
