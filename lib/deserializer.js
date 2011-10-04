(function(exports){
  
  function Deserializer(models, verbose){
    this.models = models;
    this.verbose = verbose || false;
  }

  Deserializer.prototype.deserialize = function(obj) {
    if (obj.type && models[obj.type]) {
      console.log("Using model", models[obj.type], "to deserialize", obj);

      var newObj;

      if (models[obj.type].fromJSON) {
        console.log("Model has a custom fromJSON method");      
      } else {
        console.log("Model has no fromJSON method; doing standard property assignment");
        newObj = new models[obj.type]();
        for (var k in obj.values) {
          newObj[k] = obj.values[k];
        }
      }
      return newObj;
    }
  };

  exports.Deserializer = Deserializer;
  
})(typeof exports == 'undefined' ? iter8 : exports);