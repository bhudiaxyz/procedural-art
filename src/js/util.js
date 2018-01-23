/*!
 * Procedural Art - Procedurally generated art (procedural-art v1.0.0 - https://github.com/bhudiaxyz/procedural-art)
 *
 * Licensed under MIT (https://github.com/bhudiaxyz/procedural-art/blob/master/LICENSE)
 *
 * Based on works of: https://github.com/alan-luo/planetprocedural and https://github.com/marian42/proceduralart
 */

var Util = {};

(function () {
  "use strict";

  Util = {

    // http://stackoverflow.com/a/1099670/895589
    getQueryParams: function (qs) {
      qs = qs.split('+').join(' ');

      var params = {},
        tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

      while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
      }

      return params;
    },

    // ---------- Useful helper tools ------------

    copy: function (object) {
      return JSON.parse(JSON.stringify(object));
    },

    toTuple: function (coordinate) {
      return {x: coordinate[0], y: coordinate[1]};
    }

  }; // Util

  if (typeof module !== "undefined")
    module.exports = Util;

})();
