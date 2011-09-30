var iter8 = {
  debug: {
    enabled: true,
    logEvent: function(e, msg) {
      if (iter8.debug.enabled) {
        console.log(msg.eventName, msg.msg);
      }
    }
  },
  models: {},
  socket: null,
  ui: {}
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

    iter8.send('vote', points, iter8.ui.updateVotes);
  },

  closeVoting: function() {
    iter8.send('closeVoting', {}, iter8.ui.showVotingResults);
  },

  updateUsers: function(usersById) {
    // Remove existing users who are no longer connected
    $('.connected-users .user').each(function(){
      var userId = $(this).data('user-id');
      if (!usersById[userId]) {
        $(this).remove();
      }
    });

    // Add new users who have recently connected
    for(var id in usersById) {
      if ($('.user[data-user-id=' + id + ']').length == 0) {
        $('<li class="user" data-user-id=' + id + '>' + usersById[id].name + '</li>').appendTo('.connected-users');
      }
    }

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

  showVotingResults: function(votesById) {
    var votes = [];
    for (var k in votesById) {
      votes.push(votesById[k]);
    }
    $('.average').text(iter8.util.round(iter8.util.average(votes), 1));
    $('.median').text(iter8.util.round(iter8.util.median(votes), 1));
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
  }
};

// Boot
// Event bindings
$(function() {
  iter8.socket = io.connect('http://localhost');

  // UI
  $('.point-button').click(iter8.ui.toggleVote);
  $('.user.me').live('click', iter8.ui.changeName);
  $('#close-voting').click(iter8.ui.closeVoting);

  // MESSAGES
  iter8.socket.on('userList', function(msg){
    iter8.ui.updateUsers(msg);
    iter8.debug.logEvent(null, {eventName: 'userList', msg: msg});
  });
  iter8.socket.on('voteList', function(msg){
    iter8.ui.updateVotes(msg);
    iter8.debug.logEvent(null, {eventName: 'voteList', msg: msg});
  });
  iter8.socket.on('votingComplete', function(msg){
    iter8.ui.showVotingResults(msg);
    iter8.debug.logEvent(null, {eventName: 'showVotingResults', msg: msg});
  });

  // DEBUG
  $(document).bind('send', iter8.debug.logEvent);
  $(document).bind('receive', iter8.debug.logEvent);

  $('.point-button, .point-button-label').attr('unselectable', 'on');
});