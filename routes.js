const express = require("express");
const bodyParser = require("body-parser");
const passport = require("passport");
const bcrypt = require("bcrypt");

module.exports = function(app, db) {
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect("/");
    }
  }

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
            db.collection("users").insertOne(
              {
                username: req.body.username,
                password: bcrypt.hashSync(req.body.password, 12)
              },
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
};
