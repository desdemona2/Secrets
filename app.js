
require('dotenv').config();

const express = require('express');
const parser = require('body-parser');
const ejs = require('ejs');
const path = require('path');

const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
mongoose.connect('mongodb://127.0.0.1:27017/userDB');

const app = express();

// Path to static files (javascript or css)
app.use('/public', express.static(path.join(__dirname, "/public")));

// set app to use ejs as view engine
app.set('view engine', 'ejs');

// To parse url encoded response from post request
app.use(parser.urlencoded({extended: true}));

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const secret = process.env.SECRET_KEY;
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});

const User = mongoose.model("User", userSchema);

app.route('/')
    .get(async function(req, res) {
        res.render('home');
    })


app.route('/login')
    .get(async function(req, res) {
        res.render('login');
    })
    .post(async function(req, res) {
        User.findOne({
            email: req.body.username,
        }).then(doc => {
            console.log(doc)
            if (doc != null && doc.password === req.body.password) {
                res.render('secrets');
            } else {
                res.send("Username/Password you entered is wrong!");
            }
        }).catch(err => {
            console.log("Error: " +err);
            res.send("Some error occured while finding your record!")
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
            .then(doc => {
                console.log(doc);
                res.render('secrets');
            })
            .catch(err => {
                console.log("Some error occured! Error: " + err);
                res.send("Error occured while adding user: " + err);
            });
    })


app.listen(5400, function() {
    console.log("server started on port 5400");
});



