var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
    fs = require('fs'),
    path = require('path'),
    nodeStatic = require('node-static'),
    pivotal = require('pivotal-tracker'),
    models = require('../lib/models');

app.listen(8080);
console.log("Listening for connections on :8080");
var file = new(nodeStatic.Server)(__dirname + '/../public');

// Load Pivotal Tracker if credentials file exists at .pivotal_credentials.json
var pivotalCredentialsPath = __dirname + '/../.pivotal_credentials.json',
  pivotalCredentials;
if (path.existsSync(pivotalCredentialsPath)) {
  pivotalCredentials = JSON.parse(fs.readFileSync(".pivotal_credentials.json", 'utf8'));
}

function handler (req, rsp) {
  req.addListener('end', function () {
    file.serve(req, rsp);
  });
}

var iteration = new models.Iteration();

if (pivotalCredentials) {
  pivotal.getToken(pivotalCredentials.username, pivotalCredentials.password, function (token) {
    pivotal.getCurrentIteration(pivotalCredentials.projectId, token, function (results) {
      var unpointedStories = results.iterations.iteration.map(function (iteration) {
        return iteration.stories.story;
      })
      .reduce(function (arrayA, arrayB) {
        return arrayA.concat(arrayB);
      })
      .filter(function(story) {
        if (story.story_type == 'feature'  && !story.estimate) {
          return new models.Story(story);
        }
      });

      iteration.stories = unpointedStories;
      iteration.currentStoryIndex = 0;
      iteration.currentStory = iteration.stories[iteration.currentStoryIndex];
    });
  });
}

io.set('log level', 1);

io.sockets.on('connection', function (socket) {
  var user = new models.User(socket.id);
  iteration.users.push(user);

  socket.emit('userList', iteration.users);
  socket.broadcast.emit('userList', iteration.users);

  if (iteration.state == 'voting') {
    socket.emit('voteList', iteration.currentStory.votes);
  } else if (iteration.state == 'viewingResults') {
    socket.emit('votingComplete', iteration.currentStory.votes);
  }

  socket.on('newStory', function(story, fn) {
    // TODO Votes from past story are not cleared when starting a new story
    console.log("user", user.name, "has started a new story", story.name);
    iteration.startStory(story);
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

  socket.on('advanceStory', function() {
    iteration.currentStoryIndex++;
    iteration.startStory(iteration.stories[iteration.currentStoryIndex]);
    socket.emit("storyAdvanced", iteration.currentStory);
  });

});
