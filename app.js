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
Iteration.prototype.removeUser = function(userId){
  delete this.users[userId];
  delete this.currentStory.votes[userId];
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

  socket.on('nameChange', function(newName, fn) {
    user.name = newName;
    socket.emit('userList', iteration.users);
    socket.broadcast.emit('userList', iteration.users);
  });

  socket.on('closeVoting', function(newName, fn) {
    user.name = newName;
    socket.broadcast.emit('votingComplete', iteration.currentStory.votes);
    fn(iteration.currentStory.votes);
  });

  socket.on('disconnect', function() {
    iteration.removeUser(socket.id);
    socket.broadcast.emit('userList', iteration.users);
  });

});