require.paths.push('lib');

var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
    fs = require('fs'),
    nodeStatic = require('node-static'),
    models = require('models'),
    pivotal = require('pivotal-tracker'),
    pivotalCredentials = JSON.parse(fs.readFileSync(".pivotal_credentials.json", 'utf8'));

app.listen(8080);
var file = new(nodeStatic.Server)('./public');

function handler (req, rsp) {
  req.addListener('end', function () {
    file.serve(req, rsp);
  });
}

var iteration = new models.Iteration();

io.sockets.on('connection', function (socket) {

  pivotal.getToken(pivotalCredentials.username, pivotalCredentials.password, function (token) {
    pivotal.getCurrentIteration(pivotalCredentials.projectId, token, function (results) {
      var unpointedStories = results.iterations.iteration.map(function (iteration) {
        var story = iteration.stories.story;
        if (!story.estimate) return story;
      })
      .reduce(function (a, b) {
        return a.concat(b);
      });
      iteration.stories = unpointedStories;
      socket.emit("storiesPopulated", unpointedStories);
    });
  });

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
    // console.log("user", user.name, "has started a new story", story.name);
    console.log('on newStory', story);
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

  // socket.on('storiesPopulated', function(stories) {
  //   iteration.currentStory = stories[0];
  //   socket.emit('newStory', iteration.currentStory);
  // })

});