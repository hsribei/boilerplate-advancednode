"use strict";

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const session = require("express-session");
const passport = require("passport");
const mongo = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
const LocalStrategy = require("passport-local");
const path = require("path");

const app = express();
let db;

fccTesting(app); //For FCC testing purposes

// Pretty logging when in dev
if (process.env.NODE_ENV === "development") {
  const morgan = require("morgan");
  app.use(morgan("dev"));
}

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  db.collection("users").findOne({ _id: new ObjectID(id) }, done);
});

passport.use(
  new LocalStrategy(function(username, password, done) {
    db.collection("users").findOne({ username }, (err, user) => {
      console.log(`User ${username} attempted to log in.`);
      if (err) {
        done(err);
      } else if (!user) {
        done(null, false, { message: "User not found." });
      } else if (password !== user.password) {
        done(null, false, { message: "Wrong password." });
      } else {
        return done(null, user);
      }
    });
  })
);

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/");
  }
}

app.set("view engine", "pug");
app.set("views", path.join(process.cwd(), "views", "pug"));

app.use("/public", express.static(process.cwd() + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.route("/").get((req, res) => {
  res.render("index", {
    title: "Hello",
    message: "Please login",
    showLogin: true,
    showRegistration: true
  });
});

app.post(
  "/register",
  (req, res, next) => {
    db
      .collection("users")
      .findOne({ username: req.body.username }, (err, user) => {
        if (err) {
          res.sendStatus(500);
        } else if (user) {
          res.redirect("/");
        } else {
          db
            .collection("users")
            .insertOne(
              { username: req.body.username, password: req.body.password },
              (err, savedUser) => {
                if (err) {
                  res.redirect("/");
                } else {
                  next(null, savedUser);
                }
              }
            );
        }
      });
  },
  passport.authenticate("local", { failureRedirect: "/" }),
  (req, res, next) => {
    console.log(next);
    res.redirect("/profile");
  }
);

app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/profile");
  }
);

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.get("/profile", ensureAuthenticated, (req, res) => {
  res.render("profile", { username: req.user.username });
});

app.use((req, res, next) => {
  res.sendStatus(404);
});

mongo.connect(process.env.MONGO_URI, (err, database) => {
  if (err) {
    console.error("Database error: " + err.message);
  } else {
    db = database.db("freecodecamp");
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log("Listening on port " + port);
    });
  }
});
