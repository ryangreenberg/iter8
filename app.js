#!/usr/bin/env node

var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
    fs = require('fs'),
    static = require('node-static');

app.listen(8080);
var file = new(static.Server)('./public');

function handler (req, rsp) {
  req.addListener('end', function () {
    file.serve(req, rsp);
  });
}

function User(id, name){
  this.id = id;
  this.name = name || 'unnamed';
}

function Iteration(){
  this.users = {};
  this.currentStory = null;
  this.pastStories = [];
}
Iteration.prototype.newStory = function(){
  this.currentStory = new Story('untitled');
}

function Story(name){
  this.name = name;
  this.votes = {};
}

var iteration = new Iteration();
iteration.newStory();

io.sockets.on('connection', function (socket) {

  var user = new User(socket.id);
  iteration.users[socket.id] = user;
  socket.emit('userList', iteration.users);
  socket.broadcast.emit('userList', iteration.users);

  socket.on('vote', function(points, fn) {
    console.log('Received vote', points);
    iteration.currentStory.votes[socket.id] = points;
    socket.broadcast.emit('voteList', iteration.currentStory.votes);
    fn(iteration.currentStory.votes);
  });
  
  // socket.on('startStory', function(data, fn) {
  //   currentStory = new Story(data.name);
  //   socket.broadcast.emit('newStory', {name: data.name});
  // });
  
  socket.on('nameChange', function(newName, fn) {
    user.name = newName;
    socket.emit('userList', iteration.users);
    socket.broadcast.emit('userList', iteration.users);
  });

  socket.on('disconnect', function() {
    delete iteration.users[socket.id];
    socket.broadcast.emit('userList', iteration.users);
  });

});