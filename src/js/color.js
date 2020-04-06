var Color = {};

(function() {
  'use strict';

  Color = {

    toHslString: function(color) {
      return 'hsl(' + (color.h % 1.0) * 360 + ', ' + (color.s % 1.0) * 100 + '%, ' + (color.l % 1.0) * 100 + '%)';
    },

    toRgbString: function(color) {
      return 'rgb(' + color.r * 255 + ',' + color.g * 255 + ',' + color.b * 255 + ')';
    },

    toRgbaString: function(color) {
      return 'rgb(' + color.r * 255 + ',' + color.g * 255 + ',' + color.b * 255 + ',' + color.a + ')';
    },

    // http://stackoverflow.com/a/17243070/895589
    /* accepts parameters
     * h  Object = {h:x, s:y, v:z}
     * OR
     * h, s, v
     */
    getRGB: function(h, s, v) {
      while (h > 1) h -= 1;
      while (h < 0) h += 1;

      var r; var g; var b; var i; var f; var p; var q; var t;
      if (h && s === undefined && v === undefined) {
        s = h.s, v = h.v, h = h.h;
      }
      i = Math.floor(h * 6);
      f = h * 6 - i;
      p = v * (1 - s);
      q = v * (1 - f * s);
      t = v * (1 - (1 - f) * s);
      switch (i % 6) {
      case 0:
        r = v, g = t, b = p;
        break;
      case 1:
        r = q, g = v, b = p;
        break;
      case 2:
        r = p, g = v, b = t;
        break;
      case 3:
        r = p, g = q, b = v;
        break;
      case 4:
        r = t, g = p, b = v;
        break;
      case 5:
        r = v, g = p, b = q;
        break;
      }
      return {
        r: Math.floor(r * 255),
        g: Math.floor(g * 255),
        b: Math.floor(b * 255)
      };
    },

    getColorString: function(color, alpha) {
      if (alpha === undefined) {alpha = 1;}
      return 'rgba(' + color.r + ', ' + color.g + ', ' + color.b + ', ' + alpha + ')';
    },

    hslToColor: function(string) {
    }
  }; // Color

  if (typeof module !== 'undefined') {module.exports = Color;}
})();
