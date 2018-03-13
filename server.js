"use strict";

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const session = require("express-session");
const passport = require("passport");
const mongo = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;

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

app.set("view engine", "pug");

app.use("/public", express.static(process.cwd() + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.route("/").get((req, res) => {
  res.render(process.cwd() + "/views/pug/index.pug", {
    title: "Hello",
    message: "Please login"
  });
});

mongo.connect(process.env.MONGO_URI, (err, database) => {
  if (err) {
    console.error("Database error: " + err.message);
  } else {
    db = database;
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log("Listening on port " + port);
    });
  }
});
