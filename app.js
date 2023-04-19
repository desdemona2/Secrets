
const express = require('express');
const parser = require('body-parser');
const ejs = require('ejs');
const path = require('path');

const app = express();

// Path to static files (javascript or css)
app.use('/public', express.static(path.join(__dirname, "/public")));

// set app to use ejs as view engine
app.set('view engine', 'ejs');

// To parse url encoded response from post request
app.use(parser.urlencoded({extended: true}));


app.route('/')
    .get(async function(req, res) {
        res.render('home');
    })


app.route('/login')
    .get(async function(req, res) {
        res.render('login');
    })

app.route('/register')
    .get(async function(req, res) {
        res.render('register');
    })


app.listen(5400, function() {
    console.log("server started on port 5400");
});



