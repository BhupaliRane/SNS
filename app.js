const express = require('express');
const app = express();
const path = require('path');
const formidable = require('express-formidable');
app.use(formidable());

const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
const ObjectId = mongodb.ObjectId;
const http = require('http').createServer(app);
const fs = require('fs');

// app.use(express.static(path.join(__dirname ,'public')))
// app.use(express.static('public'))
app.use('/public', express.static('public'))

app.set('view engine', 'ejs');
// app.use('public', express.static(__dirname + '/public'));


var socketIO = require('socket.io')(http);
var socketID = "";
var users = [];
app.set('socketio', socketIO);


var mainURL = "http://localhost:3000";

socketIO.on('connection', socket =>{
    console.log("user has visited the page using id", socket.id);
    socketID = socket.id;
    app.set('socketID', socketID); 

})
app.set('socketio', socketIO);

app.use('/',require('./routes/index'))

// app.get('/',(req, res) =>{
//     res.render('signup')
// })

// app.post('/signup', (req, res) =>{
//     console.log("woking");
//     res.end("working")
// })

http.listen(3000, () =>{
    console.log("server has started on 3000");   
})  