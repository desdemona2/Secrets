
require('dotenv').config();
const express = require('express');
const parser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use('/public', express.static(path.join(__dirname, "/public")));
app.set('view engine', 'ejs');
app.use(parser.urlencoded({extended: true}));

app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/userDB');

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.use(new GoogleStrategy({
        clientID:     process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:5400/auth/google/secrets",
        // userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
        // passReqToCallback   : true
},
function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
    });
}));


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id).then(function(user) {
      if (user == null) {
        console.log("failed to find any user with this id: " + id);
        done(null, null);
      } else {
        done(null, user);
      }
  }).catch(err => {
      console.log("Some error occured: " + err);
      done(null, user);
  });
});


app.route('/')
    .get(async function(req, res) {
        if (req.isAuthenticated()) {
            res.redirect('/secrets');
        } else {
            res.render('home');
        }
    })

app.get('/secrets', function(req, res) {
    if (req.isAuthenticated()) {
        User.find({'secret' :{$ne: null}}).then(function(users) {
            if (users != null) {
                res.render('secrets', {usersSecret: users});
            } else {
                res.render('secrets');
            }
        })
    } else {
        res.redirect('/login');
    }
});

app.get('/auth/google',
    passport.authenticate('google', {scope: ['profile']})
);

app.get('/auth/google/secrets',
    passport.authenticate('google', {failureRedirect: '/login'}),
        function(req, res) {
            console.log("Redirecting...")
            res.redirect("/secrets");
        }
    )


app.route('/login')
    .get(async function(req, res) {
        if (req.isAuthenticated()) {
            res.redirect('/secrets');
        } else {
            res.render('login');
        }
    })
    .post(async function(req, res) {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        })

        req.login(user, function(err) {
            if (err) {
                console.log("Some Error occured: " + err);
                res.send('Error: ' + err.name);
            } else {
                if (user != null) { 
                    console.log("132: authenticate");
                    passport.authenticate("local")(req, res, function() {
                        res.redirect('/secrets');
                    });
                } else {
                    res.redirect('/login');
                }
            }
        })
    })


app.route('/register')
    .get(async function(req, res) {
        if (req.isAuthenticated()) {
            res.redirect('/secrets');
        } else {
            res.render('register');
        }
    })
    .post(async function(req, res) {
        // register method is defined in passport-local-mongoose
        User.register({username: req.body.username}, req.body.password, function(err, user) {
            console.log(req.body.password);
            if (err) {
                console.log("Error occured: " + err);
                res.send(err);
            } else {
                passport.authenticate("local", { failureRedirect: '/login', failureMessage: true })(req, res, function() {
                    res.redirect('/secrets');
                })
            }
        })
    })

app.get('/logout', function(req, res) {
    req.logout(function(err) {
        if (err) {
            console.log("Some Error occured: " + err);
            res.redirect('/');
        } else {
            res.redirect('/');
        }
    });
});


app.route('/submit')
    .get(function(req, res) {
        if (req.isAuthenticated()) {
            res.render('submit');
        } else {
            res.redirect('/login');
        }
    })
    .post(function(req, res) {
        User.findById(req.user.id).then(function(user) {
            if (user) {
                user.secret = req.body.secret;
                user.save().then(function(user) {
                    res.redirect('/secrets');
                }).catch(err => {
                    console.log("Error while saving sec: " + err);
                    res.send("Error while saving secret");
                })
            } else {
                console.log("User not found!")
                res.send("User " + req.user.id + " not found in database");
            }
        }).catch(err => {
            console.log("Some error occured while adding secret")
        });
    })


app.listen(5400, function() {
    console.log("server started on port 5400");
});



