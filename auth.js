const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const ObjectID = require("mongodb").ObjectID;
const bcrypt = require("bcrypt");

module.exports = function(app, db) {
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
        } else if (!bcrypt.compareSync(password, user.password)) {
          done(null, false, { message: "Wrong password." });
        } else {
          return done(null, user);
        }
      });
    })
  );
};
