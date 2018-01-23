/*!
 * Procedural Art - Procedurally generated art (procedural-art v1.0.0 - https://github.com/bhudiaxyz/procedural-art)
 *
 * Licensed under MIT (https://github.com/bhudiaxyz/procedural-art/blob/master/LICENSE)
 *
 * Based on works of: https://github.com/alan-luo/planetprocedural and https://github.com/marian42/proceduralart
 */

var Draw = {};

(function () {
  "use strict";

  Draw = {

    drawLine: function (point1, point2, context) {
      context.beginPath();
      context.moveTo(point1.x, point1.y);
      context.lineTo(point2.x, point2.y);
      context.stroke();
    },

    strokePath: function (ctx, points) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (var i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    },

    fillPath: function (ctx, points) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (var i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.lineTo(points[0].x, points[0].y);
      ctx.fill();
    },

    // TODO this would be optimized a lot if it didn't set color every time
    drawPixel: function (ctx, position, color) {
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.rect(position.x, position.y, 1, 1);
      ctx.fill();
    },

    drawCircle: function (ctx, position, radius, color) {
      ctx.fillStyle = color;
      ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI);
      ctx.fill();
    },

    alter: function (colorstring, params) {
    }

  }; // Draw

  if (typeof module !== "undefined")
    module.exports = Draw;

})();
