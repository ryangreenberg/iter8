(function(exports){

  function User(id, name){
    this.id = id;
    this.name = name || 'unnamed';
  }


  function Iteration(){
    this.users = [];
    this.currentStory = null;
    this.pastStories = [];
  }

  Iteration.prototype.removeUser = function(userId){
    var that = this;
    var users = this.users.filter(function(u){ return u.id == userId; });
    users.forEach(function(u){
      that.users.splice(that.users.indexOf(u), 1);
    });
    delete this.currentStory.votes[userId];
  };

  Iteration.prototype.newStory = function(){
    this.currentStory = new Story('untitled');
  };


  function Story(name){
    this.name = name;
    this.votes = {};
  }

  var serializeObject = function() {
    var json = {
      type: this.constructor.name,
      values: {}
    };
    var serializableProperties = this.constructor._serializableProperties;
    for (var k in this) {
      if (serializableProperties.indexOf(k) !== -1) {
        if (this[k] && this[k].toJSON) {
          json.values[k] = this[k].toJSON();
        } else {
          json.values[k] = this[k];
        }
      }
    }
    return json;
  };

  function makeSerializable(obj, props) {
    obj._serializableProperties = props;
    obj.prototype.toJSON = serializeObject;
  }

  makeSerializable(User, ['name', 'id']);
  makeSerializable(Iteration, ['users', 'currentStory', 'pastStories']);
  makeSerializable(Story, ['name', 'votes']);

  exports.User = User;
  exports.Iteration = Iteration;
  exports.Story = Story;

})(typeof exports == 'undefined' ? iter8.models : exports);