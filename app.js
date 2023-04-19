
const express = require('express');
const parser = require('body-parser');
const ejs = require('ejs');
const path = require('path');

const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/userDB');

const app = express();

// Path to static files (javascript or css)
app.use('/public', express.static(path.join(__dirname, "/public")));

// set app to use ejs as view engine
app.set('view engine', 'ejs');

// To parse url encoded response from post request
app.use(parser.urlencoded({extended: true}));


const user_schema = new mongoose.Schema({
    email: String,
    password: String
});

const User = mongoose.model("User",  user_schema);

app.route('/')
    .get(async function(req, res) {
        res.render('home');
    })


app.route('/login')
    .get(async function(req, res) {
        res.render('login');
    })
    .post(async function(req, res) {
        User.findOne({email: req.body.username, password: req.body.password})
            .then(doc => {
                if (doc != null) {
                    res.render('secrets');
                } else {
                    res.send('Incorrect username/password');
                }
            })
            .catch(err => {
                res.send("Some error occured! Error: " + err);
            });
    })

app.route('/register')
    .get(async function(req, res) {
        res.render('register');
    })
    .post(async function(req, res) {
        new User({
            email: req.body.username,
            password: req.body.password
        }).save()
            .then(user => {
                console.log("Added user " + user);
                res.render('secrets');
            })
            .catch(err => {
                res.send("Some error occured while creating the user\n Error: " + err);
            })
    })


app.listen(5400, function() {
    console.log("server started on port 5400");
});



