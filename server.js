"use strict";

require("dotenv").config();
const express = require("express");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const mongo = require("mongodb").MongoClient;
const path = require("path");

const routes = require("./routes.js");
const auth = require("./auth.js");

const app = express();
let db;

fccTesting(app); //For FCC testing purposes

// Pretty logging when in dev
if (process.env.NODE_ENV === "development") {
  const morgan = require("morgan");
  app.use(morgan("dev"));
}

app.set("view engine", "pug");
app.set("views", path.join(process.cwd(), "views", "pug"));

mongo.connect(process.env.MONGO_URI, (err, database) => {
  if (err) {
    console.error("Database error: " + err.message);
  } else {
    db = database.db("freecodecamp");
    auth(app, db);
    routes(app, db);
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log("Listening on port " + port);
    });
  }
});
