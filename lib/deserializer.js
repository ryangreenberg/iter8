(function(exports){

  function Deserializer(models, verbose){
    this.models = models;
    this.verbose = verbose || false;
  }

  // http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
  function isArray(o) {
    return Object.prototype.toString.call(o) === '[object Array]';
  }

  Deserializer.prototype.deserialize = function(obj) {
    var that = this;
    if (obj.type && this.models[obj.type]) {
      console.log("Using model", this.models[obj.type], "to deserialize", obj);

      var newObj;

      if (this.models[obj.type].fromJSON) {
        console.log("Model has a custom fromJSON method");
      } else {
        console.log("Model has no fromJSON method; doing standard property assignment");
        newObj = new this.models[obj.type]();
        for (var k in obj.values) {
          newObj[k] = obj.values[k];
        }
      }
      return newObj;
    } else if (isArray(obj)) {
      return obj.map(function(e){ return that.deserialize(e); });
    }
  };

  exports.Deserializer = Deserializer;

})(typeof exports == 'undefined' ? iter8 : exports);