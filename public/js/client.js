var iter8 = {
  debug: {
    enabled: true,
    logEvent: function(e, msg) {
      if (iter8.debug.enabled) {
        console.log(msg.eventName, msg.msg);
      }
    }
  },
  // Could be configurable, sent by server
  points: [0,1,2,3,5,8],
  models: {},
  socket: null,

  events: {},
  ui: {},

  // Populated from server
  users: {},
  currentStory: null
};

iter8.send = function(eventName, msg, fn) {
  $(document).trigger('send', {eventName: eventName, msg: msg});
  if (iter8.socket) {
    iter8.socket.emit(eventName, msg, function(rsp){
      $(document).trigger('receive', {eventName: 'rsp', msg: rsp});
      if (fn) {
        fn.apply(this, arguments);
      }
    });
  }
};

iter8.events = {
  userList: function(msg){
    // TODO replace with underscore when I have access to the Internet
    iter8.users = iter8.deserializer.deserialize(msg);
    iter8.ui.updateUsers(iter8.users);
    iter8.debug.logEvent(null, {eventName: 'userList', msg: msg});
  },

  voteList: function(msg){
    iter8.ui.updateVotes(msg);
    iter8.debug.logEvent(null, {eventName: 'voteList', msg: msg});
  },

  votingComplete: function(msg){
    iter8.ui.hideVotingControls();
    iter8.ui.showVotingResults(msg);
    iter8.debug.logEvent(null, {eventName: 'showVotingResults', msg: msg});
  }
};

iter8.ui = {
  toggleVote: function(event) {
    var $this = $(this),
        points = null;

    if ($this.is('.selected')) {
      $this.removeClass('selected');
    } else {
      $('.point-button.selected').removeClass('selected');
      $this.addClass('selected');
      points = $this.data('value');
    }

    iter8.send('vote', points, iter8.events.voteList);
  },

  closeVoting: function() {
    iter8.send('closeVoting', {}, iter8.events.votingComplete);
  },

  updateUsers: function(users) {
    var userIds = users.map(function(u){ return u.id; });
    // Remove existing users who are no longer connected
    $('.connected-users .user').each(function(){
      var userId = $(this).data('user-id');
      if (userIds.indexOf(userId) == -1) {
        $(this).remove();
      }
    });

    // Add new users who have recently connected
    for (var i=0; i < users.length; i++) {
      var user = users[i];
      if ($('.user[data-user-id=' + user.id + ']').length == 0) {
        $('<li class="user" data-user-id=' + user.id + '>' + user.name + '</li>').appendTo('.connected-users');
      }
    };

    $('.user[data-user-id=' + iter8.socket.socket.sessionid + ']').addClass('me');
  },

  updateVotes: function(votesById) {
    // Add new users who have recently connected
    for(var id in votesById) {
      var user = $('.user[data-user-id=' + id + ']');
      if (votesById[id] !== null) {
        user.addClass('voted');
      } else {
        user.removeClass('voted');
      }
    }
  },

  showVotingControls: function() {
    $('.point-buttons').show();
  },

  hideVotingControls: function() {
    $('.point-buttons').hide();
  },

  showVotingResults: function(votesById) {
    $('.results').show();
    var votes = [];
    for (var k in votesById) {
      votes.push(votesById[k]);
    }
    $('.average').text(iter8.util.round(iter8.util.average(votes), 1));
    $('.median').text(iter8.util.round(iter8.util.median(votes), 1));
    iter8.ui.displayDistribution(votes);
  },

  displayDistribution: function(votes) {
    var votesByPoints = iter8.points.reduce(function(hash, votes){
      hash[votes] = 0; return hash;
    }, {});
    votesByPoints = votes.reduce(function(hash, vote) {
      hash[vote]++;
      return hash;
    }, votesByPoints);

    var maxWidth = 340;
    var numVotes = votes.length;

    for (var i=0; i < iter8.points.length; i++) {
      var pointValue = iter8.points[i];
      var $distRow = $('.dist-' + pointValue);
      // TODO Could animate
      var distWidth = Math.round(340 * (votesByPoints[pointValue] / numVotes));
      $distRow.find('.votes-bar').css('width', distWidth);
      $distRow.find('.votes-label').text(votesByPoints[pointValue]);
    }
  },

  changeName: function(){
    var newName = prompt("Enter your name");
    if (newName) {
      $('.me').text(newName);
      iter8.send('nameChange', newName);
    }
  }
};

iter8.util = {
  median: function(arr) {
    arr.sort(function(a, b){ return a - b; });
    var size = arr.length;
    if (size % 2 == 0) {
      return iter8.util.average([ arr[(size / 2) - 1], arr[(size / 2)] ]);
    } else {
      return arr[Math.floor(size / 2)];
    }
  },

  average: function(arr) {
    return iter8.util.sum(arr) / arr.length;
  },

  sum: function(arr) {
    var s = 0;
    for (var i=0; i < arr.length; i++) {
      s += arr[i];
    }
    return s;
  },

  round: function(num, digitsAfterDecimal) {
    digitsAfterDecimal = digitsAfterDecimal || 0;
    var decimalShift = Math.pow(10, digitsAfterDecimal);
    return Math.round(num * decimalShift) / decimalShift;
  },

  // TODO: replace with underscore when I have access to the Internet
  keys: function(obj) {
    var keys = [];
    for (var key in obj) {
      keys.push(key);
    }
    return keys;
  }
};

// Boot
// Event bindings
$(function() {
  iter8.socket = io.connect('http://localhost');
  iter8.deserializer = new iter8.Deserializer(iter8.models);

  // UI
  $('.point-button').click(iter8.ui.toggleVote);
  $('.user.me').live('click', iter8.ui.changeName);
  $('#close-voting').click(iter8.ui.closeVoting);

  // MESSAGES
  iter8.socket.on('userList', iter8.events.userList);
  iter8.socket.on('voteList', iter8.events.voteList);
  iter8.socket.on('votingComplete', iter8.events.votingComplete);

  // DEBUG
  $(document).bind('send', iter8.debug.logEvent);
  $(document).bind('receive', iter8.debug.logEvent);

  $('.point-button, .point-button-label').attr('unselectable', 'on');
});