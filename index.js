var SourceModifier = require("./lib/source_modifier");
var esprima = require('esprima');

var featureify = function(source, enabled) {
  enabled = enabled || {};
  var sourceModifier = new SourceModifier(source);

  var tree = esprima.parse(source, {
    range: true
  });

  var ranges;
  var walk = function(node) {
    if (node.type === "IfStatement") {
      if (node.test.type === "CallExpression" && node.test.callee) {
        // test object.FEATURES.property
        if (node.test.callee.object &&
            node.test.callee.object.object &&
            node.test.callee.object.property) {
          // test Ember.FEATURES.isEnabled()
          if (node.test.callee.object.object.name === "Ember" &&
              node.test.callee.object.property.name === "FEATURES" &&
              node.test.callee.property.name === "isEnabled") {
            var featureName = node.test.arguments[0].value;
            if (!enabled[featureName]) {
              sourceModifier.replace(node.range[0], node.range[1], "");
            }
          }
        }
      }
    }
    if (node.body && node.body.length > 0) {
      node.body.forEach(walk);
    }
  };
  walk(tree);

  return sourceModifier.toString();
};

module.exports = featureify;