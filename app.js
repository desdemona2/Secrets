
require('dotenv').config();

const express = require('express');
const parser = require('body-parser');
const ejs = require('ejs');
const path = require('path');

const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const mongoose = require('mongoose');

const app = express();

// Path to static files (javascript or css)
app.use('/public', express.static(path.join(__dirname, "/public")));

// set app to use ejs as view engine
app.set('view engine', 'ejs');

// To parse url encoded response from post request
app.use(parser.urlencoded({extended: true}));


// Create a session middleware
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false
}));

// initialize the passport module
app.use(passport.initialize());

// set passport to be used with session.
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/userDB');


const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.route('/')
    .get(async function(req, res) {
        res.render('home');
    })


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

        req.login(user, function(err, user) {
            if (err) {
                console.log("Some Error occured: " + err);
                res.redirect('/login')
            } else {
                passport.authenticate("local")(req, res, function() {
                    res.redirect('/secrets');
                });
            }
        })
    })

app.get('/secrets', function(req, res) {
    if (req.isAuthenticated()) {
        res.render('secrets');
    } else {
        res.redirect('/login');
    }
});

app.route('/register')
    .get(async function(req, res) {
        res.render('register');
    })
    .post(async function(req, res) {
        // register method is defined in passport-local-mongoose
        User.register({username: req.body.username}, req.body.password, function(err, user) {
            if (err) {
                console.log("Error occured: " + err);
                res.redirect('/register');
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

app.listen(5400, function() {
    console.log("server started on port 5400");
});



