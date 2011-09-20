#!/usr/bin/env node

var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
    fs = require('fs');

app.listen(8080);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

var connectedUsers = {};

function Story(name){
  this.name = name;
  this.votes = {};
}

var currentStory;

io.sockets.on('connection', function (socket) {
  
  socket.on('startStory', function(data, fn) {
    currentStory = new Story(data.name);
    socket.broadcast.emit('newStory', {name: data.name});
  });
  
  socket.on('user:rename', function(data, fn) {
    var nickname = data.nickname;
    socket.nickname = nickname;
    connectedUsers[nickname] = socket.nickname;
    fn('Yep, got it');
    socket.broadcast.emit('users:list', connectedUsers);
  });

});