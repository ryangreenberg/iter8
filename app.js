require.paths.push('lib');

var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
    fs = require('fs'),
    nodeStatic = require('node-static'),
    models = require('models');

app.listen(8080);
var file = new(nodeStatic.Server)('./public');

function handler (req, rsp) {
  req.addListener('end', function () {
    file.serve(req, rsp);
  });
}

var iteration = new models.Iteration();
iteration.startStory('untitled story');

io.sockets.on('connection', function (socket) {

  var user = new models.User(socket.id);
  iteration.users.push(user);

  socket.emit('userList', iteration.users);
  socket.broadcast.emit('userList', iteration.users);

  socket.emit('newStory', iteration.currentStory);
  if (iteration.state == 'voting') {
    socket.emit('voteList', iteration.currentStory.votes);
  } else if (iteration.state == 'viewingResults') {
    socket.emit('votingComplete', iteration.currentStory.votes);
  }

  socket.on('newStory', function(story, fn) {
    console.log("user", user.name, "has started a new story", story.name);
    iteration.startStory(story.name);
    socket.broadcast.emit('newStory', iteration.currentStory);
    fn(iteration.currentStory);
  });

  socket.on('vote', function(points, fn) {
    console.log('Received vote', points);
    iteration.currentStory.votes[socket.id] = points;
    socket.broadcast.emit('voteList', iteration.currentStory.votes);
    fn(iteration.currentStory.votes);
  });

  socket.on('nameChange', function(newName, fn) {
    user.name = newName;
    var userList = iteration.users;
    // TODO: When someone changes their name, clients lose the current vote state
    socket.emit('userList', userList);
    socket.broadcast.emit('userList', userList);
  });

  socket.on('closeVoting', function(newName, fn) {
    console.log("user", user.name, "has closed voting on the current story");
    iteration.closeVoting();
    socket.broadcast.emit('votingComplete', iteration.currentStory.votes);
    fn(iteration.currentStory.votes);
  });

  socket.on('disconnect', function() {
    console.log("user", user.name, "(", user.id, ") disconnected");
    iteration.removeUser(socket.id);
    socket.broadcast.emit('userList', iteration.users);
  });

});