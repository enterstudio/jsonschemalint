var templateUrl = require("ngtemplate!html!./validator.html")

function ValidatorController($scope, $element, $attrs, $log) {

  // Make a *copy* so we don't accidentally effect the parent's version
  this.$onInit = function() {
    this.myDoc = this.doc;
  };

  this.$onChanges = function(changesObj) {
    // If any bound properties, such as validate, parse, doc, etc. change, rerun validation
    // $log.debug(this.identifier + ".$onChanges()", changesObj, JSON.stringify(this.myDoc));

    // We need to be a bit careful - we can't trust this "changesObj" entirely, as it actually represents the projected current & previous values of the *external* model, not our internal model
    let doUpdate = false;
    if (changesObj.hasOwnProperty('doc') && changesObj.doc.currentValue !== this.myDoc) {
      this.myDoc = changesObj.doc.currentValue;
      doUpdate = true;
    }
    if (changesObj.hasOwnProperty('validate') || changesObj.hasOwnProperty('parse')) {
      doUpdate = true;
    }

    if (doUpdate) {
      this.update(this.myDoc);
    }
  };

  let previousDoc = undefined;
  this.update = function(doc) {
    $log.debug(this.identifier + ".update()");
    if (previousDoc !== doc) {
      this.onUpdateDoc({value: doc});
    }
    previousDoc = doc;

    if (!this.validate || !this.parse) {
      // Abort
      return this.messages = [{
        message: "Invalid setup, validator is " + this.validate
      },{
        message: "Invalid setup, parse is " + this.parse
      }];
    }

    this.parse(doc).then(angular.bind(this, function(obj) {
      // Save the object
      this.onUpdateObj({value: obj});
      return obj;
    }), angular.bind(this, function(errors) {
      this.onUpdateObj(null);
      throw errors;
    })).then(angular.bind(this, this.validate)).then(angular.bind(this, function(success) {
      // Successful validation
      $log.debug(this.identifier + ".update()", "Successful validation");
      this.isValid = true;
      return this.messages = [{
        message: this.successMessage
      }];
    }), angular.bind(this, function(errors) {
      // Something went wrong failures
      $log.debug(this.identifier + ".update()", "Errors parsing/validating document", errors);
      this.isValid = false;
      return this.messages = errors;
    }));
  };

  this.format = function (doc) {
    $log.debug(this.identifier + ".format()");
    this.parse(doc).then(this.prettyPrint).then(angular.bind(this, function (text) {
      this.myDoc = text;
      this.update(this.myDoc);
    }));
  };

}

angular.module('app').component('validator', {
  templateUrl: templateUrl,
  controller: ValidatorController,
  bindings: {
    "identifier": "@",
    "title": "@",
    "doc": "<",
    "validate": "<",
    "parse": "<",
    "prettyPrint": "<",
    "successMessage": "<",
    "onUpdateDoc": "&",
    "onUpdateObj": "&",
  }
});