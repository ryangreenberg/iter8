var iter8 = {
  debug: {
    enabled: false,
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
  
  changeName: function(){
    var newName = prompt("Enter your name");
    if (newName) {
      $('.me').text(newName);
      iter8.send('nameChange', newName);
    }
  }
};

// Boot
// Event bindings
$(function() {
  iter8.socket = io.connect('http://localhost');
  
  // UI
  $('.point-button').click(iter8.ui.toggleVote);
  $('.user.me').live('click', iter8.ui.changeName);

  // MESSAGES
  iter8.socket.on('userList', function(msg){
    iter8.ui.updateUsers(msg);
    iter8.debug.logEvent(null, {eventName: 'userList', msg: msg});
  });
  iter8.socket.on('voteList', function(msg){
    iter8.ui.updateVotes(msg);
    iter8.debug.logEvent(null, {eventName: 'voteList', msg: msg});
  });

  // DEBUG
  if (iter8.debug.enabled) {
    $(document).bind('send', iter8.debug.logEvent);    
    $(document).bind('receive', iter8.debug.logEvent);
  }
  
  $('.point-button, .point-button-label').attr('unselectable', 'on');
});