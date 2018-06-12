/*!
 * Procedural Art - Procedurally generated art (procedural-art v1.0.0 - https://github.com/bhudiaxyz/procedural-art)
 *
 * Licensed under MIT (https://github.com/bhudiaxyz/procedural-art/blob/master/LICENSE)
 *
 * Based on works of: https://github.com/alan-luo/planetprocedural and https://github.com/marian42/proceduralart
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ProceduralArt = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (root, factory) {
  if (typeof exports === 'object') {
      module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
      define(factory);
  } else {
      root.Alea = factory();
  }
}(this, function () {

  'use strict';

  // From http://baagoe.com/en/RandomMusings/javascript/

  // importState to sync generator states
  Alea.importState = function(i){
    var random = new Alea();
    random.importState(i);
    return random;
  };

  return Alea;

  function Alea() {
    return (function(args) {
      // Johannes Baagøe <baagoe@baagoe.com>, 2010
      var s0 = 0;
      var s1 = 0;
      var s2 = 0;
      var c = 1;

      if (args.length == 0) {
        args = [+new Date];
      }
      var mash = Mash();
      s0 = mash(' ');
      s1 = mash(' ');
      s2 = mash(' ');

      for (var i = 0; i < args.length; i++) {
        s0 -= mash(args[i]);
        if (s0 < 0) {
          s0 += 1;
        }
        s1 -= mash(args[i]);
        if (s1 < 0) {
          s1 += 1;
        }
        s2 -= mash(args[i]);
        if (s2 < 0) {
          s2 += 1;
        }
      }
      mash = null;

      var random = function() {
        var t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
        s0 = s1;
        s1 = s2;
        return s2 = t - (c = t | 0);
      };
      random.uint32 = function() {
        return random() * 0x100000000; // 2^32
      };
      random.fract53 = function() {
        return random() + 
          (random() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53
      };
      random.version = 'Alea 0.9';
      random.args = args;

      // my own additions to sync state between two generators
      random.exportState = function(){
        return [s0, s1, s2, c];
      };
      random.importState = function(i){
        s0 = +i[0] || 0;
        s1 = +i[1] || 0;
        s2 = +i[2] || 0;
        c = +i[3] || 0;
      };
 
      return random;

    } (Array.prototype.slice.call(arguments)));
  }

  function Mash() {
    var n = 0xefc8249d;

    var mash = function(data) {
      data = data.toString();
      for (var i = 0; i < data.length; i++) {
        n += data.charCodeAt(i);
        var h = 0.02519603282416938 * n;
        n = h >>> 0;
        h -= n;
        h *= n;
        n = h >>> 0;
        h -= n;
        n += h * 0x100000000; // 2^32
      }
      return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
    };

    mash.version = 'Mash 0.9';
    return mash;
  }
}));

},{}],2:[function(require,module,exports){
/*
 * A fast javascript implementation of simplex noise by Jonas Wagner

Based on a speed-improved simplex noise algorithm for 2D, 3D and 4D in Java.
Which is based on example code by Stefan Gustavson (stegu@itn.liu.se).
With Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
Better rank ordering method by Stefan Gustavson in 2012.


 Copyright (c) 2018 Jonas Wagner

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */
(function() {
  'use strict';

  var F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
  var G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
  var F3 = 1.0 / 3.0;
  var G3 = 1.0 / 6.0;
  var F4 = (Math.sqrt(5.0) - 1.0) / 4.0;
  var G4 = (5.0 - Math.sqrt(5.0)) / 20.0;

  function SimplexNoise(randomOrSeed) {
    var random;
    if (typeof randomOrSeed == 'function') {
      random = randomOrSeed;
    }
    else if (randomOrSeed) {
      random = alea(randomOrSeed);
    } else {
      random = Math.random;
    }
    this.p = buildPermutationTable(random);
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    for (var i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }

  }
  SimplexNoise.prototype = {
    grad3: new Float32Array([1, 1, 0,
      -1, 1, 0,
      1, -1, 0,

      -1, -1, 0,
      1, 0, 1,
      -1, 0, 1,

      1, 0, -1,
      -1, 0, -1,
      0, 1, 1,

      0, -1, 1,
      0, 1, -1,
      0, -1, -1]),
    grad4: new Float32Array([0, 1, 1, 1, 0, 1, 1, -1, 0, 1, -1, 1, 0, 1, -1, -1,
      0, -1, 1, 1, 0, -1, 1, -1, 0, -1, -1, 1, 0, -1, -1, -1,
      1, 0, 1, 1, 1, 0, 1, -1, 1, 0, -1, 1, 1, 0, -1, -1,
      -1, 0, 1, 1, -1, 0, 1, -1, -1, 0, -1, 1, -1, 0, -1, -1,
      1, 1, 0, 1, 1, 1, 0, -1, 1, -1, 0, 1, 1, -1, 0, -1,
      -1, 1, 0, 1, -1, 1, 0, -1, -1, -1, 0, 1, -1, -1, 0, -1,
      1, 1, 1, 0, 1, 1, -1, 0, 1, -1, 1, 0, 1, -1, -1, 0,
      -1, 1, 1, 0, -1, 1, -1, 0, -1, -1, 1, 0, -1, -1, -1, 0]),
    noise2D: function(xin, yin) {
      var permMod12 = this.permMod12;
      var perm = this.perm;
      var grad3 = this.grad3;
      var n0 = 0; // Noise contributions from the three corners
      var n1 = 0;
      var n2 = 0;
      // Skew the input space to determine which simplex cell we're in
      var s = (xin + yin) * F2; // Hairy factor for 2D
      var i = Math.floor(xin + s);
      var j = Math.floor(yin + s);
      var t = (i + j) * G2;
      var X0 = i - t; // Unskew the cell origin back to (x,y) space
      var Y0 = j - t;
      var x0 = xin - X0; // The x,y distances from the cell origin
      var y0 = yin - Y0;
      // For the 2D case, the simplex shape is an equilateral triangle.
      // Determine which simplex we are in.
      var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
      if (x0 > y0) {
        i1 = 1;
        j1 = 0;
      } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
      else {
        i1 = 0;
        j1 = 1;
      } // upper triangle, YX order: (0,0)->(0,1)->(1,1)
      // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
      // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
      // c = (3-sqrt(3))/6
      var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
      var y1 = y0 - j1 + G2;
      var x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
      var y2 = y0 - 1.0 + 2.0 * G2;
      // Work out the hashed gradient indices of the three simplex corners
      var ii = i & 255;
      var jj = j & 255;
      // Calculate the contribution from the three corners
      var t0 = 0.5 - x0 * x0 - y0 * y0;
      if (t0 >= 0) {
        var gi0 = permMod12[ii + perm[jj]] * 3;
        t0 *= t0;
        n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0); // (x,y) of grad3 used for 2D gradient
      }
      var t1 = 0.5 - x1 * x1 - y1 * y1;
      if (t1 >= 0) {
        var gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
        t1 *= t1;
        n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1);
      }
      var t2 = 0.5 - x2 * x2 - y2 * y2;
      if (t2 >= 0) {
        var gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;
        t2 *= t2;
        n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2);
      }
      // Add contributions from each corner to get the final noise value.
      // The result is scaled to return values in the interval [-1,1].
      return 70.0 * (n0 + n1 + n2);
    },
    // 3D simplex noise
    noise3D: function(xin, yin, zin) {
      var permMod12 = this.permMod12;
      var perm = this.perm;
      var grad3 = this.grad3;
      var n0, n1, n2, n3; // Noise contributions from the four corners
      // Skew the input space to determine which simplex cell we're in
      var s = (xin + yin + zin) * F3; // Very nice and simple skew factor for 3D
      var i = Math.floor(xin + s);
      var j = Math.floor(yin + s);
      var k = Math.floor(zin + s);
      var t = (i + j + k) * G3;
      var X0 = i - t; // Unskew the cell origin back to (x,y,z) space
      var Y0 = j - t;
      var Z0 = k - t;
      var x0 = xin - X0; // The x,y,z distances from the cell origin
      var y0 = yin - Y0;
      var z0 = zin - Z0;
      // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
      // Determine which simplex we are in.
      var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
      var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
      if (x0 >= y0) {
        if (y0 >= z0) {
          i1 = 1;
          j1 = 0;
          k1 = 0;
          i2 = 1;
          j2 = 1;
          k2 = 0;
        } // X Y Z order
        else if (x0 >= z0) {
          i1 = 1;
          j1 = 0;
          k1 = 0;
          i2 = 1;
          j2 = 0;
          k2 = 1;
        } // X Z Y order
        else {
          i1 = 0;
          j1 = 0;
          k1 = 1;
          i2 = 1;
          j2 = 0;
          k2 = 1;
        } // Z X Y order
      }
      else { // x0<y0
        if (y0 < z0) {
          i1 = 0;
          j1 = 0;
          k1 = 1;
          i2 = 0;
          j2 = 1;
          k2 = 1;
        } // Z Y X order
        else if (x0 < z0) {
          i1 = 0;
          j1 = 1;
          k1 = 0;
          i2 = 0;
          j2 = 1;
          k2 = 1;
        } // Y Z X order
        else {
          i1 = 0;
          j1 = 1;
          k1 = 0;
          i2 = 1;
          j2 = 1;
          k2 = 0;
        } // Y X Z order
      }
      // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
      // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
      // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
      // c = 1/6.
      var x1 = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords
      var y1 = y0 - j1 + G3;
      var z1 = z0 - k1 + G3;
      var x2 = x0 - i2 + 2.0 * G3; // Offsets for third corner in (x,y,z) coords
      var y2 = y0 - j2 + 2.0 * G3;
      var z2 = z0 - k2 + 2.0 * G3;
      var x3 = x0 - 1.0 + 3.0 * G3; // Offsets for last corner in (x,y,z) coords
      var y3 = y0 - 1.0 + 3.0 * G3;
      var z3 = z0 - 1.0 + 3.0 * G3;
      // Work out the hashed gradient indices of the four simplex corners
      var ii = i & 255;
      var jj = j & 255;
      var kk = k & 255;
      // Calculate the contribution from the four corners
      var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
      if (t0 < 0) n0 = 0.0;
      else {
        var gi0 = permMod12[ii + perm[jj + perm[kk]]] * 3;
        t0 *= t0;
        n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0 + grad3[gi0 + 2] * z0);
      }
      var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
      if (t1 < 0) n1 = 0.0;
      else {
        var gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3;
        t1 *= t1;
        n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1 + grad3[gi1 + 2] * z1);
      }
      var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
      if (t2 < 0) n2 = 0.0;
      else {
        var gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3;
        t2 *= t2;
        n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2 + grad3[gi2 + 2] * z2);
      }
      var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
      if (t3 < 0) n3 = 0.0;
      else {
        var gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3;
        t3 *= t3;
        n3 = t3 * t3 * (grad3[gi3] * x3 + grad3[gi3 + 1] * y3 + grad3[gi3 + 2] * z3);
      }
      // Add contributions from each corner to get the final noise value.
      // The result is scaled to stay just inside [-1,1]
      return 32.0 * (n0 + n1 + n2 + n3);
    },
    // 4D simplex noise, better simplex rank ordering method 2012-03-09
    noise4D: function(x, y, z, w) {
      var perm = this.perm;
      var grad4 = this.grad4;

      var n0, n1, n2, n3, n4; // Noise contributions from the five corners
      // Skew the (x,y,z,w) space to determine which cell of 24 simplices we're in
      var s = (x + y + z + w) * F4; // Factor for 4D skewing
      var i = Math.floor(x + s);
      var j = Math.floor(y + s);
      var k = Math.floor(z + s);
      var l = Math.floor(w + s);
      var t = (i + j + k + l) * G4; // Factor for 4D unskewing
      var X0 = i - t; // Unskew the cell origin back to (x,y,z,w) space
      var Y0 = j - t;
      var Z0 = k - t;
      var W0 = l - t;
      var x0 = x - X0; // The x,y,z,w distances from the cell origin
      var y0 = y - Y0;
      var z0 = z - Z0;
      var w0 = w - W0;
      // For the 4D case, the simplex is a 4D shape I won't even try to describe.
      // To find out which of the 24 possible simplices we're in, we need to
      // determine the magnitude ordering of x0, y0, z0 and w0.
      // Six pair-wise comparisons are performed between each possible pair
      // of the four coordinates, and the results are used to rank the numbers.
      var rankx = 0;
      var ranky = 0;
      var rankz = 0;
      var rankw = 0;
      if (x0 > y0) rankx++;
      else ranky++;
      if (x0 > z0) rankx++;
      else rankz++;
      if (x0 > w0) rankx++;
      else rankw++;
      if (y0 > z0) ranky++;
      else rankz++;
      if (y0 > w0) ranky++;
      else rankw++;
      if (z0 > w0) rankz++;
      else rankw++;
      var i1, j1, k1, l1; // The integer offsets for the second simplex corner
      var i2, j2, k2, l2; // The integer offsets for the third simplex corner
      var i3, j3, k3, l3; // The integer offsets for the fourth simplex corner
      // simplex[c] is a 4-vector with the numbers 0, 1, 2 and 3 in some order.
      // Many values of c will never occur, since e.g. x>y>z>w makes x<z, y<w and x<w
      // impossible. Only the 24 indices which have non-zero entries make any sense.
      // We use a thresholding to set the coordinates in turn from the largest magnitude.
      // Rank 3 denotes the largest coordinate.
      i1 = rankx >= 3 ? 1 : 0;
      j1 = ranky >= 3 ? 1 : 0;
      k1 = rankz >= 3 ? 1 : 0;
      l1 = rankw >= 3 ? 1 : 0;
      // Rank 2 denotes the second largest coordinate.
      i2 = rankx >= 2 ? 1 : 0;
      j2 = ranky >= 2 ? 1 : 0;
      k2 = rankz >= 2 ? 1 : 0;
      l2 = rankw >= 2 ? 1 : 0;
      // Rank 1 denotes the second smallest coordinate.
      i3 = rankx >= 1 ? 1 : 0;
      j3 = ranky >= 1 ? 1 : 0;
      k3 = rankz >= 1 ? 1 : 0;
      l3 = rankw >= 1 ? 1 : 0;
      // The fifth corner has all coordinate offsets = 1, so no need to compute that.
      var x1 = x0 - i1 + G4; // Offsets for second corner in (x,y,z,w) coords
      var y1 = y0 - j1 + G4;
      var z1 = z0 - k1 + G4;
      var w1 = w0 - l1 + G4;
      var x2 = x0 - i2 + 2.0 * G4; // Offsets for third corner in (x,y,z,w) coords
      var y2 = y0 - j2 + 2.0 * G4;
      var z2 = z0 - k2 + 2.0 * G4;
      var w2 = w0 - l2 + 2.0 * G4;
      var x3 = x0 - i3 + 3.0 * G4; // Offsets for fourth corner in (x,y,z,w) coords
      var y3 = y0 - j3 + 3.0 * G4;
      var z3 = z0 - k3 + 3.0 * G4;
      var w3 = w0 - l3 + 3.0 * G4;
      var x4 = x0 - 1.0 + 4.0 * G4; // Offsets for last corner in (x,y,z,w) coords
      var y4 = y0 - 1.0 + 4.0 * G4;
      var z4 = z0 - 1.0 + 4.0 * G4;
      var w4 = w0 - 1.0 + 4.0 * G4;
      // Work out the hashed gradient indices of the five simplex corners
      var ii = i & 255;
      var jj = j & 255;
      var kk = k & 255;
      var ll = l & 255;
      // Calculate the contribution from the five corners
      var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0 - w0 * w0;
      if (t0 < 0) n0 = 0.0;
      else {
        var gi0 = (perm[ii + perm[jj + perm[kk + perm[ll]]]] % 32) * 4;
        t0 *= t0;
        n0 = t0 * t0 * (grad4[gi0] * x0 + grad4[gi0 + 1] * y0 + grad4[gi0 + 2] * z0 + grad4[gi0 + 3] * w0);
      }
      var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1 - w1 * w1;
      if (t1 < 0) n1 = 0.0;
      else {
        var gi1 = (perm[ii + i1 + perm[jj + j1 + perm[kk + k1 + perm[ll + l1]]]] % 32) * 4;
        t1 *= t1;
        n1 = t1 * t1 * (grad4[gi1] * x1 + grad4[gi1 + 1] * y1 + grad4[gi1 + 2] * z1 + grad4[gi1 + 3] * w1);
      }
      var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2 - w2 * w2;
      if (t2 < 0) n2 = 0.0;
      else {
        var gi2 = (perm[ii + i2 + perm[jj + j2 + perm[kk + k2 + perm[ll + l2]]]] % 32) * 4;
        t2 *= t2;
        n2 = t2 * t2 * (grad4[gi2] * x2 + grad4[gi2 + 1] * y2 + grad4[gi2 + 2] * z2 + grad4[gi2 + 3] * w2);
      }
      var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3 - w3 * w3;
      if (t3 < 0) n3 = 0.0;
      else {
        var gi3 = (perm[ii + i3 + perm[jj + j3 + perm[kk + k3 + perm[ll + l3]]]] % 32) * 4;
        t3 *= t3;
        n3 = t3 * t3 * (grad4[gi3] * x3 + grad4[gi3 + 1] * y3 + grad4[gi3 + 2] * z3 + grad4[gi3 + 3] * w3);
      }
      var t4 = 0.6 - x4 * x4 - y4 * y4 - z4 * z4 - w4 * w4;
      if (t4 < 0) n4 = 0.0;
      else {
        var gi4 = (perm[ii + 1 + perm[jj + 1 + perm[kk + 1 + perm[ll + 1]]]] % 32) * 4;
        t4 *= t4;
        n4 = t4 * t4 * (grad4[gi4] * x4 + grad4[gi4 + 1] * y4 + grad4[gi4 + 2] * z4 + grad4[gi4 + 3] * w4);
      }
      // Sum up and scale the result to cover the range [-1,1]
      return 27.0 * (n0 + n1 + n2 + n3 + n4);
    }
  };

  function buildPermutationTable(random) {
    var i;
    var p = new Uint8Array(256);
    for (i = 0; i < 256; i++) {
      p[i] = i;
    }
    for (i = 0; i < 255; i++) {
      var r = i + ~~(random() * (256 - i));
      var aux = p[i];
      p[i] = p[r];
      p[r] = aux;
    }
    return p;
  }
  SimplexNoise._buildPermutationTable = buildPermutationTable;

  function alea() {
    // Johannes Baagøe <baagoe@baagoe.com>, 2010
    var s0 = 0;
    var s1 = 0;
    var s2 = 0;
    var c = 1;

    var mash = masher();
    s0 = mash(' ');
    s1 = mash(' ');
    s2 = mash(' ');

    for (var i = 0; i < arguments.length; i++) {
      s0 -= mash(arguments[i]);
      if (s0 < 0) {
        s0 += 1;
      }
      s1 -= mash(arguments[i]);
      if (s1 < 0) {
        s1 += 1;
      }
      s2 -= mash(arguments[i]);
      if (s2 < 0) {
        s2 += 1;
      }
    }
    mash = null;
    return function() {
      var t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
      s0 = s1;
      s1 = s2;
      return s2 = t - (c = t | 0);
    };
  }
  function masher() {
    var n = 0xefc8249d;
    return function(data) {
      data = data.toString();
      for (var i = 0; i < data.length; i++) {
        n += data.charCodeAt(i);
        var h = 0.02519603282416938 * n;
        n = h >>> 0;
        h -= n;
        h *= n;
        n = h >>> 0;
        h -= n;
        n += h * 0x100000000; // 2^32
      }
      return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
    };
  }

  // amd
  if (typeof define !== 'undefined' && define.amd) define(function() {return SimplexNoise;});
  // common js
  if (typeof exports !== 'undefined') exports.SimplexNoise = SimplexNoise;
  // browser
  else if (typeof window !== 'undefined') window.SimplexNoise = SimplexNoise;
  // nodejs
  if (typeof module !== 'undefined') {
    module.exports = SimplexNoise;
  }

})();

},{}],3:[function(require,module,exports){
/*!
 * Procedural Art - Procedurally generated art (procedural-art v1.0.0 - https://github.com/bhudiaxyz/procedural-art)
 *
 * Licensed under MIT (https://github.com/bhudiaxyz/procedural-art/blob/master/LICENSE)
 *
 * Based on works of: https://github.com/alan-luo/planetprocedural and https://github.com/marian42/proceduralart
 */

var Color = {};

(function () {
  "use strict";

  Color = {

    toHslString: function (color) {
      return "hsl(" + color.h % 1.0 * 360 + ", " + color.s % 1.0 * 100 + "%, " + color.l % 1.0 * 100 + "%)";
    },

    toRgbString: function (color) {
      return "rgb(" + color.r * 255 + "," + color.g * 255 + "," + color.b * 255 + ")";
    },

    toRgbaString: function (color) {
      return "rgb(" + color.r * 255 + "," + color.g * 255 + "," + color.b * 255 + "," + color.a + ")";
    },

    // http://stackoverflow.com/a/17243070/895589
    /* accepts parameters
     * h  Object = {h:x, s:y, v:z}
     * OR
     * h, s, v
     */
    getRGB: function (h, s, v) {
      while (h > 1) h -= 1;
      while (h < 0) h += 1;

      var r, g, b, i, f, p, q, t;
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

    getColorString: function (color, alpha) {
      if (alpha === undefined) alpha = 1;
      return 'rgba(' + color.r + ', ' + color.g + ', ' + color.b + ', ' + alpha + ')';
    },

    hslToColor: function (string) {}
  }; // Color

  if (typeof module !== "undefined") module.exports = Color;
})();

},{}],4:[function(require,module,exports){
/*!
 * Procedural Art - Procedurally generated art (procedural-art v1.0.0 - https://github.com/bhudiaxyz/procedural-art)
 *
 * Licensed under MIT (https://github.com/bhudiaxyz/procedural-art/blob/master/LICENSE)
 *
 * Based on works of: https://github.com/alan-luo/planetprocedural and https://github.com/marian42/proceduralart
 */

var Delaunay = {};

(function () {
  "use strict";

  var EPSILON = 1.0 / 1048576.0;

  function supertriangle(vertices) {
    var xmin = Number.POSITIVE_INFINITY,
        ymin = Number.POSITIVE_INFINITY,
        xmax = Number.NEGATIVE_INFINITY,
        ymax = Number.NEGATIVE_INFINITY,
        i,
        dx,
        dy,
        dmax,
        xmid,
        ymid;

    for (i = vertices.length; i--;) {
      if (vertices[i][0] < xmin) xmin = vertices[i][0];
      if (vertices[i][0] > xmax) xmax = vertices[i][0];
      if (vertices[i][1] < ymin) ymin = vertices[i][1];
      if (vertices[i][1] > ymax) ymax = vertices[i][1];
    }

    dx = xmax - xmin;
    dy = ymax - ymin;
    dmax = Math.max(dx, dy);
    xmid = xmin + dx * 0.5;
    ymid = ymin + dy * 0.5;

    return [[xmid - 20 * dmax, ymid - dmax], [xmid, ymid + 20 * dmax], [xmid + 20 * dmax, ymid - dmax]];
  }

  function circumcircle(vertices, i, j, k) {
    var x1 = vertices[i][0],
        y1 = vertices[i][1],
        x2 = vertices[j][0],
        y2 = vertices[j][1],
        x3 = vertices[k][0],
        y3 = vertices[k][1],
        fabsy1y2 = Math.abs(y1 - y2),
        fabsy2y3 = Math.abs(y2 - y3),
        xc,
        yc,
        m1,
        m2,
        mx1,
        mx2,
        my1,
        my2,
        dx,
        dy;

    /* Check for coincident points */
    if (fabsy1y2 < EPSILON && fabsy2y3 < EPSILON) throw new Error("Eek! Coincident points!");

    if (fabsy1y2 < EPSILON) {
      m2 = -((x3 - x2) / (y3 - y2));
      mx2 = (x2 + x3) / 2.0;
      my2 = (y2 + y3) / 2.0;
      xc = (x2 + x1) / 2.0;
      yc = m2 * (xc - mx2) + my2;
    } else if (fabsy2y3 < EPSILON) {
      m1 = -((x2 - x1) / (y2 - y1));
      mx1 = (x1 + x2) / 2.0;
      my1 = (y1 + y2) / 2.0;
      xc = (x3 + x2) / 2.0;
      yc = m1 * (xc - mx1) + my1;
    } else {
      m1 = -((x2 - x1) / (y2 - y1));
      m2 = -((x3 - x2) / (y3 - y2));
      mx1 = (x1 + x2) / 2.0;
      mx2 = (x2 + x3) / 2.0;
      my1 = (y1 + y2) / 2.0;
      my2 = (y2 + y3) / 2.0;
      xc = (m1 * mx1 - m2 * mx2 + my2 - my1) / (m1 - m2);
      yc = fabsy1y2 > fabsy2y3 ? m1 * (xc - mx1) + my1 : m2 * (xc - mx2) + my2;
    }

    dx = x2 - xc;
    dy = y2 - yc;
    return { i: i, j: j, k: k, x: xc, y: yc, r: dx * dx + dy * dy };
  }

  function dedup(edges) {
    var i, j, a, b, m, n;

    for (j = edges.length; j;) {
      b = edges[--j];
      a = edges[--j];

      for (i = j; i;) {
        n = edges[--i];
        m = edges[--i];

        if (a === m && b === n || a === n && b === m) {
          edges.splice(j, 2);
          edges.splice(i, 2);
          break;
        }
      }
    }
  }

  Delaunay = {
    triangulate: function (vertices, key) {
      var n = vertices.length,
          i,
          j,
          indices,
          st,
          open,
          closed,
          edges,
          dx,
          dy,
          a,
          b,
          c;

      /* Bail if there aren't enough vertices to form any triangles. */
      if (n < 3) return [];

      /* Slice out the actual vertices from the passed objects. (Duplicate the
       * array even if we don't, though, since we need to make a supertriangle
       * later on!) */
      vertices = vertices.slice(0);

      if (key) for (i = n; i--;) vertices[i] = vertices[i][key];

      /* Make an array of indices into the vertex array, sorted by the
       * vertices' x-position. */
      indices = new Array(n);

      for (i = n; i--;) indices[i] = i;

      indices.sort(function (i, j) {
        return vertices[j][0] - vertices[i][0];
      });

      /* Next, find the vertices of the supertriangle (which contains all other
       * triangles), and append them onto the end of a (copy of) the vertex
       * array. */
      st = supertriangle(vertices);
      vertices.push(st[0], st[1], st[2]);

      /* Initialize the open list (containing the supertriangle and nothing
       * else) and the closed list (which is empty since we havn't processed
       * any triangles yet). */
      open = [circumcircle(vertices, n + 0, n + 1, n + 2)];
      closed = [];
      edges = [];

      /* Incrementally add each vertex to the mesh. */
      for (i = indices.length; i--; edges.length = 0) {
        c = indices[i];

        /* For each open triangle, check to see if the current point is
         * inside it's circumcircle. If it is, remove the triangle and add
         * it's edges to an edge list. */
        for (j = open.length; j--;) {
          /* If this point is to the right of this triangle's circumcircle,
           * then this triangle should never get checked again. Remove it
           * from the open list, add it to the closed list, and skip. */
          dx = vertices[c][0] - open[j].x;
          if (dx > 0.0 && dx * dx > open[j].r) {
            closed.push(open[j]);
            open.splice(j, 1);
            continue;
          }

          /* If we're outside the circumcircle, skip this triangle. */
          dy = vertices[c][1] - open[j].y;
          if (dx * dx + dy * dy - open[j].r > EPSILON) continue;

          /* Remove the triangle and add it's edges to the edge list. */
          edges.push(open[j].i, open[j].j, open[j].j, open[j].k, open[j].k, open[j].i);
          open.splice(j, 1);
        }

        /* Remove any doubled edges. */
        dedup(edges);

        /* Add a new triangle for each edge. */
        for (j = edges.length; j;) {
          b = edges[--j];
          a = edges[--j];
          open.push(circumcircle(vertices, a, b, c));
        }
      }

      /* Copy any remaining open triangles to the closed list, and then
       * remove any triangles that share a vertex with the supertriangle,
       * building a list of triplets that represent triangles. */
      for (i = open.length; i--;) closed.push(open[i]);
      open.length = 0;

      for (i = closed.length; i--;) if (closed[i].i < n && closed[i].j < n && closed[i].k < n) open.push(closed[i].i, closed[i].j, closed[i].k);

      /* Yay, we're done! */
      return open;
    },

    contains: function (tri, p) {
      /* Bounding box test first, for quick rejections. */
      if (p[0] < tri[0][0] && p[0] < tri[1][0] && p[0] < tri[2][0] || p[0] > tri[0][0] && p[0] > tri[1][0] && p[0] > tri[2][0] || p[1] < tri[0][1] && p[1] < tri[1][1] && p[1] < tri[2][1] || p[1] > tri[0][1] && p[1] > tri[1][1] && p[1] > tri[2][1]) return null;

      var a = tri[1][0] - tri[0][0],
          b = tri[2][0] - tri[0][0],
          c = tri[1][1] - tri[0][1],
          d = tri[2][1] - tri[0][1],
          i = a * d - b * c;

      /* Degenerate tri. */
      if (i === 0.0) return null;

      var u = (d * (p[0] - tri[0][0]) - b * (p[1] - tri[0][1])) / i,
          v = (a * (p[1] - tri[0][1]) - c * (p[0] - tri[0][0])) / i;

      /* If we're outside the tri, fail. */
      if (u < 0.0 || v < 0.0 || u + v > 1.0) return null;

      return [u, v];
    }
  }; // Delaunay

  if (typeof module !== "undefined") module.exports = Delaunay;
})();

},{}],5:[function(require,module,exports){
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

    alter: function (colorstring, params) {}

  }; // Draw

  if (typeof module !== "undefined") module.exports = Draw;
})();

},{}],6:[function(require,module,exports){
/*!
 * Procedural Art - Procedurally generated art (procedural-art v1.0.0 - https://github.com/bhudiaxyz/procedural-art)
 *
 * Licensed under MIT (https://github.com/bhudiaxyz/procedural-art/blob/master/LICENSE)
 *
 * Based on works of: https://github.com/alan-luo/planetprocedural and https://github.com/marian42/proceduralart
 */

const Color = require('./color.js');
const Draw = require('./draw.js');
const Delaunay = require('./delaunay.js');
const Util = require('./util.js');
var Alea = require('alea');
var SimplexNoise = require('simplex-noise');

// ------ Setup some basic stuff ---------

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
ctx.translate(0.5, 0.5);
ctx.webkitImageSmoothingEnabled = true;
ctx.imageSmoothingEnabled = true;
ctx.strokeStyle = "#000000";

// var canvas2 = document.getElementById("canvas2");
// var ctx2 = canvas2.getContext('2d');
// ctx2.save();
// ctx2.webkitImageSmoothingEnabled = true;
// ctx2.imageSmoothingEnabled = true;

var LOWER_LEFT = { x: canvas.width, y: canvas.height };
var LOWER_RIGHT = { x: 0, y: canvas.height };
var UPPER_LEFT = { x: canvas.width, y: 0 };
var UPPER_RIGHT = { x: 0, y: 0 };

var random = new Alea();
var simplex = new SimplexNoise(random); // noise is from -1.0 to 1.0

// ---------- Useful helper tools ------------

function randomColor(brightness) {
  var randH, randS, randL;
  if (brightness === "dark") {
    randH = random();
    randS = random() * 0.4 + 0.3;
    randL = random() * 0.14 + 0.05;
  } else if (brightness === "medium") {
    randH = random();
    randS = random() * 0.35 + 0.7;
    randL = random() * 0.2 + 0.4;
  } else if (brightness === "light") {
    randH = random();
    randS = random() * 0.4 + 0.3;
    randL = random() * 0.2 + 0.7;
  } else {
    randH = random();
    randS = random();
    randL = random();
  }
  return { h: randH, s: randS, l: randL };
}

function rollingMountainNoise(x, z) {
  return simplex.noise2D(z, x) + 0.5 * simplex.noise2D(0, 2 * x);
}

function mountainNoise(x, z) {
  return simplex.noise2D(z, x) + 0.5 * simplex.noise2D(0, 2 * x) + 0.25 * simplex.noise2D(0, 4 * x) + 0.125 * simplex.noise2D(0, 8 * x);
}

// 1 octave
function hillNoise(x, z) {
  return simplex.noise2D(z, x);
}

// 4 octave
function rollingHillNoise(x, z) {
  return octave2D(z, x, 4);
}

function octave2D(x, y, octaves, lowerCap, upperCap) {
  if (!octaves) octaves = 6;
  if (!lowerCap) lowerCap = 0;
  if (!upperCap) upperCap = 1;

  var v = 0;
  for (var i = 1; i <= octaves; i++) {
    var pow2 = Math.pow(2, i - 1);
    var s = simplex.noise2D(x * pow2, y * pow2) / 2 + 0.5;
    v += s * Math.pow(2, -i);
  }

  if (v < lowerCap) return 0;
  if (v > upperCap) return 1;
  return (v - lowerCap) / (upperCap - lowerCap);
}

// ------ Setup scene stuff ---------

var scene = {
  time: "day",
  random: random,
  simplex: simplex,
  hillNoise: hillNoise,
  mountainNoise: mountainNoise,
  enabled: {
    sky: true,
    hills: true,
    mountains: true,
    stars: true,
    planet: true,
    clouds: true,
    trees: true,
    river: true
  },
  colors: {
    base: {},
    sky: {},
    sky2: {},
    hills: {},
    mountains: {},
    stars: {},
    planet: {},
    clouds: {},
    trees: {},
    leaves: {},
    river: {}
  },
  maxValue: 0,
  clickBoxes: []
};

// ------ Randomize some generation properties ---------

if (random() > 0.33) {
  if (random() > 0.33) {
    scene.time = "desert";
  } else {
    scene.time = "night";
  }
}
if (random() > 0.5) {
  scene.hillNoise = rollingHillNoise;
}
if (random() > 0.5) {
  scene.mountainNoise = rollingMountainNoise;
}

var infoCtx = document.getElementById("info");
infoCtx.innerHTML = "Time of day: " + scene.time + " (Hills: " + scene.hillNoise.name + ", Mountains: " + scene.mountainNoise.name + ")";

// generate colors:
if (scene.time === "night") {

  var base = randomColor("dark");
  scene.colors.base = base;
  scene.colors.mountains = { h: base.h + random() * 0.2 - 0.1, s: base.s + random() * 0.2 - 0.1, l: base.l + random() * 0.1 + 0.15 };
  scene.colors.hills = { h: scene.colors.mountains.h + random() * 0.2 - 0.1, s: scene.colors.mountains.s + random() * 0.2 - 0.1, l: scene.colors.mountains.l + random() * 0.1 + 0.15 };
  scene.colors.river = { h: base.h, s: base.s - random() * 0.1 - 0.05, l: base.l + random() * 0.1 - 0.05 };
  scene.colors.sky = { h: base.h, s: base.s, l: base.l - 0.1 };
  scene.colors.sky2 = { h: base.h, s: base.s, l: base.l - 0.2 - random() * 0.2 };
  scene.colors.clouds = { h: base.h, s: 0.4, l: 0.2 };
  scene.colors.trees = { h: base.h + 0.5, s: 0.4, l: 0.2 };
  scene.colors.leaves = { h: scene.colors.trees.h + 0.5, s: 0.6, l: 0.5 };
  scene.colors.leaves2 = { h: scene.colors.trees.h + 0.4, s: 0.6, l: 0.5 };
  scene.colors.planet = { h: scene.colors.hills.h, s: 0.4, l: 0.4 };
} else if (scene.time === "day") {

  var base = randomColor("medium");
  scene.colors.base = base;
  scene.colors.mountains = { h: base.h + 0.4 + random() * 0.1, s: 0.2 + random() * 0.2, l: base.l + random() * 0.1 - 0.05 };
  scene.colors.hills = { h: scene.colors.mountains.h + random() * 0.2 - 0.1, s: 0.4 + random() * 0.2, l: base.l + random() * 0.1 };
  scene.colors.river = { h: base.h, s: base.s - random() * 0.1 - 0.05, l: base.l + random() * 0.1 + 0.2 };
  scene.colors.sky = { h: base.h, s: base.s, l: base.l - 0.1 };
  scene.colors.sky2 = { h: base.h, s: base.s, l: base.l - 0.2 - random() * 0.2 };
  scene.colors.clouds = { h: base.h, s: 0.3, l: 0.9 };
  scene.colors.trees = { h: base.h, s: 0.4, l: 0.4 };
  scene.colors.leaves = { h: scene.colors.trees.h + 0.5, s: 0.65, l: 0.6 };
  scene.colors.leaves2 = { h: scene.colors.trees.h + 0.4, s: 0.65, l: 0.6 };
  scene.colors.planet = { h: scene.colors.trees.h + 0.5, s: 0.8, l: 0.6 };
} else {
  // scene.time === "desert"

  var base = randomColor("light");
  scene.colors.base = base;
  scene.colors.mountains = { h: base.h + 0.3 + random() * 0.05, s: 0.2 + random() * 0.2, l: base.l + random() * 0.1 - 0.15 };
  scene.colors.hills = { h: scene.colors.mountains.h + random() * 0.2 - 0.1, s: 0.4 + random() * 0.2, l: base.l + random() * 0.1 };
  scene.colors.river = { h: base.h, s: base.s - random() * 0.1 - 0.05, l: base.l + random() * 0.1 + 0.2 };
  scene.colors.sky = { h: base.h, s: base.s, l: base.l - 0.1 };
  scene.colors.sky2 = { h: base.h, s: base.s, l: base.l - 0.2 - random() * 0.2 };
  scene.colors.clouds = { h: base.h, s: 0.3, l: 0.9 };
  scene.colors.trees = { h: base.h, s: 0.4, l: 0.4 };
  scene.colors.leaves = { h: scene.colors.trees.h + 0.5, s: 0.6, l: 0.6 };
  scene.colors.leaves2 = { h: scene.colors.trees.h + 0.4, s: 0.6, l: 0.6 };
  scene.colors.planet = { h: scene.colors.trees.h + 0.5, s: 0.8, l: 0.6 };
}

// ---------- Scene functions ------------

function make1DNoise(axis, amplitude, scale, params) {
  //scale normalized at 0.01, amp at 100
  var newNoise = [];

  for (var i = 0; i < canvas.width; i++) {
    newNoise.push({ x: i, y: axis + amplitude * params.noiseFunction(scale * i, params.zaxis) });
  }

  // Find minimum
  if (params.keepmax) {
    var maxValue = -9999999;
    for (var i = 0; i < canvas.width; i++) {
      if (newNoise[i].y > maxValue) {
        scene.maxValue = newNoise[i];
        maxValue = newNoise[i].y;
      }
    }
  }
  if (params.storepoints) scene.points = Util.copy(newNoise);

  newNoise.push(LOWER_LEFT);
  newNoise.push(LOWER_RIGHT);
  ctx.fillStyle = params.fillColor;
  Draw.fillPath(ctx, newNoise);

  if (params.clip) ctx.clip();
}

function makeStars(starcount, params) {
  ctx.fillStyle = "#FFFFFF";
  for (var i = 0; i < starcount; i++) {
    //making 300 stars
    var starx = random() * canvas.width;
    var stary = random() * canvas.height;

    if (stary < 200) {
      //near the top
      if (random() < params.largenessFactor) {
        //make a big star (20% chance)
        ctx.beginPath();

        // Randomize width by variance%
        var starwidth = params.width + Math.floor(random() * (params.width * params.variance));
        ctx.rect(starx - 1, stary - starwidth, 2, 2 * starwidth);
        ctx.rect(starx - starwidth, stary - 1, 2 * starwidth, 2);

        var grd = ctx.createRadialGradient(starx, stary, 3, starx, stary, starwidth + 5 + random() * 5);
        grd.addColorStop(0, "white");
        grd.addColorStop(1, "rgba(1, 1, 1, 0.0)");
        ctx.fillStyle = grd;

        ctx.fill();
      } else {
        //make a normal star
        ctx.beginPath();
        ctx.arc(starx, stary, 1, 0, 2.0 * Math.PI);
        ctx.fill();
      }
    } else {
      //make a normal star
      ctx.beginPath();
      ctx.arc(starx, stary, 1, 0, 2.0 * Math.PI);
      ctx.fill();
    }
  }
}

function makeRiver(params) {
  if (!scene.enabled.river) return;

  var position = scene.maxValue;
  for (var r = 5; r > 0; r--) {
    var colorStr = Color.toHslString({
      h: scene.colors.river.h + random() * 0.05 - params.variance / 2,
      s: scene.colors.river.s + random() * 0.1 - params.variance,
      l: scene.colors.river.l + random() * 0.1 - params.variance
    });
    var halfwidth = r * 10;
    var slope = 1 - (5 - r) * 0.2;

    var points = [];
    for (var i = 0; i < canvas.height; i++) {
      //go along one edge
      del = Math.abs(position.y - i);
      points.push({ x: 10 * simplex.noise2D(100, i / 30) + position.x + halfwidth + del * slope, y: i });
    }
    for (var i = canvas.height - 1; i >= 0; i--) {
      //go along the other edge
      del = Math.abs(position.y - i);
      points.push({ x: 10 * simplex.noise2D(200, i / 30) + position.x - halfwidth - del * slope, y: i });
    }

    ctx.fillStyle = colorStr;
    Draw.fillPath(ctx, points);
  }
}

function makeSun(position, params) {
  // Randomize radius by variance%
  var outerRadius = params.outerRadius + Math.floor(random() * (params.outerRadius * params.variance));
  var innerRadius = params.innerRadius + Math.floor(random() * (params.innerRadius * params.variance));
  var radiusRange = outerRadius - innerRadius;

  ctx.beginPath();
  ctx.arc(position.x, position.y, innerRadius, 0, 2 * Math.PI);
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = Color.toHslString({ h: scene.colors.base.h, s: 0.3, l: 0.8 });
  ctx.fill();

  ctx.arc(position.x, position.y, innerRadius + radiusRange / 3 * 2, 0, 2 * Math.PI);
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = Color.toHslString({ h: scene.colors.base.h, s: 0.3, l: 0.85 });
  ctx.fill();

  ctx.arc(position.x, position.y, outerRadius, 0, 2 * Math.PI);
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = Color.toHslString({ h: scene.colors.base.h, s: 0.3, l: 0.9 });
  ctx.fill();

  ctx.arc(position.x, position.y, outerRadius + radiusRange * 2 / 3, 0, 2 * Math.PI);
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = Color.toHslString({ h: scene.colors.base.h, s: 0.3, l: 0.95 });
  ctx.fill();

  ctx.globalAlpha = 1.0;
}

function makePlanet(position, params) {
  // Randomize radius by variance%
  var radius = params.radius + Math.floor(random() * (params.radius * params.variance));
  ctx.beginPath();
  ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = Color.toHslString(scene.colors.planet);
  ctx.fill();
  ctx.save();
  ctx.clip();

  var xposmax = Math.floor(position.x + radius);
  var yposmax = Math.floor(position.y + radius);
  for (var xpos = position.x - radius; xpos < xposmax; xpos++) {
    for (var ypos = position.y - radius; ypos < yposmax; ypos++) {
      //this adds some graininess
      if (simplex.noise2D(xpos * 0.5, ypos * 0.5) > 0.1 + random() * 0.2) {
        Draw.drawPixel(ctx, { x: xpos, y: ypos }, 'rgba(0, 0, 0, 0.01)');
      }
      if (simplex.noise2D(xpos * 0.03, ypos * 0.03) > 0.1 + random() * 0.2) {
        Draw.drawPixel(ctx, { x: xpos, y: ypos }, 'rgba(0, 0, 0, 0.03)');
      }
    }
  }
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.beginPath();
  ctx.ellipse(position.x + 60, position.y - 60, 60, 40, 45 * Math.PI / 180, 0, 2 * Math.PI);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(position.x + 40, position.y - 40, 80, 60, 45 * Math.PI / 180, 0, 2 * Math.PI);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(position.x + 20, position.y - 20, 100, 80, 45 * Math.PI / 180, 0, 2 * Math.PI);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

function makeClouds(params) {
  if (!scene.enabled.clouds) return;

  var colorStr = Color.toHslString(scene.colors.clouds);
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  for (var i = 0; i < canvas.width; i++) {
    for (var j = 0; j < canvas.height; j++) {
      var noiseValue = simplex.noise2D(i * 0.002 + params.offset, j * 0.01 + params.offset);
      if (noiseValue > params.threshold + random() * params.variance) {
        Draw.drawPixel(ctx, { x: i, y: j }, colorStr);
        if (random() > params.fluffyFactor) {
          ctx.beginPath();
          ctx.arc(i, j, 5, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }
  }
  ctx.globalAlpha = 1.0;
}

function makeSunPlanets(params) {
  if (!scene.enabled.stars) return;

  if (scene.time === "night") {
    makeStars(300, { width: 3, variance: 2.2, largenessFactor: 0.2 });

    if (scene.enabled.planet) {
      makePlanet({ x: 100 + random() * (canvas.width - 200), y: 130 }, { radius: params.planetRadius, variance: 0.1 });
      makePlanet({ x: 80 + random() * (canvas.width - 300), y: 50 + random() * (canvas.height - 300) }, { radius: params.planetRadius / 3, variance: 0.15 });
    }
  } else {
    makeSun({ x: 100 + random() * (canvas.width - 200), y: 100 }, { innerRadius: params.sunRadius / 3 * 2, outerRadius: params.sunRadius + 15, variance: 0.15 });

    if (random() > 0.5) {
      makePlanet({ x: 80 + random() * (canvas.width - 300), y: 50 + random() * (canvas.height - 300) }, { radius: params.planetRadius / 4, variance: 0.15 });
    }
  }
}

function makeSky() {
  if (!scene.enabled.sky) return;

  ctx.beginPath();
  ctx.rect(0, 0, canvas.width, canvas.height);

  var grd = ctx.createLinearGradient(0, canvas.height, 0, 0);
  grd.addColorStop(0, Color.toHslString(scene.colors.sky));
  grd.addColorStop(1, Color.toHslString(scene.colors.sky2));
  ctx.fillStyle = grd;
  ctx.fill();

  // do some triangulation
  var trianglePoints = [];
  trianglePoints.push([0, canvas.height], [0, 0], [canvas.width, canvas.height], [canvas.width, 0]); //add corners
  for (var i = 0; i < 15; i++) {
    //add some stuff on top and bottom
    trianglePoints.push([random() * canvas.width, 0]);
    trianglePoints.push([random() * canvas.width, canvas.height]);
  }
  for (var i = 0; i < 25; i++) {
    //add some stuff on the sides
    trianglePoints.push([0, random() * canvas.height]);
    trianglePoints.push([canvas.width, random() * canvas.height]);
  }
  for (var i = 0; i < 75; i++) {
    //add some stuff in the middle
    trianglePoints.push([random() * canvas.width, random() * canvas.height]);
    trianglePoints.push([random() * canvas.width, random() * canvas.height]);
  }

  var triangles = Delaunay.triangulate(trianglePoints); //do the actual triangulation

  var newtriangle = [];
  for (var i = 0; i < triangles.length; i++) {
    newtriangle.push(Util.toTuple(trianglePoints[triangles[i]]));
    if (newtriangle.length === 3) {
      if (scene.time === 'day' || scene.time === 'desert') {
        ctx.fillStyle = Color.toHslString({ h: scene.colors.base.h, s: scene.colors.base.s + random() * 0.2 - 0.1, l: scene.colors.base.l + random() * 0.2 - 0.1 });
        var center = { x: 0, y: 0 };
        center.x = (newtriangle[0].x + newtriangle[1].x + newtriangle[2].x) / 3;
        center.y = (newtriangle[0].y + newtriangle[1].y + newtriangle[2].y) / 3;
        var centercolor = ctx.getImageData(center.x, center.y, 1, 1).data;

        var fillcolor = "rgb(" + centercolor[0] + ", " + centercolor[1] + ", " + centercolor[2] + ")";
        ctx.fillStyle = fillcolor;
      } else {
        ctx.fillStyle = Color.toHslString({ h: scene.colors.base.h, s: scene.colors.base.s + random() * 0.01 - 0.005, l: scene.colors.base.l + random() * 0.01 - 0.005 });
      }
      Draw.fillPath(ctx, newtriangle);

      newtriangle = [];
    }
  }
}

function makeMountains() {
  if (!scene.enabled.mountains) return;

  var sstep = 0.03,
      lstep = 0.02;
  var tallRange = 150,
      lowerRange = 100;
  make1DNoise(430, tallRange, 0.005, { noiseFunction: scene.mountainNoise, fillColor: Color.toHslString(scene.colors.mountains), zaxis: 0 });
  mountainShade = { h: scene.colors.mountains.h, s: scene.colors.mountains.s - sstep, l: scene.colors.mountains.l - lstep };
  for (var i = 0; i < 3; i++) {
    make1DNoise(430, tallRange + i * 35, 0.005, { noiseFunction: scene.mountainNoise, fillColor: Color.toHslString(mountainShade), zaxis: 0.05 * i });
    mountainShade.s += sstep + random() * lstep;
    mountainShade.l -= lstep - random() * sstep;
  }

  make1DNoise(430, lowerRange, 0.0045, { noiseFunction: scene.mountainNoise, fillColor: Color.toHslString(scene.colors.mountains), zaxis: 0 });
  mountainShade = { h: scene.colors.mountains.h, s: scene.colors.mountains.s - sstep, l: scene.colors.mountains.l - lstep };
  for (var i = 0; i < 3; i++) {
    make1DNoise(430, lowerRange - i * 25, 0.0045, { noiseFunction: scene.mountainNoise, fillColor: Color.toHslString(mountainShade), zaxis: 0.04 * i });
    mountainShade.s -= sstep - random() * lstep;
    mountainShade.l += lstep + random() * sstep;
  }
}

function makeHills() {
  if (!scene.enabled.hills) return;

  ctx.save();
  make1DNoise(500, 50, 0.002, { noiseFunction: scene.hillNoise, fillColor: Color.toHslString(scene.colors.hills), zaxis: 0, keepmax: true, clip: true, storepoints: true });
  for (var i = 1; i < 5; i++) {
    make1DNoise(500 + i * 20, 50 - i * 2, 0.002, { noiseFunction: scene.hillNoise, fillColor: Color.toHslString({ h: scene.colors.hills.h, s: scene.colors.hills.s, l: scene.colors.hills.l + i * 0.05 }), zaxis: 0.02 + i * 0.02 });
  }
}

function makeBigTree(newseed) {
  ctx2.setTransform(1, 0, 0, 1, 0, 0);
  ctx2.translate(200, 200);
  ctx2.scale(1, -1);
  ctx2.clearRect(-200, -200, 400, 400);
  ctx2.strokeStyle = "black";
  ctx2.lineWidth = 3;
  //scene.seed = newseed;
  branch(50);
}

function branch(len) {
  var theta = random() * (Math.PI / 3);

  Draw.drawLine({ x: 0, y: 0 }, { x: 0, y: len }, ctx2);
  ctx2.translate(0, len);

  len *= 0.66;
  if (len > 2) {
    ctx2.save();
    ctx2.rotate(theta);
    branch(len);
    ctx2.restore();

    ctx2.save();
    ctx2.rotate(-theta);
    branch(len);
    ctx2.restore();
  }
}

function makeTrees() {
  if (!scene.enabled.trees) return;

  ctx.restore();

  var treeColorStr = Color.toHslString(scene.colors.trees);

  var maxNumTrees = 20 + Math.floor(random() * 20);
  var colorStepInc = 0.2 / maxNumTrees;
  var colorStep = 0.01;

  var leaveShade = { h: scene.colors.leaves.h, s: scene.colors.leaves.s, l: scene.colors.leaves.l };
  var treeCount = 0;
  while (treeCount < maxNumTrees) {
    var treex = random() * canvas.width;
    var treey = random() * canvas.height;

    // make trees rooted from below hills, above bottom, and not w/in 150 pixels of river
    // this cannot possibly be efficient but idk how else to do it. maybe cache each shape as an object so points can be picked from within the region?
    if ((treex < scene.maxValue.x - 150 || treex > scene.maxValue.x + 150) && treey > scene.points[Math.floor(treex)].y) {

      var treeWidth = Math.floor(3 + 2.5 * random());
      var treeHeight = (6 + 3.1 * random()) * treeWidth;

      // Draw a tree at treex, treey
      ctx.fillStyle = treeColorStr;
      ctx.fillRect(treex, treey, -treeWidth, -treeHeight);

      // Draw a blob for leaves
      ctx.fillStyle = Color.toHslString(leaveShade);

      var leafCenter = { x: treex - treeWidth / 2, y: treey - treeHeight };
      var blobpoints = [];
      var pointcount = 30,
          radius = 8 + Math.floor(random() * 10);
      for (var j = 0; j < pointcount; j++) {
        // Map points onto a circle
        var prepos = {
          x: leafCenter.x + radius * Math.cos(j * (2 * Math.PI) / pointcount),
          y: leafCenter.y + radius * Math.sin(j * (2 * Math.PI) / pointcount)
        };
        var newRadius = radius + 5 * simplex.noise2D(prepos.x, prepos.y);
        var newpos = {
          x: leafCenter.x + newRadius * Math.cos(j * (2 * Math.PI) / pointcount),
          y: leafCenter.y + newRadius * Math.sin(j * (2 * Math.PI) / pointcount)
        };
        blobpoints.push(newpos);
      }
      Draw.fillPath(ctx, blobpoints);

      // Store the position so it can be clicked on
      scene.clickBoxes.push({
        left: treex - radius,
        right: treex + radius,
        top: treey - treeHeight - radius,
        bottom: treey,
        action: makeBigTree
      });

      leaveShade.s += colorStep;
      // leaveShade.l -= colorStep / 2;
      colorStep += colorStepInc;
      treeCount++;
    }
  } // while (treeCount < maxNumTrees)
}

// --------- Let's commence scene generation ----------

// By doing this in the order of sky, mountains, hills, river and trees, we can essentially apply a Painters Algorithm,
// hence earlier parts of the painting are layered over and hidden by more recent item.

makeSky();
makeClouds({ threshold: 0.65, variance: 0.04, offset: 100, fluffyFactor: 0.1 });
makeSunPlanets({ planetRadius: 100, sunRadius: 50 });
makeClouds({ threshold: 0.55, variance: 0.03, offset: 150, fluffyFactor: 0.2 });
makeMountains();
makeHills();
makeRiver({ variance: 0.06 });
makeTrees();

// function getMousePos(canvas, evt) {
//   var rect = canvas.getBoundingClientRect();
//   return {x: evt.clientX - rect.left, y: evt.clientY - rect.top};
// }
//
// function doMouseMove(evt) {
//   var mousePos = getMousePos(canvas, evt);
//   var showBox = false;
//   for (var i = 0; i < scene.clickBoxes.length; i++) {
//     if (mousePos.x > scene.clickBoxes[i].left && mousePos.x < scene.clickBoxes[i].right &&
//       mousePos.y > scene.clickBoxes[i].top && mousePos.y < scene.clickBoxes[i].bottom) {
//       scene.clickBoxes[i].action(i);
//       showBox = true;
//     }
//   }
//
//   if (showBox) {
//     document.querySelector('#canvas2').classList.remove('hidden');
//   } else {
//     document.querySelector('#canvas2').classList.add('hidden');
//   }
// }
//
// canvas.addEventListener('mousemove', doMouseMove, false);

},{"./color.js":3,"./delaunay.js":4,"./draw.js":5,"./util.js":7,"alea":1,"simplex-noise":2}],7:[function(require,module,exports){
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
      return { x: coordinate[0], y: coordinate[1] };
    }

  }; // Util

  if (typeof module !== "undefined") module.exports = Util;
})();

},{}]},{},[6])(6)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYWxlYS9hbGVhLmpzIiwibm9kZV9tb2R1bGVzL3NpbXBsZXgtbm9pc2Uvc2ltcGxleC1ub2lzZS5qcyIsInNyYy9qcy9jb2xvci5qcyIsInNyYy9qcy9kZWxhdW5heS5qcyIsInNyYy9qcy9kcmF3LmpzIiwic3JjL2pzL21haW4uanMiLCJzcmMvanMvdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QixFQUE2QjtBQUMzQixlQUFPLG1CQUFtQixPQUFPLENBQVAsQ0FBbkIsQ0FBUCxJQUF3QyxtQkFBbUIsT0FBTyxDQUFQLENBQW5CLENBQXhDO0FBQ0Q7O0FBRUQsYUFBTyxNQUFQO0FBQ0QsS0FmSTs7QUFpQkw7O0FBRUEsVUFBTSxVQUFVLE1BQVYsRUFBa0I7QUFDdEIsYUFBTyxLQUFLLEtBQUwsQ0FBVyxLQUFLLFNBQUwsQ0FBZSxNQUFmLENBQVgsQ0FBUDtBQUNELEtBckJJOztBQXVCTCxhQUFTLFVBQVUsVUFBVixFQUFzQjtBQUM3QixhQUFPLEVBQUMsR0FBRyxXQUFXLENBQVgsQ0FBSixFQUFtQixHQUFHLFdBQVcsQ0FBWCxDQUF0QixFQUFQO0FBQ0Q7O0FBekJJLEdBQVAsQ0FIVyxDQThCUjs7QUFFSCxNQUFJLE9BQU8sTUFBUCxLQUFrQixXQUF0QixFQUNFLE9BQU8sT0FBUCxHQUFpQixJQUFqQjtBQUVILENBbkNEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG4gIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgZGVmaW5lKGZhY3RvcnkpO1xuICB9IGVsc2Uge1xuICAgICAgcm9vdC5BbGVhID0gZmFjdG9yeSgpO1xuICB9XG59KHRoaXMsIGZ1bmN0aW9uICgpIHtcblxuICAndXNlIHN0cmljdCc7XG5cbiAgLy8gRnJvbSBodHRwOi8vYmFhZ29lLmNvbS9lbi9SYW5kb21NdXNpbmdzL2phdmFzY3JpcHQvXG5cbiAgLy8gaW1wb3J0U3RhdGUgdG8gc3luYyBnZW5lcmF0b3Igc3RhdGVzXG4gIEFsZWEuaW1wb3J0U3RhdGUgPSBmdW5jdGlvbihpKXtcbiAgICB2YXIgcmFuZG9tID0gbmV3IEFsZWEoKTtcbiAgICByYW5kb20uaW1wb3J0U3RhdGUoaSk7XG4gICAgcmV0dXJuIHJhbmRvbTtcbiAgfTtcblxuICByZXR1cm4gQWxlYTtcblxuICBmdW5jdGlvbiBBbGVhKCkge1xuICAgIHJldHVybiAoZnVuY3Rpb24oYXJncykge1xuICAgICAgLy8gSm9oYW5uZXMgQmFhZ8O4ZSA8YmFhZ29lQGJhYWdvZS5jb20+LCAyMDEwXG4gICAgICB2YXIgczAgPSAwO1xuICAgICAgdmFyIHMxID0gMDtcbiAgICAgIHZhciBzMiA9IDA7XG4gICAgICB2YXIgYyA9IDE7XG5cbiAgICAgIGlmIChhcmdzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgIGFyZ3MgPSBbK25ldyBEYXRlXTtcbiAgICAgIH1cbiAgICAgIHZhciBtYXNoID0gTWFzaCgpO1xuICAgICAgczAgPSBtYXNoKCcgJyk7XG4gICAgICBzMSA9IG1hc2goJyAnKTtcbiAgICAgIHMyID0gbWFzaCgnICcpO1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgczAgLT0gbWFzaChhcmdzW2ldKTtcbiAgICAgICAgaWYgKHMwIDwgMCkge1xuICAgICAgICAgIHMwICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgczEgLT0gbWFzaChhcmdzW2ldKTtcbiAgICAgICAgaWYgKHMxIDwgMCkge1xuICAgICAgICAgIHMxICs9IDE7XG4gICAgICAgIH1cbiAgICAgICAgczIgLT0gbWFzaChhcmdzW2ldKTtcbiAgICAgICAgaWYgKHMyIDwgMCkge1xuICAgICAgICAgIHMyICs9IDE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIG1hc2ggPSBudWxsO1xuXG4gICAgICB2YXIgcmFuZG9tID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB0ID0gMjA5MTYzOSAqIHMwICsgYyAqIDIuMzI4MzA2NDM2NTM4Njk2M2UtMTA7IC8vIDJeLTMyXG4gICAgICAgIHMwID0gczE7XG4gICAgICAgIHMxID0gczI7XG4gICAgICAgIHJldHVybiBzMiA9IHQgLSAoYyA9IHQgfCAwKTtcbiAgICAgIH07XG4gICAgICByYW5kb20udWludDMyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiByYW5kb20oKSAqIDB4MTAwMDAwMDAwOyAvLyAyXjMyXG4gICAgICB9O1xuICAgICAgcmFuZG9tLmZyYWN0NTMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHJhbmRvbSgpICsgXG4gICAgICAgICAgKHJhbmRvbSgpICogMHgyMDAwMDAgfCAwKSAqIDEuMTEwMjIzMDI0NjI1MTU2NWUtMTY7IC8vIDJeLTUzXG4gICAgICB9O1xuICAgICAgcmFuZG9tLnZlcnNpb24gPSAnQWxlYSAwLjknO1xuICAgICAgcmFuZG9tLmFyZ3MgPSBhcmdzO1xuXG4gICAgICAvLyBteSBvd24gYWRkaXRpb25zIHRvIHN5bmMgc3RhdGUgYmV0d2VlbiB0d28gZ2VuZXJhdG9yc1xuICAgICAgcmFuZG9tLmV4cG9ydFN0YXRlID0gZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIFtzMCwgczEsIHMyLCBjXTtcbiAgICAgIH07XG4gICAgICByYW5kb20uaW1wb3J0U3RhdGUgPSBmdW5jdGlvbihpKXtcbiAgICAgICAgczAgPSAraVswXSB8fCAwO1xuICAgICAgICBzMSA9ICtpWzFdIHx8IDA7XG4gICAgICAgIHMyID0gK2lbMl0gfHwgMDtcbiAgICAgICAgYyA9ICtpWzNdIHx8IDA7XG4gICAgICB9O1xuIFxuICAgICAgcmV0dXJuIHJhbmRvbTtcblxuICAgIH0gKEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIE1hc2goKSB7XG4gICAgdmFyIG4gPSAweGVmYzgyNDlkO1xuXG4gICAgdmFyIG1hc2ggPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBkYXRhID0gZGF0YS50b1N0cmluZygpO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG4gKz0gZGF0YS5jaGFyQ29kZUF0KGkpO1xuICAgICAgICB2YXIgaCA9IDAuMDI1MTk2MDMyODI0MTY5MzggKiBuO1xuICAgICAgICBuID0gaCA+Pj4gMDtcbiAgICAgICAgaCAtPSBuO1xuICAgICAgICBoICo9IG47XG4gICAgICAgIG4gPSBoID4+PiAwO1xuICAgICAgICBoIC09IG47XG4gICAgICAgIG4gKz0gaCAqIDB4MTAwMDAwMDAwOyAvLyAyXjMyXG4gICAgICB9XG4gICAgICByZXR1cm4gKG4gPj4+IDApICogMi4zMjgzMDY0MzY1Mzg2OTYzZS0xMDsgLy8gMl4tMzJcbiAgICB9O1xuXG4gICAgbWFzaC52ZXJzaW9uID0gJ01hc2ggMC45JztcbiAgICByZXR1cm4gbWFzaDtcbiAgfVxufSkpO1xuIiwiLypcbiAqIEEgZmFzdCBqYXZhc2NyaXB0IGltcGxlbWVudGF0aW9uIG9mIHNpbXBsZXggbm9pc2UgYnkgSm9uYXMgV2FnbmVyXG5cbkJhc2VkIG9uIGEgc3BlZWQtaW1wcm92ZWQgc2ltcGxleCBub2lzZSBhbGdvcml0aG0gZm9yIDJELCAzRCBhbmQgNEQgaW4gSmF2YS5cbldoaWNoIGlzIGJhc2VkIG9uIGV4YW1wbGUgY29kZSBieSBTdGVmYW4gR3VzdGF2c29uIChzdGVndUBpdG4ubGl1LnNlKS5cbldpdGggT3B0aW1pc2F0aW9ucyBieSBQZXRlciBFYXN0bWFuIChwZWFzdG1hbkBkcml6emxlLnN0YW5mb3JkLmVkdSkuXG5CZXR0ZXIgcmFuayBvcmRlcmluZyBtZXRob2QgYnkgU3RlZmFuIEd1c3RhdnNvbiBpbiAyMDEyLlxuXG5cbiBDb3B5cmlnaHQgKGMpIDIwMTggSm9uYXMgV2FnbmVyXG5cbiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxuIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cbiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiBTT0ZUV0FSRS5cbiAqL1xuKGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIEYyID0gMC41ICogKE1hdGguc3FydCgzLjApIC0gMS4wKTtcbiAgdmFyIEcyID0gKDMuMCAtIE1hdGguc3FydCgzLjApKSAvIDYuMDtcbiAgdmFyIEYzID0gMS4wIC8gMy4wO1xuICB2YXIgRzMgPSAxLjAgLyA2LjA7XG4gIHZhciBGNCA9IChNYXRoLnNxcnQoNS4wKSAtIDEuMCkgLyA0LjA7XG4gIHZhciBHNCA9ICg1LjAgLSBNYXRoLnNxcnQoNS4wKSkgLyAyMC4wO1xuXG4gIGZ1bmN0aW9uIFNpbXBsZXhOb2lzZShyYW5kb21PclNlZWQpIHtcbiAgICB2YXIgcmFuZG9tO1xuICAgIGlmICh0eXBlb2YgcmFuZG9tT3JTZWVkID09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJhbmRvbSA9IHJhbmRvbU9yU2VlZDtcbiAgICB9XG4gICAgZWxzZSBpZiAocmFuZG9tT3JTZWVkKSB7XG4gICAgICByYW5kb20gPSBhbGVhKHJhbmRvbU9yU2VlZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJhbmRvbSA9IE1hdGgucmFuZG9tO1xuICAgIH1cbiAgICB0aGlzLnAgPSBidWlsZFBlcm11dGF0aW9uVGFibGUocmFuZG9tKTtcbiAgICB0aGlzLnBlcm0gPSBuZXcgVWludDhBcnJheSg1MTIpO1xuICAgIHRoaXMucGVybU1vZDEyID0gbmV3IFVpbnQ4QXJyYXkoNTEyKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDUxMjsgaSsrKSB7XG4gICAgICB0aGlzLnBlcm1baV0gPSB0aGlzLnBbaSAmIDI1NV07XG4gICAgICB0aGlzLnBlcm1Nb2QxMltpXSA9IHRoaXMucGVybVtpXSAlIDEyO1xuICAgIH1cblxuICB9XG4gIFNpbXBsZXhOb2lzZS5wcm90b3R5cGUgPSB7XG4gICAgZ3JhZDM6IG5ldyBGbG9hdDMyQXJyYXkoWzEsIDEsIDAsXG4gICAgICAtMSwgMSwgMCxcbiAgICAgIDEsIC0xLCAwLFxuXG4gICAgICAtMSwgLTEsIDAsXG4gICAgICAxLCAwLCAxLFxuICAgICAgLTEsIDAsIDEsXG5cbiAgICAgIDEsIDAsIC0xLFxuICAgICAgLTEsIDAsIC0xLFxuICAgICAgMCwgMSwgMSxcblxuICAgICAgMCwgLTEsIDEsXG4gICAgICAwLCAxLCAtMSxcbiAgICAgIDAsIC0xLCAtMV0pLFxuICAgIGdyYWQ0OiBuZXcgRmxvYXQzMkFycmF5KFswLCAxLCAxLCAxLCAwLCAxLCAxLCAtMSwgMCwgMSwgLTEsIDEsIDAsIDEsIC0xLCAtMSxcbiAgICAgIDAsIC0xLCAxLCAxLCAwLCAtMSwgMSwgLTEsIDAsIC0xLCAtMSwgMSwgMCwgLTEsIC0xLCAtMSxcbiAgICAgIDEsIDAsIDEsIDEsIDEsIDAsIDEsIC0xLCAxLCAwLCAtMSwgMSwgMSwgMCwgLTEsIC0xLFxuICAgICAgLTEsIDAsIDEsIDEsIC0xLCAwLCAxLCAtMSwgLTEsIDAsIC0xLCAxLCAtMSwgMCwgLTEsIC0xLFxuICAgICAgMSwgMSwgMCwgMSwgMSwgMSwgMCwgLTEsIDEsIC0xLCAwLCAxLCAxLCAtMSwgMCwgLTEsXG4gICAgICAtMSwgMSwgMCwgMSwgLTEsIDEsIDAsIC0xLCAtMSwgLTEsIDAsIDEsIC0xLCAtMSwgMCwgLTEsXG4gICAgICAxLCAxLCAxLCAwLCAxLCAxLCAtMSwgMCwgMSwgLTEsIDEsIDAsIDEsIC0xLCAtMSwgMCxcbiAgICAgIC0xLCAxLCAxLCAwLCAtMSwgMSwgLTEsIDAsIC0xLCAtMSwgMSwgMCwgLTEsIC0xLCAtMSwgMF0pLFxuICAgIG5vaXNlMkQ6IGZ1bmN0aW9uKHhpbiwgeWluKSB7XG4gICAgICB2YXIgcGVybU1vZDEyID0gdGhpcy5wZXJtTW9kMTI7XG4gICAgICB2YXIgcGVybSA9IHRoaXMucGVybTtcbiAgICAgIHZhciBncmFkMyA9IHRoaXMuZ3JhZDM7XG4gICAgICB2YXIgbjAgPSAwOyAvLyBOb2lzZSBjb250cmlidXRpb25zIGZyb20gdGhlIHRocmVlIGNvcm5lcnNcbiAgICAgIHZhciBuMSA9IDA7XG4gICAgICB2YXIgbjIgPSAwO1xuICAgICAgLy8gU2tldyB0aGUgaW5wdXQgc3BhY2UgdG8gZGV0ZXJtaW5lIHdoaWNoIHNpbXBsZXggY2VsbCB3ZSdyZSBpblxuICAgICAgdmFyIHMgPSAoeGluICsgeWluKSAqIEYyOyAvLyBIYWlyeSBmYWN0b3IgZm9yIDJEXG4gICAgICB2YXIgaSA9IE1hdGguZmxvb3IoeGluICsgcyk7XG4gICAgICB2YXIgaiA9IE1hdGguZmxvb3IoeWluICsgcyk7XG4gICAgICB2YXIgdCA9IChpICsgaikgKiBHMjtcbiAgICAgIHZhciBYMCA9IGkgLSB0OyAvLyBVbnNrZXcgdGhlIGNlbGwgb3JpZ2luIGJhY2sgdG8gKHgseSkgc3BhY2VcbiAgICAgIHZhciBZMCA9IGogLSB0O1xuICAgICAgdmFyIHgwID0geGluIC0gWDA7IC8vIFRoZSB4LHkgZGlzdGFuY2VzIGZyb20gdGhlIGNlbGwgb3JpZ2luXG4gICAgICB2YXIgeTAgPSB5aW4gLSBZMDtcbiAgICAgIC8vIEZvciB0aGUgMkQgY2FzZSwgdGhlIHNpbXBsZXggc2hhcGUgaXMgYW4gZXF1aWxhdGVyYWwgdHJpYW5nbGUuXG4gICAgICAvLyBEZXRlcm1pbmUgd2hpY2ggc2ltcGxleCB3ZSBhcmUgaW4uXG4gICAgICB2YXIgaTEsIGoxOyAvLyBPZmZzZXRzIGZvciBzZWNvbmQgKG1pZGRsZSkgY29ybmVyIG9mIHNpbXBsZXggaW4gKGksaikgY29vcmRzXG4gICAgICBpZiAoeDAgPiB5MCkge1xuICAgICAgICBpMSA9IDE7XG4gICAgICAgIGoxID0gMDtcbiAgICAgIH0gLy8gbG93ZXIgdHJpYW5nbGUsIFhZIG9yZGVyOiAoMCwwKS0+KDEsMCktPigxLDEpXG4gICAgICBlbHNlIHtcbiAgICAgICAgaTEgPSAwO1xuICAgICAgICBqMSA9IDE7XG4gICAgICB9IC8vIHVwcGVyIHRyaWFuZ2xlLCBZWCBvcmRlcjogKDAsMCktPigwLDEpLT4oMSwxKVxuICAgICAgLy8gQSBzdGVwIG9mICgxLDApIGluIChpLGopIG1lYW5zIGEgc3RlcCBvZiAoMS1jLC1jKSBpbiAoeCx5KSwgYW5kXG4gICAgICAvLyBhIHN0ZXAgb2YgKDAsMSkgaW4gKGksaikgbWVhbnMgYSBzdGVwIG9mICgtYywxLWMpIGluICh4LHkpLCB3aGVyZVxuICAgICAgLy8gYyA9ICgzLXNxcnQoMykpLzZcbiAgICAgIHZhciB4MSA9IHgwIC0gaTEgKyBHMjsgLy8gT2Zmc2V0cyBmb3IgbWlkZGxlIGNvcm5lciBpbiAoeCx5KSB1bnNrZXdlZCBjb29yZHNcbiAgICAgIHZhciB5MSA9IHkwIC0gajEgKyBHMjtcbiAgICAgIHZhciB4MiA9IHgwIC0gMS4wICsgMi4wICogRzI7IC8vIE9mZnNldHMgZm9yIGxhc3QgY29ybmVyIGluICh4LHkpIHVuc2tld2VkIGNvb3Jkc1xuICAgICAgdmFyIHkyID0geTAgLSAxLjAgKyAyLjAgKiBHMjtcbiAgICAgIC8vIFdvcmsgb3V0IHRoZSBoYXNoZWQgZ3JhZGllbnQgaW5kaWNlcyBvZiB0aGUgdGhyZWUgc2ltcGxleCBjb3JuZXJzXG4gICAgICB2YXIgaWkgPSBpICYgMjU1O1xuICAgICAgdmFyIGpqID0gaiAmIDI1NTtcbiAgICAgIC8vIENhbGN1bGF0ZSB0aGUgY29udHJpYnV0aW9uIGZyb20gdGhlIHRocmVlIGNvcm5lcnNcbiAgICAgIHZhciB0MCA9IDAuNSAtIHgwICogeDAgLSB5MCAqIHkwO1xuICAgICAgaWYgKHQwID49IDApIHtcbiAgICAgICAgdmFyIGdpMCA9IHBlcm1Nb2QxMltpaSArIHBlcm1bampdXSAqIDM7XG4gICAgICAgIHQwICo9IHQwO1xuICAgICAgICBuMCA9IHQwICogdDAgKiAoZ3JhZDNbZ2kwXSAqIHgwICsgZ3JhZDNbZ2kwICsgMV0gKiB5MCk7IC8vICh4LHkpIG9mIGdyYWQzIHVzZWQgZm9yIDJEIGdyYWRpZW50XG4gICAgICB9XG4gICAgICB2YXIgdDEgPSAwLjUgLSB4MSAqIHgxIC0geTEgKiB5MTtcbiAgICAgIGlmICh0MSA+PSAwKSB7XG4gICAgICAgIHZhciBnaTEgPSBwZXJtTW9kMTJbaWkgKyBpMSArIHBlcm1bamogKyBqMV1dICogMztcbiAgICAgICAgdDEgKj0gdDE7XG4gICAgICAgIG4xID0gdDEgKiB0MSAqIChncmFkM1tnaTFdICogeDEgKyBncmFkM1tnaTEgKyAxXSAqIHkxKTtcbiAgICAgIH1cbiAgICAgIHZhciB0MiA9IDAuNSAtIHgyICogeDIgLSB5MiAqIHkyO1xuICAgICAgaWYgKHQyID49IDApIHtcbiAgICAgICAgdmFyIGdpMiA9IHBlcm1Nb2QxMltpaSArIDEgKyBwZXJtW2pqICsgMV1dICogMztcbiAgICAgICAgdDIgKj0gdDI7XG4gICAgICAgIG4yID0gdDIgKiB0MiAqIChncmFkM1tnaTJdICogeDIgKyBncmFkM1tnaTIgKyAxXSAqIHkyKTtcbiAgICAgIH1cbiAgICAgIC8vIEFkZCBjb250cmlidXRpb25zIGZyb20gZWFjaCBjb3JuZXIgdG8gZ2V0IHRoZSBmaW5hbCBub2lzZSB2YWx1ZS5cbiAgICAgIC8vIFRoZSByZXN1bHQgaXMgc2NhbGVkIHRvIHJldHVybiB2YWx1ZXMgaW4gdGhlIGludGVydmFsIFstMSwxXS5cbiAgICAgIHJldHVybiA3MC4wICogKG4wICsgbjEgKyBuMik7XG4gICAgfSxcbiAgICAvLyAzRCBzaW1wbGV4IG5vaXNlXG4gICAgbm9pc2UzRDogZnVuY3Rpb24oeGluLCB5aW4sIHppbikge1xuICAgICAgdmFyIHBlcm1Nb2QxMiA9IHRoaXMucGVybU1vZDEyO1xuICAgICAgdmFyIHBlcm0gPSB0aGlzLnBlcm07XG4gICAgICB2YXIgZ3JhZDMgPSB0aGlzLmdyYWQzO1xuICAgICAgdmFyIG4wLCBuMSwgbjIsIG4zOyAvLyBOb2lzZSBjb250cmlidXRpb25zIGZyb20gdGhlIGZvdXIgY29ybmVyc1xuICAgICAgLy8gU2tldyB0aGUgaW5wdXQgc3BhY2UgdG8gZGV0ZXJtaW5lIHdoaWNoIHNpbXBsZXggY2VsbCB3ZSdyZSBpblxuICAgICAgdmFyIHMgPSAoeGluICsgeWluICsgemluKSAqIEYzOyAvLyBWZXJ5IG5pY2UgYW5kIHNpbXBsZSBza2V3IGZhY3RvciBmb3IgM0RcbiAgICAgIHZhciBpID0gTWF0aC5mbG9vcih4aW4gKyBzKTtcbiAgICAgIHZhciBqID0gTWF0aC5mbG9vcih5aW4gKyBzKTtcbiAgICAgIHZhciBrID0gTWF0aC5mbG9vcih6aW4gKyBzKTtcbiAgICAgIHZhciB0ID0gKGkgKyBqICsgaykgKiBHMztcbiAgICAgIHZhciBYMCA9IGkgLSB0OyAvLyBVbnNrZXcgdGhlIGNlbGwgb3JpZ2luIGJhY2sgdG8gKHgseSx6KSBzcGFjZVxuICAgICAgdmFyIFkwID0gaiAtIHQ7XG4gICAgICB2YXIgWjAgPSBrIC0gdDtcbiAgICAgIHZhciB4MCA9IHhpbiAtIFgwOyAvLyBUaGUgeCx5LHogZGlzdGFuY2VzIGZyb20gdGhlIGNlbGwgb3JpZ2luXG4gICAgICB2YXIgeTAgPSB5aW4gLSBZMDtcbiAgICAgIHZhciB6MCA9IHppbiAtIFowO1xuICAgICAgLy8gRm9yIHRoZSAzRCBjYXNlLCB0aGUgc2ltcGxleCBzaGFwZSBpcyBhIHNsaWdodGx5IGlycmVndWxhciB0ZXRyYWhlZHJvbi5cbiAgICAgIC8vIERldGVybWluZSB3aGljaCBzaW1wbGV4IHdlIGFyZSBpbi5cbiAgICAgIHZhciBpMSwgajEsIGsxOyAvLyBPZmZzZXRzIGZvciBzZWNvbmQgY29ybmVyIG9mIHNpbXBsZXggaW4gKGksaixrKSBjb29yZHNcbiAgICAgIHZhciBpMiwgajIsIGsyOyAvLyBPZmZzZXRzIGZvciB0aGlyZCBjb3JuZXIgb2Ygc2ltcGxleCBpbiAoaSxqLGspIGNvb3Jkc1xuICAgICAgaWYgKHgwID49IHkwKSB7XG4gICAgICAgIGlmICh5MCA+PSB6MCkge1xuICAgICAgICAgIGkxID0gMTtcbiAgICAgICAgICBqMSA9IDA7XG4gICAgICAgICAgazEgPSAwO1xuICAgICAgICAgIGkyID0gMTtcbiAgICAgICAgICBqMiA9IDE7XG4gICAgICAgICAgazIgPSAwO1xuICAgICAgICB9IC8vIFggWSBaIG9yZGVyXG4gICAgICAgIGVsc2UgaWYgKHgwID49IHowKSB7XG4gICAgICAgICAgaTEgPSAxO1xuICAgICAgICAgIGoxID0gMDtcbiAgICAgICAgICBrMSA9IDA7XG4gICAgICAgICAgaTIgPSAxO1xuICAgICAgICAgIGoyID0gMDtcbiAgICAgICAgICBrMiA9IDE7XG4gICAgICAgIH0gLy8gWCBaIFkgb3JkZXJcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgaTEgPSAwO1xuICAgICAgICAgIGoxID0gMDtcbiAgICAgICAgICBrMSA9IDE7XG4gICAgICAgICAgaTIgPSAxO1xuICAgICAgICAgIGoyID0gMDtcbiAgICAgICAgICBrMiA9IDE7XG4gICAgICAgIH0gLy8gWiBYIFkgb3JkZXJcbiAgICAgIH1cbiAgICAgIGVsc2UgeyAvLyB4MDx5MFxuICAgICAgICBpZiAoeTAgPCB6MCkge1xuICAgICAgICAgIGkxID0gMDtcbiAgICAgICAgICBqMSA9IDA7XG4gICAgICAgICAgazEgPSAxO1xuICAgICAgICAgIGkyID0gMDtcbiAgICAgICAgICBqMiA9IDE7XG4gICAgICAgICAgazIgPSAxO1xuICAgICAgICB9IC8vIFogWSBYIG9yZGVyXG4gICAgICAgIGVsc2UgaWYgKHgwIDwgejApIHtcbiAgICAgICAgICBpMSA9IDA7XG4gICAgICAgICAgajEgPSAxO1xuICAgICAgICAgIGsxID0gMDtcbiAgICAgICAgICBpMiA9IDA7XG4gICAgICAgICAgajIgPSAxO1xuICAgICAgICAgIGsyID0gMTtcbiAgICAgICAgfSAvLyBZIFogWCBvcmRlclxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBpMSA9IDA7XG4gICAgICAgICAgajEgPSAxO1xuICAgICAgICAgIGsxID0gMDtcbiAgICAgICAgICBpMiA9IDE7XG4gICAgICAgICAgajIgPSAxO1xuICAgICAgICAgIGsyID0gMDtcbiAgICAgICAgfSAvLyBZIFggWiBvcmRlclxuICAgICAgfVxuICAgICAgLy8gQSBzdGVwIG9mICgxLDAsMCkgaW4gKGksaixrKSBtZWFucyBhIHN0ZXAgb2YgKDEtYywtYywtYykgaW4gKHgseSx6KSxcbiAgICAgIC8vIGEgc3RlcCBvZiAoMCwxLDApIGluIChpLGosaykgbWVhbnMgYSBzdGVwIG9mICgtYywxLWMsLWMpIGluICh4LHkseiksIGFuZFxuICAgICAgLy8gYSBzdGVwIG9mICgwLDAsMSkgaW4gKGksaixrKSBtZWFucyBhIHN0ZXAgb2YgKC1jLC1jLDEtYykgaW4gKHgseSx6KSwgd2hlcmVcbiAgICAgIC8vIGMgPSAxLzYuXG4gICAgICB2YXIgeDEgPSB4MCAtIGkxICsgRzM7IC8vIE9mZnNldHMgZm9yIHNlY29uZCBjb3JuZXIgaW4gKHgseSx6KSBjb29yZHNcbiAgICAgIHZhciB5MSA9IHkwIC0gajEgKyBHMztcbiAgICAgIHZhciB6MSA9IHowIC0gazEgKyBHMztcbiAgICAgIHZhciB4MiA9IHgwIC0gaTIgKyAyLjAgKiBHMzsgLy8gT2Zmc2V0cyBmb3IgdGhpcmQgY29ybmVyIGluICh4LHkseikgY29vcmRzXG4gICAgICB2YXIgeTIgPSB5MCAtIGoyICsgMi4wICogRzM7XG4gICAgICB2YXIgejIgPSB6MCAtIGsyICsgMi4wICogRzM7XG4gICAgICB2YXIgeDMgPSB4MCAtIDEuMCArIDMuMCAqIEczOyAvLyBPZmZzZXRzIGZvciBsYXN0IGNvcm5lciBpbiAoeCx5LHopIGNvb3Jkc1xuICAgICAgdmFyIHkzID0geTAgLSAxLjAgKyAzLjAgKiBHMztcbiAgICAgIHZhciB6MyA9IHowIC0gMS4wICsgMy4wICogRzM7XG4gICAgICAvLyBXb3JrIG91dCB0aGUgaGFzaGVkIGdyYWRpZW50IGluZGljZXMgb2YgdGhlIGZvdXIgc2ltcGxleCBjb3JuZXJzXG4gICAgICB2YXIgaWkgPSBpICYgMjU1O1xuICAgICAgdmFyIGpqID0gaiAmIDI1NTtcbiAgICAgIHZhciBrayA9IGsgJiAyNTU7XG4gICAgICAvLyBDYWxjdWxhdGUgdGhlIGNvbnRyaWJ1dGlvbiBmcm9tIHRoZSBmb3VyIGNvcm5lcnNcbiAgICAgIHZhciB0MCA9IDAuNiAtIHgwICogeDAgLSB5MCAqIHkwIC0gejAgKiB6MDtcbiAgICAgIGlmICh0MCA8IDApIG4wID0gMC4wO1xuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciBnaTAgPSBwZXJtTW9kMTJbaWkgKyBwZXJtW2pqICsgcGVybVtra11dXSAqIDM7XG4gICAgICAgIHQwICo9IHQwO1xuICAgICAgICBuMCA9IHQwICogdDAgKiAoZ3JhZDNbZ2kwXSAqIHgwICsgZ3JhZDNbZ2kwICsgMV0gKiB5MCArIGdyYWQzW2dpMCArIDJdICogejApO1xuICAgICAgfVxuICAgICAgdmFyIHQxID0gMC42IC0geDEgKiB4MSAtIHkxICogeTEgLSB6MSAqIHoxO1xuICAgICAgaWYgKHQxIDwgMCkgbjEgPSAwLjA7XG4gICAgICBlbHNlIHtcbiAgICAgICAgdmFyIGdpMSA9IHBlcm1Nb2QxMltpaSArIGkxICsgcGVybVtqaiArIGoxICsgcGVybVtrayArIGsxXV1dICogMztcbiAgICAgICAgdDEgKj0gdDE7XG4gICAgICAgIG4xID0gdDEgKiB0MSAqIChncmFkM1tnaTFdICogeDEgKyBncmFkM1tnaTEgKyAxXSAqIHkxICsgZ3JhZDNbZ2kxICsgMl0gKiB6MSk7XG4gICAgICB9XG4gICAgICB2YXIgdDIgPSAwLjYgLSB4MiAqIHgyIC0geTIgKiB5MiAtIHoyICogejI7XG4gICAgICBpZiAodDIgPCAwKSBuMiA9IDAuMDtcbiAgICAgIGVsc2Uge1xuICAgICAgICB2YXIgZ2kyID0gcGVybU1vZDEyW2lpICsgaTIgKyBwZXJtW2pqICsgajIgKyBwZXJtW2trICsgazJdXV0gKiAzO1xuICAgICAgICB0MiAqPSB0MjtcbiAgICAgICAgbjIgPSB0MiAqIHQyICogKGdyYWQzW2dpMl0gKiB4MiArIGdyYWQzW2dpMiArIDFdICogeTIgKyBncmFkM1tnaTIgKyAyXSAqIHoyKTtcbiAgICAgIH1cbiAgICAgIHZhciB0MyA9IDAuNiAtIHgzICogeDMgLSB5MyAqIHkzIC0gejMgKiB6MztcbiAgICAgIGlmICh0MyA8IDApIG4zID0gMC4wO1xuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciBnaTMgPSBwZXJtTW9kMTJbaWkgKyAxICsgcGVybVtqaiArIDEgKyBwZXJtW2trICsgMV1dXSAqIDM7XG4gICAgICAgIHQzICo9IHQzO1xuICAgICAgICBuMyA9IHQzICogdDMgKiAoZ3JhZDNbZ2kzXSAqIHgzICsgZ3JhZDNbZ2kzICsgMV0gKiB5MyArIGdyYWQzW2dpMyArIDJdICogejMpO1xuICAgICAgfVxuICAgICAgLy8gQWRkIGNvbnRyaWJ1dGlvbnMgZnJvbSBlYWNoIGNvcm5lciB0byBnZXQgdGhlIGZpbmFsIG5vaXNlIHZhbHVlLlxuICAgICAgLy8gVGhlIHJlc3VsdCBpcyBzY2FsZWQgdG8gc3RheSBqdXN0IGluc2lkZSBbLTEsMV1cbiAgICAgIHJldHVybiAzMi4wICogKG4wICsgbjEgKyBuMiArIG4zKTtcbiAgICB9LFxuICAgIC8vIDREIHNpbXBsZXggbm9pc2UsIGJldHRlciBzaW1wbGV4IHJhbmsgb3JkZXJpbmcgbWV0aG9kIDIwMTItMDMtMDlcbiAgICBub2lzZTREOiBmdW5jdGlvbih4LCB5LCB6LCB3KSB7XG4gICAgICB2YXIgcGVybSA9IHRoaXMucGVybTtcbiAgICAgIHZhciBncmFkNCA9IHRoaXMuZ3JhZDQ7XG5cbiAgICAgIHZhciBuMCwgbjEsIG4yLCBuMywgbjQ7IC8vIE5vaXNlIGNvbnRyaWJ1dGlvbnMgZnJvbSB0aGUgZml2ZSBjb3JuZXJzXG4gICAgICAvLyBTa2V3IHRoZSAoeCx5LHosdykgc3BhY2UgdG8gZGV0ZXJtaW5lIHdoaWNoIGNlbGwgb2YgMjQgc2ltcGxpY2VzIHdlJ3JlIGluXG4gICAgICB2YXIgcyA9ICh4ICsgeSArIHogKyB3KSAqIEY0OyAvLyBGYWN0b3IgZm9yIDREIHNrZXdpbmdcbiAgICAgIHZhciBpID0gTWF0aC5mbG9vcih4ICsgcyk7XG4gICAgICB2YXIgaiA9IE1hdGguZmxvb3IoeSArIHMpO1xuICAgICAgdmFyIGsgPSBNYXRoLmZsb29yKHogKyBzKTtcbiAgICAgIHZhciBsID0gTWF0aC5mbG9vcih3ICsgcyk7XG4gICAgICB2YXIgdCA9IChpICsgaiArIGsgKyBsKSAqIEc0OyAvLyBGYWN0b3IgZm9yIDREIHVuc2tld2luZ1xuICAgICAgdmFyIFgwID0gaSAtIHQ7IC8vIFVuc2tldyB0aGUgY2VsbCBvcmlnaW4gYmFjayB0byAoeCx5LHosdykgc3BhY2VcbiAgICAgIHZhciBZMCA9IGogLSB0O1xuICAgICAgdmFyIFowID0gayAtIHQ7XG4gICAgICB2YXIgVzAgPSBsIC0gdDtcbiAgICAgIHZhciB4MCA9IHggLSBYMDsgLy8gVGhlIHgseSx6LHcgZGlzdGFuY2VzIGZyb20gdGhlIGNlbGwgb3JpZ2luXG4gICAgICB2YXIgeTAgPSB5IC0gWTA7XG4gICAgICB2YXIgejAgPSB6IC0gWjA7XG4gICAgICB2YXIgdzAgPSB3IC0gVzA7XG4gICAgICAvLyBGb3IgdGhlIDREIGNhc2UsIHRoZSBzaW1wbGV4IGlzIGEgNEQgc2hhcGUgSSB3b24ndCBldmVuIHRyeSB0byBkZXNjcmliZS5cbiAgICAgIC8vIFRvIGZpbmQgb3V0IHdoaWNoIG9mIHRoZSAyNCBwb3NzaWJsZSBzaW1wbGljZXMgd2UncmUgaW4sIHdlIG5lZWQgdG9cbiAgICAgIC8vIGRldGVybWluZSB0aGUgbWFnbml0dWRlIG9yZGVyaW5nIG9mIHgwLCB5MCwgejAgYW5kIHcwLlxuICAgICAgLy8gU2l4IHBhaXItd2lzZSBjb21wYXJpc29ucyBhcmUgcGVyZm9ybWVkIGJldHdlZW4gZWFjaCBwb3NzaWJsZSBwYWlyXG4gICAgICAvLyBvZiB0aGUgZm91ciBjb29yZGluYXRlcywgYW5kIHRoZSByZXN1bHRzIGFyZSB1c2VkIHRvIHJhbmsgdGhlIG51bWJlcnMuXG4gICAgICB2YXIgcmFua3ggPSAwO1xuICAgICAgdmFyIHJhbmt5ID0gMDtcbiAgICAgIHZhciByYW5reiA9IDA7XG4gICAgICB2YXIgcmFua3cgPSAwO1xuICAgICAgaWYgKHgwID4geTApIHJhbmt4Kys7XG4gICAgICBlbHNlIHJhbmt5Kys7XG4gICAgICBpZiAoeDAgPiB6MCkgcmFua3grKztcbiAgICAgIGVsc2UgcmFua3orKztcbiAgICAgIGlmICh4MCA+IHcwKSByYW5reCsrO1xuICAgICAgZWxzZSByYW5rdysrO1xuICAgICAgaWYgKHkwID4gejApIHJhbmt5Kys7XG4gICAgICBlbHNlIHJhbmt6Kys7XG4gICAgICBpZiAoeTAgPiB3MCkgcmFua3krKztcbiAgICAgIGVsc2UgcmFua3crKztcbiAgICAgIGlmICh6MCA+IHcwKSByYW5reisrO1xuICAgICAgZWxzZSByYW5rdysrO1xuICAgICAgdmFyIGkxLCBqMSwgazEsIGwxOyAvLyBUaGUgaW50ZWdlciBvZmZzZXRzIGZvciB0aGUgc2Vjb25kIHNpbXBsZXggY29ybmVyXG4gICAgICB2YXIgaTIsIGoyLCBrMiwgbDI7IC8vIFRoZSBpbnRlZ2VyIG9mZnNldHMgZm9yIHRoZSB0aGlyZCBzaW1wbGV4IGNvcm5lclxuICAgICAgdmFyIGkzLCBqMywgazMsIGwzOyAvLyBUaGUgaW50ZWdlciBvZmZzZXRzIGZvciB0aGUgZm91cnRoIHNpbXBsZXggY29ybmVyXG4gICAgICAvLyBzaW1wbGV4W2NdIGlzIGEgNC12ZWN0b3Igd2l0aCB0aGUgbnVtYmVycyAwLCAxLCAyIGFuZCAzIGluIHNvbWUgb3JkZXIuXG4gICAgICAvLyBNYW55IHZhbHVlcyBvZiBjIHdpbGwgbmV2ZXIgb2NjdXIsIHNpbmNlIGUuZy4geD55Pno+dyBtYWtlcyB4PHosIHk8dyBhbmQgeDx3XG4gICAgICAvLyBpbXBvc3NpYmxlLiBPbmx5IHRoZSAyNCBpbmRpY2VzIHdoaWNoIGhhdmUgbm9uLXplcm8gZW50cmllcyBtYWtlIGFueSBzZW5zZS5cbiAgICAgIC8vIFdlIHVzZSBhIHRocmVzaG9sZGluZyB0byBzZXQgdGhlIGNvb3JkaW5hdGVzIGluIHR1cm4gZnJvbSB0aGUgbGFyZ2VzdCBtYWduaXR1ZGUuXG4gICAgICAvLyBSYW5rIDMgZGVub3RlcyB0aGUgbGFyZ2VzdCBjb29yZGluYXRlLlxuICAgICAgaTEgPSByYW5reCA+PSAzID8gMSA6IDA7XG4gICAgICBqMSA9IHJhbmt5ID49IDMgPyAxIDogMDtcbiAgICAgIGsxID0gcmFua3ogPj0gMyA/IDEgOiAwO1xuICAgICAgbDEgPSByYW5rdyA+PSAzID8gMSA6IDA7XG4gICAgICAvLyBSYW5rIDIgZGVub3RlcyB0aGUgc2Vjb25kIGxhcmdlc3QgY29vcmRpbmF0ZS5cbiAgICAgIGkyID0gcmFua3ggPj0gMiA/IDEgOiAwO1xuICAgICAgajIgPSByYW5reSA+PSAyID8gMSA6IDA7XG4gICAgICBrMiA9IHJhbmt6ID49IDIgPyAxIDogMDtcbiAgICAgIGwyID0gcmFua3cgPj0gMiA/IDEgOiAwO1xuICAgICAgLy8gUmFuayAxIGRlbm90ZXMgdGhlIHNlY29uZCBzbWFsbGVzdCBjb29yZGluYXRlLlxuICAgICAgaTMgPSByYW5reCA+PSAxID8gMSA6IDA7XG4gICAgICBqMyA9IHJhbmt5ID49IDEgPyAxIDogMDtcbiAgICAgIGszID0gcmFua3ogPj0gMSA/IDEgOiAwO1xuICAgICAgbDMgPSByYW5rdyA+PSAxID8gMSA6IDA7XG4gICAgICAvLyBUaGUgZmlmdGggY29ybmVyIGhhcyBhbGwgY29vcmRpbmF0ZSBvZmZzZXRzID0gMSwgc28gbm8gbmVlZCB0byBjb21wdXRlIHRoYXQuXG4gICAgICB2YXIgeDEgPSB4MCAtIGkxICsgRzQ7IC8vIE9mZnNldHMgZm9yIHNlY29uZCBjb3JuZXIgaW4gKHgseSx6LHcpIGNvb3Jkc1xuICAgICAgdmFyIHkxID0geTAgLSBqMSArIEc0O1xuICAgICAgdmFyIHoxID0gejAgLSBrMSArIEc0O1xuICAgICAgdmFyIHcxID0gdzAgLSBsMSArIEc0O1xuICAgICAgdmFyIHgyID0geDAgLSBpMiArIDIuMCAqIEc0OyAvLyBPZmZzZXRzIGZvciB0aGlyZCBjb3JuZXIgaW4gKHgseSx6LHcpIGNvb3Jkc1xuICAgICAgdmFyIHkyID0geTAgLSBqMiArIDIuMCAqIEc0O1xuICAgICAgdmFyIHoyID0gejAgLSBrMiArIDIuMCAqIEc0O1xuICAgICAgdmFyIHcyID0gdzAgLSBsMiArIDIuMCAqIEc0O1xuICAgICAgdmFyIHgzID0geDAgLSBpMyArIDMuMCAqIEc0OyAvLyBPZmZzZXRzIGZvciBmb3VydGggY29ybmVyIGluICh4LHkseix3KSBjb29yZHNcbiAgICAgIHZhciB5MyA9IHkwIC0gajMgKyAzLjAgKiBHNDtcbiAgICAgIHZhciB6MyA9IHowIC0gazMgKyAzLjAgKiBHNDtcbiAgICAgIHZhciB3MyA9IHcwIC0gbDMgKyAzLjAgKiBHNDtcbiAgICAgIHZhciB4NCA9IHgwIC0gMS4wICsgNC4wICogRzQ7IC8vIE9mZnNldHMgZm9yIGxhc3QgY29ybmVyIGluICh4LHkseix3KSBjb29yZHNcbiAgICAgIHZhciB5NCA9IHkwIC0gMS4wICsgNC4wICogRzQ7XG4gICAgICB2YXIgejQgPSB6MCAtIDEuMCArIDQuMCAqIEc0O1xuICAgICAgdmFyIHc0ID0gdzAgLSAxLjAgKyA0LjAgKiBHNDtcbiAgICAgIC8vIFdvcmsgb3V0IHRoZSBoYXNoZWQgZ3JhZGllbnQgaW5kaWNlcyBvZiB0aGUgZml2ZSBzaW1wbGV4IGNvcm5lcnNcbiAgICAgIHZhciBpaSA9IGkgJiAyNTU7XG4gICAgICB2YXIgamogPSBqICYgMjU1O1xuICAgICAgdmFyIGtrID0gayAmIDI1NTtcbiAgICAgIHZhciBsbCA9IGwgJiAyNTU7XG4gICAgICAvLyBDYWxjdWxhdGUgdGhlIGNvbnRyaWJ1dGlvbiBmcm9tIHRoZSBmaXZlIGNvcm5lcnNcbiAgICAgIHZhciB0MCA9IDAuNiAtIHgwICogeDAgLSB5MCAqIHkwIC0gejAgKiB6MCAtIHcwICogdzA7XG4gICAgICBpZiAodDAgPCAwKSBuMCA9IDAuMDtcbiAgICAgIGVsc2Uge1xuICAgICAgICB2YXIgZ2kwID0gKHBlcm1baWkgKyBwZXJtW2pqICsgcGVybVtrayArIHBlcm1bbGxdXV1dICUgMzIpICogNDtcbiAgICAgICAgdDAgKj0gdDA7XG4gICAgICAgIG4wID0gdDAgKiB0MCAqIChncmFkNFtnaTBdICogeDAgKyBncmFkNFtnaTAgKyAxXSAqIHkwICsgZ3JhZDRbZ2kwICsgMl0gKiB6MCArIGdyYWQ0W2dpMCArIDNdICogdzApO1xuICAgICAgfVxuICAgICAgdmFyIHQxID0gMC42IC0geDEgKiB4MSAtIHkxICogeTEgLSB6MSAqIHoxIC0gdzEgKiB3MTtcbiAgICAgIGlmICh0MSA8IDApIG4xID0gMC4wO1xuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciBnaTEgPSAocGVybVtpaSArIGkxICsgcGVybVtqaiArIGoxICsgcGVybVtrayArIGsxICsgcGVybVtsbCArIGwxXV1dXSAlIDMyKSAqIDQ7XG4gICAgICAgIHQxICo9IHQxO1xuICAgICAgICBuMSA9IHQxICogdDEgKiAoZ3JhZDRbZ2kxXSAqIHgxICsgZ3JhZDRbZ2kxICsgMV0gKiB5MSArIGdyYWQ0W2dpMSArIDJdICogejEgKyBncmFkNFtnaTEgKyAzXSAqIHcxKTtcbiAgICAgIH1cbiAgICAgIHZhciB0MiA9IDAuNiAtIHgyICogeDIgLSB5MiAqIHkyIC0gejIgKiB6MiAtIHcyICogdzI7XG4gICAgICBpZiAodDIgPCAwKSBuMiA9IDAuMDtcbiAgICAgIGVsc2Uge1xuICAgICAgICB2YXIgZ2kyID0gKHBlcm1baWkgKyBpMiArIHBlcm1bamogKyBqMiArIHBlcm1ba2sgKyBrMiArIHBlcm1bbGwgKyBsMl1dXV0gJSAzMikgKiA0O1xuICAgICAgICB0MiAqPSB0MjtcbiAgICAgICAgbjIgPSB0MiAqIHQyICogKGdyYWQ0W2dpMl0gKiB4MiArIGdyYWQ0W2dpMiArIDFdICogeTIgKyBncmFkNFtnaTIgKyAyXSAqIHoyICsgZ3JhZDRbZ2kyICsgM10gKiB3Mik7XG4gICAgICB9XG4gICAgICB2YXIgdDMgPSAwLjYgLSB4MyAqIHgzIC0geTMgKiB5MyAtIHozICogejMgLSB3MyAqIHczO1xuICAgICAgaWYgKHQzIDwgMCkgbjMgPSAwLjA7XG4gICAgICBlbHNlIHtcbiAgICAgICAgdmFyIGdpMyA9IChwZXJtW2lpICsgaTMgKyBwZXJtW2pqICsgajMgKyBwZXJtW2trICsgazMgKyBwZXJtW2xsICsgbDNdXV1dICUgMzIpICogNDtcbiAgICAgICAgdDMgKj0gdDM7XG4gICAgICAgIG4zID0gdDMgKiB0MyAqIChncmFkNFtnaTNdICogeDMgKyBncmFkNFtnaTMgKyAxXSAqIHkzICsgZ3JhZDRbZ2kzICsgMl0gKiB6MyArIGdyYWQ0W2dpMyArIDNdICogdzMpO1xuICAgICAgfVxuICAgICAgdmFyIHQ0ID0gMC42IC0geDQgKiB4NCAtIHk0ICogeTQgLSB6NCAqIHo0IC0gdzQgKiB3NDtcbiAgICAgIGlmICh0NCA8IDApIG40ID0gMC4wO1xuICAgICAgZWxzZSB7XG4gICAgICAgIHZhciBnaTQgPSAocGVybVtpaSArIDEgKyBwZXJtW2pqICsgMSArIHBlcm1ba2sgKyAxICsgcGVybVtsbCArIDFdXV1dICUgMzIpICogNDtcbiAgICAgICAgdDQgKj0gdDQ7XG4gICAgICAgIG40ID0gdDQgKiB0NCAqIChncmFkNFtnaTRdICogeDQgKyBncmFkNFtnaTQgKyAxXSAqIHk0ICsgZ3JhZDRbZ2k0ICsgMl0gKiB6NCArIGdyYWQ0W2dpNCArIDNdICogdzQpO1xuICAgICAgfVxuICAgICAgLy8gU3VtIHVwIGFuZCBzY2FsZSB0aGUgcmVzdWx0IHRvIGNvdmVyIHRoZSByYW5nZSBbLTEsMV1cbiAgICAgIHJldHVybiAyNy4wICogKG4wICsgbjEgKyBuMiArIG4zICsgbjQpO1xuICAgIH1cbiAgfTtcblxuICBmdW5jdGlvbiBidWlsZFBlcm11dGF0aW9uVGFibGUocmFuZG9tKSB7XG4gICAgdmFyIGk7XG4gICAgdmFyIHAgPSBuZXcgVWludDhBcnJheSgyNTYpO1xuICAgIGZvciAoaSA9IDA7IGkgPCAyNTY7IGkrKykge1xuICAgICAgcFtpXSA9IGk7XG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCAyNTU7IGkrKykge1xuICAgICAgdmFyIHIgPSBpICsgfn4ocmFuZG9tKCkgKiAoMjU2IC0gaSkpO1xuICAgICAgdmFyIGF1eCA9IHBbaV07XG4gICAgICBwW2ldID0gcFtyXTtcbiAgICAgIHBbcl0gPSBhdXg7XG4gICAgfVxuICAgIHJldHVybiBwO1xuICB9XG4gIFNpbXBsZXhOb2lzZS5fYnVpbGRQZXJtdXRhdGlvblRhYmxlID0gYnVpbGRQZXJtdXRhdGlvblRhYmxlO1xuXG4gIGZ1bmN0aW9uIGFsZWEoKSB7XG4gICAgLy8gSm9oYW5uZXMgQmFhZ8O4ZSA8YmFhZ29lQGJhYWdvZS5jb20+LCAyMDEwXG4gICAgdmFyIHMwID0gMDtcbiAgICB2YXIgczEgPSAwO1xuICAgIHZhciBzMiA9IDA7XG4gICAgdmFyIGMgPSAxO1xuXG4gICAgdmFyIG1hc2ggPSBtYXNoZXIoKTtcbiAgICBzMCA9IG1hc2goJyAnKTtcbiAgICBzMSA9IG1hc2goJyAnKTtcbiAgICBzMiA9IG1hc2goJyAnKTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBzMCAtPSBtYXNoKGFyZ3VtZW50c1tpXSk7XG4gICAgICBpZiAoczAgPCAwKSB7XG4gICAgICAgIHMwICs9IDE7XG4gICAgICB9XG4gICAgICBzMSAtPSBtYXNoKGFyZ3VtZW50c1tpXSk7XG4gICAgICBpZiAoczEgPCAwKSB7XG4gICAgICAgIHMxICs9IDE7XG4gICAgICB9XG4gICAgICBzMiAtPSBtYXNoKGFyZ3VtZW50c1tpXSk7XG4gICAgICBpZiAoczIgPCAwKSB7XG4gICAgICAgIHMyICs9IDE7XG4gICAgICB9XG4gICAgfVxuICAgIG1hc2ggPSBudWxsO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB0ID0gMjA5MTYzOSAqIHMwICsgYyAqIDIuMzI4MzA2NDM2NTM4Njk2M2UtMTA7IC8vIDJeLTMyXG4gICAgICBzMCA9IHMxO1xuICAgICAgczEgPSBzMjtcbiAgICAgIHJldHVybiBzMiA9IHQgLSAoYyA9IHQgfCAwKTtcbiAgICB9O1xuICB9XG4gIGZ1bmN0aW9uIG1hc2hlcigpIHtcbiAgICB2YXIgbiA9IDB4ZWZjODI0OWQ7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIGRhdGEgPSBkYXRhLnRvU3RyaW5nKCk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbiArPSBkYXRhLmNoYXJDb2RlQXQoaSk7XG4gICAgICAgIHZhciBoID0gMC4wMjUxOTYwMzI4MjQxNjkzOCAqIG47XG4gICAgICAgIG4gPSBoID4+PiAwO1xuICAgICAgICBoIC09IG47XG4gICAgICAgIGggKj0gbjtcbiAgICAgICAgbiA9IGggPj4+IDA7XG4gICAgICAgIGggLT0gbjtcbiAgICAgICAgbiArPSBoICogMHgxMDAwMDAwMDA7IC8vIDJeMzJcbiAgICAgIH1cbiAgICAgIHJldHVybiAobiA+Pj4gMCkgKiAyLjMyODMwNjQzNjUzODY5NjNlLTEwOyAvLyAyXi0zMlxuICAgIH07XG4gIH1cblxuICAvLyBhbWRcbiAgaWYgKHR5cGVvZiBkZWZpbmUgIT09ICd1bmRlZmluZWQnICYmIGRlZmluZS5hbWQpIGRlZmluZShmdW5jdGlvbigpIHtyZXR1cm4gU2ltcGxleE5vaXNlO30pO1xuICAvLyBjb21tb24ganNcbiAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykgZXhwb3J0cy5TaW1wbGV4Tm9pc2UgPSBTaW1wbGV4Tm9pc2U7XG4gIC8vIGJyb3dzZXJcbiAgZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHdpbmRvdy5TaW1wbGV4Tm9pc2UgPSBTaW1wbGV4Tm9pc2U7XG4gIC8vIG5vZGVqc1xuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFNpbXBsZXhOb2lzZTtcbiAgfVxuXG59KSgpO1xuIiwiLyohXG4gKiBQcm9jZWR1cmFsIEFydCAtIFByb2NlZHVyYWxseSBnZW5lcmF0ZWQgYXJ0IChwcm9jZWR1cmFsLWFydCB2MS4wLjAgLSBodHRwczovL2dpdGh1Yi5jb20vYmh1ZGlheHl6L3Byb2NlZHVyYWwtYXJ0KVxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCAoaHR0cHM6Ly9naXRodWIuY29tL2JodWRpYXh5ei9wcm9jZWR1cmFsLWFydC9ibG9iL21hc3Rlci9MSUNFTlNFKVxuICpcbiAqIEJhc2VkIG9uIHdvcmtzIG9mOiBodHRwczovL2dpdGh1Yi5jb20vYWxhbi1sdW8vcGxhbmV0cHJvY2VkdXJhbCBhbmQgaHR0cHM6Ly9naXRodWIuY29tL21hcmlhbjQyL3Byb2NlZHVyYWxhcnRcbiAqL1xuXG52YXIgQ29sb3IgPSB7fTtcblxuKGZ1bmN0aW9uICgpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgQ29sb3IgPSB7XG5cbiAgICB0b0hzbFN0cmluZzogZnVuY3Rpb24gKGNvbG9yKSB7XG4gICAgICByZXR1cm4gXCJoc2woXCIgKyAoY29sb3IuaCAlIDEuMCkgKiAzNjAgKyBcIiwgXCIgKyAoY29sb3IucyAlIDEuMCkgKiAxMDAgKyBcIiUsIFwiICsgKGNvbG9yLmwgJSAxLjApICogMTAwICsgXCIlKVwiO1xuICAgIH0sXG5cbiAgICB0b1JnYlN0cmluZzogZnVuY3Rpb24gKGNvbG9yKSB7XG4gICAgICByZXR1cm4gXCJyZ2IoXCIgKyBjb2xvci5yICogMjU1ICsgXCIsXCIgKyBjb2xvci5nICogMjU1ICsgXCIsXCIgKyBjb2xvci5iICogMjU1ICsgXCIpXCI7XG4gICAgfSxcblxuICAgIHRvUmdiYVN0cmluZzogZnVuY3Rpb24gKGNvbG9yKSB7XG4gICAgICByZXR1cm4gXCJyZ2IoXCIgKyBjb2xvci5yICogMjU1ICsgXCIsXCIgKyBjb2xvci5nICogMjU1ICsgXCIsXCIgKyBjb2xvci5iICogMjU1ICsgXCIsXCIgKyBjb2xvci5hICsgXCIpXCI7XG4gICAgfSxcblxuICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzE3MjQzMDcwLzg5NTU4OVxuICAgIC8qIGFjY2VwdHMgcGFyYW1ldGVyc1xuICAgICAqIGggIE9iamVjdCA9IHtoOngsIHM6eSwgdjp6fVxuICAgICAqIE9SXG4gICAgICogaCwgcywgdlxuICAgICAqL1xuICAgIGdldFJHQjogZnVuY3Rpb24gKGgsIHMsIHYpIHtcbiAgICAgIHdoaWxlIChoID4gMSkgaCAtPSAxO1xuICAgICAgd2hpbGUgKGggPCAwKSBoICs9IDE7XG5cbiAgICAgIHZhciByLCBnLCBiLCBpLCBmLCBwLCBxLCB0O1xuICAgICAgaWYgKGggJiYgcyA9PT0gdW5kZWZpbmVkICYmIHYgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBzID0gaC5zLCB2ID0gaC52LCBoID0gaC5oO1xuICAgICAgfVxuICAgICAgaSA9IE1hdGguZmxvb3IoaCAqIDYpO1xuICAgICAgZiA9IGggKiA2IC0gaTtcbiAgICAgIHAgPSB2ICogKDEgLSBzKTtcbiAgICAgIHEgPSB2ICogKDEgLSBmICogcyk7XG4gICAgICB0ID0gdiAqICgxIC0gKDEgLSBmKSAqIHMpO1xuICAgICAgc3dpdGNoIChpICUgNikge1xuICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgciA9IHYsIGcgPSB0LCBiID0gcDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIHIgPSBxLCBnID0gdiwgYiA9IHA7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICByID0gcCwgZyA9IHYsIGIgPSB0O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgciA9IHAsIGcgPSBxLCBiID0gdjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgIHIgPSB0LCBnID0gcCwgYiA9IHY7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgNTpcbiAgICAgICAgICByID0gdiwgZyA9IHAsIGIgPSBxO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcjogTWF0aC5mbG9vcihyICogMjU1KSxcbiAgICAgICAgZzogTWF0aC5mbG9vcihnICogMjU1KSxcbiAgICAgICAgYjogTWF0aC5mbG9vcihiICogMjU1KVxuICAgICAgfTtcbiAgICB9LFxuXG4gICAgZ2V0Q29sb3JTdHJpbmc6IGZ1bmN0aW9uIChjb2xvciwgYWxwaGEpIHtcbiAgICAgIGlmIChhbHBoYSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICBhbHBoYSA9IDE7XG4gICAgICByZXR1cm4gJ3JnYmEoJyArIGNvbG9yLnIgKyAnLCAnICsgY29sb3IuZyArICcsICcgKyBjb2xvci5iICsgJywgJyArIGFscGhhICsgJyknO1xuICAgIH0sXG5cbiAgICBoc2xUb0NvbG9yOiBmdW5jdGlvbiAoc3RyaW5nKSB7XG4gICAgfVxuICB9OyAvLyBDb2xvclxuXG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiKVxuICAgIG1vZHVsZS5leHBvcnRzID0gQ29sb3I7XG5cbn0pKCk7XG4iLCIvKiFcbiAqIFByb2NlZHVyYWwgQXJ0IC0gUHJvY2VkdXJhbGx5IGdlbmVyYXRlZCBhcnQgKHByb2NlZHVyYWwtYXJ0IHYxLjAuMCAtIGh0dHBzOi8vZ2l0aHViLmNvbS9iaHVkaWF4eXovcHJvY2VkdXJhbC1hcnQpXG4gKlxuICogTGljZW5zZWQgdW5kZXIgTUlUIChodHRwczovL2dpdGh1Yi5jb20vYmh1ZGlheHl6L3Byb2NlZHVyYWwtYXJ0L2Jsb2IvbWFzdGVyL0xJQ0VOU0UpXG4gKlxuICogQmFzZWQgb24gd29ya3Mgb2Y6IGh0dHBzOi8vZ2l0aHViLmNvbS9hbGFuLWx1by9wbGFuZXRwcm9jZWR1cmFsIGFuZCBodHRwczovL2dpdGh1Yi5jb20vbWFyaWFuNDIvcHJvY2VkdXJhbGFydFxuICovXG5cbnZhciBEZWxhdW5heSA9IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuICBcInVzZSBzdHJpY3RcIjtcblxuICB2YXIgRVBTSUxPTiA9IDEuMCAvIDEwNDg1NzYuMDtcblxuICBmdW5jdGlvbiBzdXBlcnRyaWFuZ2xlKHZlcnRpY2VzKSB7XG4gICAgdmFyIHhtaW4gPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXG4gICAgICB5bWluID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZLFxuICAgICAgeG1heCA9IE51bWJlci5ORUdBVElWRV9JTkZJTklUWSxcbiAgICAgIHltYXggPSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFksXG4gICAgICBpLCBkeCwgZHksIGRtYXgsIHhtaWQsIHltaWQ7XG5cbiAgICBmb3IgKGkgPSB2ZXJ0aWNlcy5sZW5ndGg7IGktLTspIHtcbiAgICAgIGlmICh2ZXJ0aWNlc1tpXVswXSA8IHhtaW4pIHhtaW4gPSB2ZXJ0aWNlc1tpXVswXTtcbiAgICAgIGlmICh2ZXJ0aWNlc1tpXVswXSA+IHhtYXgpIHhtYXggPSB2ZXJ0aWNlc1tpXVswXTtcbiAgICAgIGlmICh2ZXJ0aWNlc1tpXVsxXSA8IHltaW4pIHltaW4gPSB2ZXJ0aWNlc1tpXVsxXTtcbiAgICAgIGlmICh2ZXJ0aWNlc1tpXVsxXSA+IHltYXgpIHltYXggPSB2ZXJ0aWNlc1tpXVsxXTtcbiAgICB9XG5cbiAgICBkeCA9IHhtYXggLSB4bWluO1xuICAgIGR5ID0geW1heCAtIHltaW47XG4gICAgZG1heCA9IE1hdGgubWF4KGR4LCBkeSk7XG4gICAgeG1pZCA9IHhtaW4gKyBkeCAqIDAuNTtcbiAgICB5bWlkID0geW1pbiArIGR5ICogMC41O1xuXG4gICAgcmV0dXJuIFtcbiAgICAgIFt4bWlkIC0gMjAgKiBkbWF4LCB5bWlkIC0gZG1heF0sXG4gICAgICBbeG1pZCwgeW1pZCArIDIwICogZG1heF0sXG4gICAgICBbeG1pZCArIDIwICogZG1heCwgeW1pZCAtIGRtYXhdXG4gICAgXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNpcmN1bWNpcmNsZSh2ZXJ0aWNlcywgaSwgaiwgaykge1xuICAgIHZhciB4MSA9IHZlcnRpY2VzW2ldWzBdLFxuICAgICAgeTEgPSB2ZXJ0aWNlc1tpXVsxXSxcbiAgICAgIHgyID0gdmVydGljZXNbal1bMF0sXG4gICAgICB5MiA9IHZlcnRpY2VzW2pdWzFdLFxuICAgICAgeDMgPSB2ZXJ0aWNlc1trXVswXSxcbiAgICAgIHkzID0gdmVydGljZXNba11bMV0sXG4gICAgICBmYWJzeTF5MiA9IE1hdGguYWJzKHkxIC0geTIpLFxuICAgICAgZmFic3kyeTMgPSBNYXRoLmFicyh5MiAtIHkzKSxcbiAgICAgIHhjLCB5YywgbTEsIG0yLCBteDEsIG14MiwgbXkxLCBteTIsIGR4LCBkeTtcblxuICAgIC8qIENoZWNrIGZvciBjb2luY2lkZW50IHBvaW50cyAqL1xuICAgIGlmIChmYWJzeTF5MiA8IEVQU0lMT04gJiYgZmFic3kyeTMgPCBFUFNJTE9OKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRWVrISBDb2luY2lkZW50IHBvaW50cyFcIik7XG5cbiAgICBpZiAoZmFic3kxeTIgPCBFUFNJTE9OKSB7XG4gICAgICBtMiA9IC0oKHgzIC0geDIpIC8gKHkzIC0geTIpKTtcbiAgICAgIG14MiA9ICh4MiArIHgzKSAvIDIuMDtcbiAgICAgIG15MiA9ICh5MiArIHkzKSAvIDIuMDtcbiAgICAgIHhjID0gKHgyICsgeDEpIC8gMi4wO1xuICAgICAgeWMgPSBtMiAqICh4YyAtIG14MikgKyBteTI7XG4gICAgfSBlbHNlIGlmIChmYWJzeTJ5MyA8IEVQU0lMT04pIHtcbiAgICAgIG0xID0gLSgoeDIgLSB4MSkgLyAoeTIgLSB5MSkpO1xuICAgICAgbXgxID0gKHgxICsgeDIpIC8gMi4wO1xuICAgICAgbXkxID0gKHkxICsgeTIpIC8gMi4wO1xuICAgICAgeGMgPSAoeDMgKyB4MikgLyAyLjA7XG4gICAgICB5YyA9IG0xICogKHhjIC0gbXgxKSArIG15MTtcbiAgICB9IGVsc2Uge1xuICAgICAgbTEgPSAtKCh4MiAtIHgxKSAvICh5MiAtIHkxKSk7XG4gICAgICBtMiA9IC0oKHgzIC0geDIpIC8gKHkzIC0geTIpKTtcbiAgICAgIG14MSA9ICh4MSArIHgyKSAvIDIuMDtcbiAgICAgIG14MiA9ICh4MiArIHgzKSAvIDIuMDtcbiAgICAgIG15MSA9ICh5MSArIHkyKSAvIDIuMDtcbiAgICAgIG15MiA9ICh5MiArIHkzKSAvIDIuMDtcbiAgICAgIHhjID0gKG0xICogbXgxIC0gbTIgKiBteDIgKyBteTIgLSBteTEpIC8gKG0xIC0gbTIpO1xuICAgICAgeWMgPSAoZmFic3kxeTIgPiBmYWJzeTJ5MykgP1xuICAgICAgICBtMSAqICh4YyAtIG14MSkgKyBteTEgOlxuICAgICAgICBtMiAqICh4YyAtIG14MikgKyBteTI7XG4gICAgfVxuXG4gICAgZHggPSB4MiAtIHhjO1xuICAgIGR5ID0geTIgLSB5YztcbiAgICByZXR1cm4ge2k6IGksIGo6IGosIGs6IGssIHg6IHhjLCB5OiB5YywgcjogZHggKiBkeCArIGR5ICogZHl9O1xuICB9XG5cbiAgZnVuY3Rpb24gZGVkdXAoZWRnZXMpIHtcbiAgICB2YXIgaSwgaiwgYSwgYiwgbSwgbjtcblxuICAgIGZvciAoaiA9IGVkZ2VzLmxlbmd0aDsgajspIHtcbiAgICAgIGIgPSBlZGdlc1stLWpdO1xuICAgICAgYSA9IGVkZ2VzWy0tal07XG5cbiAgICAgIGZvciAoaSA9IGo7IGk7KSB7XG4gICAgICAgIG4gPSBlZGdlc1stLWldO1xuICAgICAgICBtID0gZWRnZXNbLS1pXTtcblxuICAgICAgICBpZiAoKGEgPT09IG0gJiYgYiA9PT0gbikgfHwgKGEgPT09IG4gJiYgYiA9PT0gbSkpIHtcbiAgICAgICAgICBlZGdlcy5zcGxpY2UoaiwgMik7XG4gICAgICAgICAgZWRnZXMuc3BsaWNlKGksIDIpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgRGVsYXVuYXkgPSB7XG4gICAgdHJpYW5ndWxhdGU6IGZ1bmN0aW9uICh2ZXJ0aWNlcywga2V5KSB7XG4gICAgICB2YXIgbiA9IHZlcnRpY2VzLmxlbmd0aCxcbiAgICAgICAgaSwgaiwgaW5kaWNlcywgc3QsIG9wZW4sIGNsb3NlZCwgZWRnZXMsIGR4LCBkeSwgYSwgYiwgYztcblxuICAgICAgLyogQmFpbCBpZiB0aGVyZSBhcmVuJ3QgZW5vdWdoIHZlcnRpY2VzIHRvIGZvcm0gYW55IHRyaWFuZ2xlcy4gKi9cbiAgICAgIGlmIChuIDwgMylcbiAgICAgICAgcmV0dXJuIFtdO1xuXG4gICAgICAvKiBTbGljZSBvdXQgdGhlIGFjdHVhbCB2ZXJ0aWNlcyBmcm9tIHRoZSBwYXNzZWQgb2JqZWN0cy4gKER1cGxpY2F0ZSB0aGVcbiAgICAgICAqIGFycmF5IGV2ZW4gaWYgd2UgZG9uJ3QsIHRob3VnaCwgc2luY2Ugd2UgbmVlZCB0byBtYWtlIGEgc3VwZXJ0cmlhbmdsZVxuICAgICAgICogbGF0ZXIgb24hKSAqL1xuICAgICAgdmVydGljZXMgPSB2ZXJ0aWNlcy5zbGljZSgwKTtcblxuICAgICAgaWYgKGtleSlcbiAgICAgICAgZm9yIChpID0gbjsgaS0tOylcbiAgICAgICAgICB2ZXJ0aWNlc1tpXSA9IHZlcnRpY2VzW2ldW2tleV07XG5cbiAgICAgIC8qIE1ha2UgYW4gYXJyYXkgb2YgaW5kaWNlcyBpbnRvIHRoZSB2ZXJ0ZXggYXJyYXksIHNvcnRlZCBieSB0aGVcbiAgICAgICAqIHZlcnRpY2VzJyB4LXBvc2l0aW9uLiAqL1xuICAgICAgaW5kaWNlcyA9IG5ldyBBcnJheShuKTtcblxuICAgICAgZm9yIChpID0gbjsgaS0tOylcbiAgICAgICAgaW5kaWNlc1tpXSA9IGk7XG5cbiAgICAgIGluZGljZXMuc29ydChmdW5jdGlvbiAoaSwgaikge1xuICAgICAgICByZXR1cm4gdmVydGljZXNbal1bMF0gLSB2ZXJ0aWNlc1tpXVswXTtcbiAgICAgIH0pO1xuXG4gICAgICAvKiBOZXh0LCBmaW5kIHRoZSB2ZXJ0aWNlcyBvZiB0aGUgc3VwZXJ0cmlhbmdsZSAod2hpY2ggY29udGFpbnMgYWxsIG90aGVyXG4gICAgICAgKiB0cmlhbmdsZXMpLCBhbmQgYXBwZW5kIHRoZW0gb250byB0aGUgZW5kIG9mIGEgKGNvcHkgb2YpIHRoZSB2ZXJ0ZXhcbiAgICAgICAqIGFycmF5LiAqL1xuICAgICAgc3QgPSBzdXBlcnRyaWFuZ2xlKHZlcnRpY2VzKTtcbiAgICAgIHZlcnRpY2VzLnB1c2goc3RbMF0sIHN0WzFdLCBzdFsyXSk7XG5cbiAgICAgIC8qIEluaXRpYWxpemUgdGhlIG9wZW4gbGlzdCAoY29udGFpbmluZyB0aGUgc3VwZXJ0cmlhbmdsZSBhbmQgbm90aGluZ1xuICAgICAgICogZWxzZSkgYW5kIHRoZSBjbG9zZWQgbGlzdCAod2hpY2ggaXMgZW1wdHkgc2luY2Ugd2UgaGF2bid0IHByb2Nlc3NlZFxuICAgICAgICogYW55IHRyaWFuZ2xlcyB5ZXQpLiAqL1xuICAgICAgb3BlbiA9IFtjaXJjdW1jaXJjbGUodmVydGljZXMsIG4gKyAwLCBuICsgMSwgbiArIDIpXTtcbiAgICAgIGNsb3NlZCA9IFtdO1xuICAgICAgZWRnZXMgPSBbXTtcblxuICAgICAgLyogSW5jcmVtZW50YWxseSBhZGQgZWFjaCB2ZXJ0ZXggdG8gdGhlIG1lc2guICovXG4gICAgICBmb3IgKGkgPSBpbmRpY2VzLmxlbmd0aDsgaS0tOyBlZGdlcy5sZW5ndGggPSAwKSB7XG4gICAgICAgIGMgPSBpbmRpY2VzW2ldO1xuXG4gICAgICAgIC8qIEZvciBlYWNoIG9wZW4gdHJpYW5nbGUsIGNoZWNrIHRvIHNlZSBpZiB0aGUgY3VycmVudCBwb2ludCBpc1xuICAgICAgICAgKiBpbnNpZGUgaXQncyBjaXJjdW1jaXJjbGUuIElmIGl0IGlzLCByZW1vdmUgdGhlIHRyaWFuZ2xlIGFuZCBhZGRcbiAgICAgICAgICogaXQncyBlZGdlcyB0byBhbiBlZGdlIGxpc3QuICovXG4gICAgICAgIGZvciAoaiA9IG9wZW4ubGVuZ3RoOyBqLS07KSB7XG4gICAgICAgICAgLyogSWYgdGhpcyBwb2ludCBpcyB0byB0aGUgcmlnaHQgb2YgdGhpcyB0cmlhbmdsZSdzIGNpcmN1bWNpcmNsZSxcbiAgICAgICAgICAgKiB0aGVuIHRoaXMgdHJpYW5nbGUgc2hvdWxkIG5ldmVyIGdldCBjaGVja2VkIGFnYWluLiBSZW1vdmUgaXRcbiAgICAgICAgICAgKiBmcm9tIHRoZSBvcGVuIGxpc3QsIGFkZCBpdCB0byB0aGUgY2xvc2VkIGxpc3QsIGFuZCBza2lwLiAqL1xuICAgICAgICAgIGR4ID0gdmVydGljZXNbY11bMF0gLSBvcGVuW2pdLng7XG4gICAgICAgICAgaWYgKGR4ID4gMC4wICYmIGR4ICogZHggPiBvcGVuW2pdLnIpIHtcbiAgICAgICAgICAgIGNsb3NlZC5wdXNoKG9wZW5bal0pO1xuICAgICAgICAgICAgb3Blbi5zcGxpY2UoaiwgMSk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvKiBJZiB3ZSdyZSBvdXRzaWRlIHRoZSBjaXJjdW1jaXJjbGUsIHNraXAgdGhpcyB0cmlhbmdsZS4gKi9cbiAgICAgICAgICBkeSA9IHZlcnRpY2VzW2NdWzFdIC0gb3BlbltqXS55O1xuICAgICAgICAgIGlmIChkeCAqIGR4ICsgZHkgKiBkeSAtIG9wZW5bal0uciA+IEVQU0lMT04pXG4gICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgIC8qIFJlbW92ZSB0aGUgdHJpYW5nbGUgYW5kIGFkZCBpdCdzIGVkZ2VzIHRvIHRoZSBlZGdlIGxpc3QuICovXG4gICAgICAgICAgZWRnZXMucHVzaChcbiAgICAgICAgICAgIG9wZW5bal0uaSwgb3BlbltqXS5qLFxuICAgICAgICAgICAgb3BlbltqXS5qLCBvcGVuW2pdLmssXG4gICAgICAgICAgICBvcGVuW2pdLmssIG9wZW5bal0uaVxuICAgICAgICAgICk7XG4gICAgICAgICAgb3Blbi5zcGxpY2UoaiwgMSk7XG4gICAgICAgIH1cblxuICAgICAgICAvKiBSZW1vdmUgYW55IGRvdWJsZWQgZWRnZXMuICovXG4gICAgICAgIGRlZHVwKGVkZ2VzKTtcblxuICAgICAgICAvKiBBZGQgYSBuZXcgdHJpYW5nbGUgZm9yIGVhY2ggZWRnZS4gKi9cbiAgICAgICAgZm9yIChqID0gZWRnZXMubGVuZ3RoOyBqOykge1xuICAgICAgICAgIGIgPSBlZGdlc1stLWpdO1xuICAgICAgICAgIGEgPSBlZGdlc1stLWpdO1xuICAgICAgICAgIG9wZW4ucHVzaChjaXJjdW1jaXJjbGUodmVydGljZXMsIGEsIGIsIGMpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvKiBDb3B5IGFueSByZW1haW5pbmcgb3BlbiB0cmlhbmdsZXMgdG8gdGhlIGNsb3NlZCBsaXN0LCBhbmQgdGhlblxuICAgICAgICogcmVtb3ZlIGFueSB0cmlhbmdsZXMgdGhhdCBzaGFyZSBhIHZlcnRleCB3aXRoIHRoZSBzdXBlcnRyaWFuZ2xlLFxuICAgICAgICogYnVpbGRpbmcgYSBsaXN0IG9mIHRyaXBsZXRzIHRoYXQgcmVwcmVzZW50IHRyaWFuZ2xlcy4gKi9cbiAgICAgIGZvciAoaSA9IG9wZW4ubGVuZ3RoOyBpLS07KVxuICAgICAgICBjbG9zZWQucHVzaChvcGVuW2ldKTtcbiAgICAgIG9wZW4ubGVuZ3RoID0gMDtcblxuICAgICAgZm9yIChpID0gY2xvc2VkLmxlbmd0aDsgaS0tOylcbiAgICAgICAgaWYgKGNsb3NlZFtpXS5pIDwgbiAmJiBjbG9zZWRbaV0uaiA8IG4gJiYgY2xvc2VkW2ldLmsgPCBuKVxuICAgICAgICAgIG9wZW4ucHVzaChjbG9zZWRbaV0uaSwgY2xvc2VkW2ldLmosIGNsb3NlZFtpXS5rKTtcblxuICAgICAgLyogWWF5LCB3ZSdyZSBkb25lISAqL1xuICAgICAgcmV0dXJuIG9wZW47XG4gICAgfSxcblxuICAgIGNvbnRhaW5zOiBmdW5jdGlvbiAodHJpLCBwKSB7XG4gICAgICAvKiBCb3VuZGluZyBib3ggdGVzdCBmaXJzdCwgZm9yIHF1aWNrIHJlamVjdGlvbnMuICovXG4gICAgICBpZiAoKHBbMF0gPCB0cmlbMF1bMF0gJiYgcFswXSA8IHRyaVsxXVswXSAmJiBwWzBdIDwgdHJpWzJdWzBdKSB8fFxuICAgICAgICAocFswXSA+IHRyaVswXVswXSAmJiBwWzBdID4gdHJpWzFdWzBdICYmIHBbMF0gPiB0cmlbMl1bMF0pIHx8XG4gICAgICAgIChwWzFdIDwgdHJpWzBdWzFdICYmIHBbMV0gPCB0cmlbMV1bMV0gJiYgcFsxXSA8IHRyaVsyXVsxXSkgfHxcbiAgICAgICAgKHBbMV0gPiB0cmlbMF1bMV0gJiYgcFsxXSA+IHRyaVsxXVsxXSAmJiBwWzFdID4gdHJpWzJdWzFdKSlcbiAgICAgICAgcmV0dXJuIG51bGw7XG5cbiAgICAgIHZhciBhID0gdHJpWzFdWzBdIC0gdHJpWzBdWzBdLFxuICAgICAgICBiID0gdHJpWzJdWzBdIC0gdHJpWzBdWzBdLFxuICAgICAgICBjID0gdHJpWzFdWzFdIC0gdHJpWzBdWzFdLFxuICAgICAgICBkID0gdHJpWzJdWzFdIC0gdHJpWzBdWzFdLFxuICAgICAgICBpID0gYSAqIGQgLSBiICogYztcblxuICAgICAgLyogRGVnZW5lcmF0ZSB0cmkuICovXG4gICAgICBpZiAoaSA9PT0gMC4wKVxuICAgICAgICByZXR1cm4gbnVsbDtcblxuICAgICAgdmFyIHUgPSAoZCAqIChwWzBdIC0gdHJpWzBdWzBdKSAtIGIgKiAocFsxXSAtIHRyaVswXVsxXSkpIC8gaSxcbiAgICAgICAgdiA9IChhICogKHBbMV0gLSB0cmlbMF1bMV0pIC0gYyAqIChwWzBdIC0gdHJpWzBdWzBdKSkgLyBpO1xuXG4gICAgICAvKiBJZiB3ZSdyZSBvdXRzaWRlIHRoZSB0cmksIGZhaWwuICovXG4gICAgICBpZiAodSA8IDAuMCB8fCB2IDwgMC4wIHx8ICh1ICsgdikgPiAxLjApXG4gICAgICAgIHJldHVybiBudWxsO1xuXG4gICAgICByZXR1cm4gW3UsIHZdO1xuICAgIH1cbiAgfTsgLy8gRGVsYXVuYXlcblxuICBpZiAodHlwZW9mIG1vZHVsZSAhPT0gXCJ1bmRlZmluZWRcIilcbiAgICBtb2R1bGUuZXhwb3J0cyA9IERlbGF1bmF5O1xuXG59KSgpO1xuIiwiLyohXG4gKiBQcm9jZWR1cmFsIEFydCAtIFByb2NlZHVyYWxseSBnZW5lcmF0ZWQgYXJ0IChwcm9jZWR1cmFsLWFydCB2MS4wLjAgLSBodHRwczovL2dpdGh1Yi5jb20vYmh1ZGlheHl6L3Byb2NlZHVyYWwtYXJ0KVxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIE1JVCAoaHR0cHM6Ly9naXRodWIuY29tL2JodWRpYXh5ei9wcm9jZWR1cmFsLWFydC9ibG9iL21hc3Rlci9MSUNFTlNFKVxuICpcbiAqIEJhc2VkIG9uIHdvcmtzIG9mOiBodHRwczovL2dpdGh1Yi5jb20vYWxhbi1sdW8vcGxhbmV0cHJvY2VkdXJhbCBhbmQgaHR0cHM6Ly9naXRodWIuY29tL21hcmlhbjQyL3Byb2NlZHVyYWxhcnRcbiAqL1xuXG52YXIgRHJhdyA9IHt9O1xuXG4oZnVuY3Rpb24gKCkge1xuICBcInVzZSBzdHJpY3RcIjtcblxuICBEcmF3ID0ge1xuXG4gICAgZHJhd0xpbmU6IGZ1bmN0aW9uIChwb2ludDEsIHBvaW50MiwgY29udGV4dCkge1xuICAgICAgY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgIGNvbnRleHQubW92ZVRvKHBvaW50MS54LCBwb2ludDEueSk7XG4gICAgICBjb250ZXh0LmxpbmVUbyhwb2ludDIueCwgcG9pbnQyLnkpO1xuICAgICAgY29udGV4dC5zdHJva2UoKTtcbiAgICB9LFxuXG4gICAgc3Ryb2tlUGF0aDogZnVuY3Rpb24gKGN0eCwgcG9pbnRzKSB7XG4gICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICBjdHgubW92ZVRvKHBvaW50c1swXS54LCBwb2ludHNbMF0ueSk7XG4gICAgICBmb3IgKHZhciBpID0gMTsgaSA8IHBvaW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjdHgubGluZVRvKHBvaW50c1tpXS54LCBwb2ludHNbaV0ueSk7XG4gICAgICB9XG4gICAgICBjdHguc3Ryb2tlKCk7XG4gICAgfSxcblxuICAgIGZpbGxQYXRoOiBmdW5jdGlvbiAoY3R4LCBwb2ludHMpIHtcbiAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgIGN0eC5tb3ZlVG8ocG9pbnRzWzBdLngsIHBvaW50c1swXS55KTtcbiAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgcG9pbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGN0eC5saW5lVG8ocG9pbnRzW2ldLngsIHBvaW50c1tpXS55KTtcbiAgICAgIH1cbiAgICAgIGN0eC5saW5lVG8ocG9pbnRzWzBdLngsIHBvaW50c1swXS55KTtcbiAgICAgIGN0eC5maWxsKCk7XG4gICAgfSxcblxuICAgIC8vIFRPRE8gdGhpcyB3b3VsZCBiZSBvcHRpbWl6ZWQgYSBsb3QgaWYgaXQgZGlkbid0IHNldCBjb2xvciBldmVyeSB0aW1lXG4gICAgZHJhd1BpeGVsOiBmdW5jdGlvbiAoY3R4LCBwb3NpdGlvbiwgY29sb3IpIHtcbiAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgIGN0eC5maWxsU3R5bGUgPSBjb2xvcjtcbiAgICAgIGN0eC5yZWN0KHBvc2l0aW9uLngsIHBvc2l0aW9uLnksIDEsIDEpO1xuICAgICAgY3R4LmZpbGwoKTtcbiAgICB9LFxuXG4gICAgZHJhd0NpcmNsZTogZnVuY3Rpb24gKGN0eCwgcG9zaXRpb24sIHJhZGl1cywgY29sb3IpIHtcbiAgICAgIGN0eC5maWxsU3R5bGUgPSBjb2xvcjtcbiAgICAgIGN0eC5hcmMocG9zaXRpb24ueCwgcG9zaXRpb24ueSwgcmFkaXVzLCAwLCAyICogTWF0aC5QSSk7XG4gICAgICBjdHguZmlsbCgpO1xuICAgIH0sXG5cbiAgICBhbHRlcjogZnVuY3Rpb24gKGNvbG9yc3RyaW5nLCBwYXJhbXMpIHtcbiAgICB9XG5cbiAgfTsgLy8gRHJhd1xuXG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiKVxuICAgIG1vZHVsZS5leHBvcnRzID0gRHJhdztcblxufSkoKTtcbiIsIi8qIVxuICogUHJvY2VkdXJhbCBBcnQgLSBQcm9jZWR1cmFsbHkgZ2VuZXJhdGVkIGFydCAocHJvY2VkdXJhbC1hcnQgdjEuMC4wIC0gaHR0cHM6Ly9naXRodWIuY29tL2JodWRpYXh5ei9wcm9jZWR1cmFsLWFydClcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vZ2l0aHViLmNvbS9iaHVkaWF4eXovcHJvY2VkdXJhbC1hcnQvYmxvYi9tYXN0ZXIvTElDRU5TRSlcbiAqXG4gKiBCYXNlZCBvbiB3b3JrcyBvZjogaHR0cHM6Ly9naXRodWIuY29tL2FsYW4tbHVvL3BsYW5ldHByb2NlZHVyYWwgYW5kIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJpYW40Mi9wcm9jZWR1cmFsYXJ0XG4gKi9cblxuY29uc3QgQ29sb3IgPSByZXF1aXJlKCcuL2NvbG9yLmpzJyk7XG5jb25zdCBEcmF3ID0gcmVxdWlyZSgnLi9kcmF3LmpzJyk7XG5jb25zdCBEZWxhdW5heSA9IHJlcXVpcmUoJy4vZGVsYXVuYXkuanMnKTtcbmNvbnN0IFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcbnZhciBBbGVhID0gcmVxdWlyZSgnYWxlYScpO1xudmFyIFNpbXBsZXhOb2lzZSA9IHJlcXVpcmUoJ3NpbXBsZXgtbm9pc2UnKTtcblxuLy8gLS0tLS0tIFNldHVwIHNvbWUgYmFzaWMgc3R1ZmYgLS0tLS0tLS0tXG5cbnZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbnZhc1wiKTtcbnZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dChcIjJkXCIpO1xuY3R4LnRyYW5zbGF0ZSgwLjUsIDAuNSk7XG5jdHgud2Via2l0SW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gdHJ1ZTtcbmN0eC5pbWFnZVNtb290aGluZ0VuYWJsZWQgPSB0cnVlO1xuY3R4LnN0cm9rZVN0eWxlID0gXCIjMDAwMDAwXCI7XG5cbi8vIHZhciBjYW52YXMyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjYW52YXMyXCIpO1xuLy8gdmFyIGN0eDIgPSBjYW52YXMyLmdldENvbnRleHQoJzJkJyk7XG4vLyBjdHgyLnNhdmUoKTtcbi8vIGN0eDIud2Via2l0SW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gdHJ1ZTtcbi8vIGN0eDIuaW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gdHJ1ZTtcblxudmFyIExPV0VSX0xFRlQgPSB7eDogY2FudmFzLndpZHRoLCB5OiBjYW52YXMuaGVpZ2h0fTtcbnZhciBMT1dFUl9SSUdIVCA9IHt4OiAwLCB5OiBjYW52YXMuaGVpZ2h0fTtcbnZhciBVUFBFUl9MRUZUID0ge3g6IGNhbnZhcy53aWR0aCwgeTogMH07XG52YXIgVVBQRVJfUklHSFQgPSB7eDogMCwgeTogMH07XG5cbnZhciByYW5kb20gPSBuZXcgQWxlYSgpO1xudmFyIHNpbXBsZXggPSBuZXcgU2ltcGxleE5vaXNlKHJhbmRvbSk7IC8vIG5vaXNlIGlzIGZyb20gLTEuMCB0byAxLjBcblxuLy8gLS0tLS0tLS0tLSBVc2VmdWwgaGVscGVyIHRvb2xzIC0tLS0tLS0tLS0tLVxuXG5mdW5jdGlvbiByYW5kb21Db2xvcihicmlnaHRuZXNzKSB7XG4gIHZhciByYW5kSCwgcmFuZFMsIHJhbmRMO1xuICBpZiAoYnJpZ2h0bmVzcyA9PT0gXCJkYXJrXCIpIHtcbiAgICByYW5kSCA9IHJhbmRvbSgpO1xuICAgIHJhbmRTID0gcmFuZG9tKCkgKiAwLjQgKyAwLjM7XG4gICAgcmFuZEwgPSByYW5kb20oKSAqIDAuMTQgKyAwLjA1O1xuICB9IGVsc2UgaWYgKGJyaWdodG5lc3MgPT09IFwibWVkaXVtXCIpIHtcbiAgICByYW5kSCA9IHJhbmRvbSgpO1xuICAgIHJhbmRTID0gcmFuZG9tKCkgKiAwLjM1ICsgMC43O1xuICAgIHJhbmRMID0gcmFuZG9tKCkgKiAwLjIgKyAwLjQ7XG4gIH0gZWxzZSBpZiAoYnJpZ2h0bmVzcyA9PT0gXCJsaWdodFwiKSB7XG4gICAgcmFuZEggPSByYW5kb20oKTtcbiAgICByYW5kUyA9IHJhbmRvbSgpICogMC40ICsgMC4zO1xuICAgIHJhbmRMID0gcmFuZG9tKCkgKiAwLjIgKyAwLjc7XG4gIH0gZWxzZSB7XG4gICAgcmFuZEggPSByYW5kb20oKTtcbiAgICByYW5kUyA9IHJhbmRvbSgpO1xuICAgIHJhbmRMID0gcmFuZG9tKCk7XG4gIH1cbiAgcmV0dXJuIHtoOiByYW5kSCwgczogcmFuZFMsIGw6IHJhbmRMfTtcbn1cblxuZnVuY3Rpb24gcm9sbGluZ01vdW50YWluTm9pc2UoeCwgeikge1xuICByZXR1cm4gc2ltcGxleC5ub2lzZTJEKHosIHgpICtcbiAgICAwLjUgKiBzaW1wbGV4Lm5vaXNlMkQoMCwgMiAqIHgpO1xufVxuXG5mdW5jdGlvbiBtb3VudGFpbk5vaXNlKHgsIHopIHtcbiAgcmV0dXJuIHNpbXBsZXgubm9pc2UyRCh6LCB4KSArXG4gICAgMC41ICogc2ltcGxleC5ub2lzZTJEKDAsIDIgKiB4KSArXG4gICAgMC4yNSAqIHNpbXBsZXgubm9pc2UyRCgwLCA0ICogeCkgK1xuICAgIDAuMTI1ICogc2ltcGxleC5ub2lzZTJEKDAsIDggKiB4KTtcbn1cblxuLy8gMSBvY3RhdmVcbmZ1bmN0aW9uIGhpbGxOb2lzZSh4LCB6KSB7XG4gIHJldHVybiBzaW1wbGV4Lm5vaXNlMkQoeiwgeCk7XG59XG5cbi8vIDQgb2N0YXZlXG5mdW5jdGlvbiByb2xsaW5nSGlsbE5vaXNlKHgsIHopIHtcbiAgcmV0dXJuIG9jdGF2ZTJEKHosIHgsIDQpO1xufVxuXG5mdW5jdGlvbiBvY3RhdmUyRCh4LCB5LCBvY3RhdmVzLCBsb3dlckNhcCwgdXBwZXJDYXApIHtcbiAgaWYgKCFvY3RhdmVzKSBvY3RhdmVzID0gNjtcbiAgaWYgKCFsb3dlckNhcCkgbG93ZXJDYXAgPSAwO1xuICBpZiAoIXVwcGVyQ2FwKSB1cHBlckNhcCA9IDE7XG5cbiAgdmFyIHYgPSAwO1xuICBmb3IgKHZhciBpID0gMTsgaSA8PSBvY3RhdmVzOyBpKyspIHtcbiAgICB2YXIgcG93MiA9IE1hdGgucG93KDIsIGkgLSAxKTtcbiAgICB2YXIgcyA9IHNpbXBsZXgubm9pc2UyRCh4ICogcG93MiwgeSAqIHBvdzIpIC8gMiArIDAuNTtcbiAgICB2ICs9IHMgKiBNYXRoLnBvdygyLCAtaSk7XG4gIH1cblxuICBpZiAodiA8IGxvd2VyQ2FwKVxuICAgIHJldHVybiAwO1xuICBpZiAodiA+IHVwcGVyQ2FwKVxuICAgIHJldHVybiAxO1xuICByZXR1cm4gKHYgLSBsb3dlckNhcCkgLyAodXBwZXJDYXAgLSBsb3dlckNhcCk7XG59XG5cbi8vIC0tLS0tLSBTZXR1cCBzY2VuZSBzdHVmZiAtLS0tLS0tLS1cblxudmFyIHNjZW5lID0ge1xuICB0aW1lOiBcImRheVwiLFxuICByYW5kb206IHJhbmRvbSxcbiAgc2ltcGxleDogc2ltcGxleCxcbiAgaGlsbE5vaXNlOiBoaWxsTm9pc2UsXG4gIG1vdW50YWluTm9pc2U6IG1vdW50YWluTm9pc2UsXG4gIGVuYWJsZWQ6IHtcbiAgICBza3k6IHRydWUsXG4gICAgaGlsbHM6IHRydWUsXG4gICAgbW91bnRhaW5zOiB0cnVlLFxuICAgIHN0YXJzOiB0cnVlLFxuICAgIHBsYW5ldDogdHJ1ZSxcbiAgICBjbG91ZHM6IHRydWUsXG4gICAgdHJlZXM6IHRydWUsXG4gICAgcml2ZXI6IHRydWVcbiAgfSxcbiAgY29sb3JzOiB7XG4gICAgYmFzZToge30sXG4gICAgc2t5OiB7fSxcbiAgICBza3kyOiB7fSxcbiAgICBoaWxsczoge30sXG4gICAgbW91bnRhaW5zOiB7fSxcbiAgICBzdGFyczoge30sXG4gICAgcGxhbmV0OiB7fSxcbiAgICBjbG91ZHM6IHt9LFxuICAgIHRyZWVzOiB7fSxcbiAgICBsZWF2ZXM6IHt9LFxuICAgIHJpdmVyOiB7fVxuICB9LFxuICBtYXhWYWx1ZTogMCxcbiAgY2xpY2tCb3hlczogW11cbn07XG5cbi8vIC0tLS0tLSBSYW5kb21pemUgc29tZSBnZW5lcmF0aW9uIHByb3BlcnRpZXMgLS0tLS0tLS0tXG5cbmlmIChyYW5kb20oKSA+IDAuMzMpIHtcbiAgaWYgKHJhbmRvbSgpID4gMC4zMykge1xuICAgIHNjZW5lLnRpbWUgPSBcImRlc2VydFwiO1xuICB9IGVsc2Uge1xuICAgIHNjZW5lLnRpbWUgPSBcIm5pZ2h0XCI7XG4gIH1cbn1cbmlmIChyYW5kb20oKSA+IDAuNSkge1xuICBzY2VuZS5oaWxsTm9pc2UgPSByb2xsaW5nSGlsbE5vaXNlO1xufVxuaWYgKHJhbmRvbSgpID4gMC41KSB7XG4gIHNjZW5lLm1vdW50YWluTm9pc2UgPSByb2xsaW5nTW91bnRhaW5Ob2lzZTtcbn1cblxudmFyIGluZm9DdHggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImluZm9cIik7XG5pbmZvQ3R4LmlubmVySFRNTCA9IFwiVGltZSBvZiBkYXk6IFwiICsgc2NlbmUudGltZSArIFwiIChIaWxsczogXCIgKyBzY2VuZS5oaWxsTm9pc2UubmFtZSArIFwiLCBNb3VudGFpbnM6IFwiICsgc2NlbmUubW91bnRhaW5Ob2lzZS5uYW1lICsgXCIpXCI7XG5cbi8vIGdlbmVyYXRlIGNvbG9yczpcbmlmIChzY2VuZS50aW1lID09PSBcIm5pZ2h0XCIpIHtcblxuICB2YXIgYmFzZSA9IHJhbmRvbUNvbG9yKFwiZGFya1wiKTtcbiAgc2NlbmUuY29sb3JzLmJhc2UgPSBiYXNlO1xuICBzY2VuZS5jb2xvcnMubW91bnRhaW5zID0ge2g6IGJhc2UuaCArIHJhbmRvbSgpICogMC4yIC0gMC4xLCBzOiBiYXNlLnMgKyByYW5kb20oKSAqIDAuMiAtIDAuMSwgbDogYmFzZS5sICsgcmFuZG9tKCkgKiAwLjEgKyAwLjE1fTtcbiAgc2NlbmUuY29sb3JzLmhpbGxzID0ge2g6IHNjZW5lLmNvbG9ycy5tb3VudGFpbnMuaCArIHJhbmRvbSgpICogMC4yIC0gMC4xLCBzOiBzY2VuZS5jb2xvcnMubW91bnRhaW5zLnMgKyByYW5kb20oKSAqIDAuMiAtIDAuMSwgbDogc2NlbmUuY29sb3JzLm1vdW50YWlucy5sICsgcmFuZG9tKCkgKiAwLjEgKyAwLjE1fTtcbiAgc2NlbmUuY29sb3JzLnJpdmVyID0ge2g6IGJhc2UuaCwgczogYmFzZS5zIC0gcmFuZG9tKCkgKiAwLjEgLSAwLjA1LCBsOiBiYXNlLmwgKyByYW5kb20oKSAqIDAuMSAtIDAuMDV9O1xuICBzY2VuZS5jb2xvcnMuc2t5ID0ge2g6IGJhc2UuaCwgczogYmFzZS5zLCBsOiBiYXNlLmwgLSAwLjF9O1xuICBzY2VuZS5jb2xvcnMuc2t5MiA9IHtoOiBiYXNlLmgsIHM6IGJhc2UucywgbDogYmFzZS5sIC0gMC4yIC0gcmFuZG9tKCkgKiAwLjJ9O1xuICBzY2VuZS5jb2xvcnMuY2xvdWRzID0ge2g6IGJhc2UuaCwgczogMC40LCBsOiAwLjJ9O1xuICBzY2VuZS5jb2xvcnMudHJlZXMgPSB7aDogYmFzZS5oICsgMC41LCBzOiAwLjQsIGw6IDAuMn07XG4gIHNjZW5lLmNvbG9ycy5sZWF2ZXMgPSB7aDogc2NlbmUuY29sb3JzLnRyZWVzLmggKyAwLjUsIHM6IDAuNiwgbDogMC41fTtcbiAgc2NlbmUuY29sb3JzLmxlYXZlczIgPSB7aDogc2NlbmUuY29sb3JzLnRyZWVzLmggKyAwLjQsIHM6IDAuNiwgbDogMC41fTtcbiAgc2NlbmUuY29sb3JzLnBsYW5ldCA9IHtoOiBzY2VuZS5jb2xvcnMuaGlsbHMuaCwgczogMC40LCBsOiAwLjR9O1xuXG59IGVsc2UgaWYgKHNjZW5lLnRpbWUgPT09IFwiZGF5XCIpIHtcblxuICB2YXIgYmFzZSA9IHJhbmRvbUNvbG9yKFwibWVkaXVtXCIpO1xuICBzY2VuZS5jb2xvcnMuYmFzZSA9IGJhc2U7XG4gIHNjZW5lLmNvbG9ycy5tb3VudGFpbnMgPSB7aDogYmFzZS5oICsgMC40ICsgcmFuZG9tKCkgKiAwLjEsIHM6IDAuMiArIHJhbmRvbSgpICogMC4yLCBsOiBiYXNlLmwgKyByYW5kb20oKSAqIDAuMSAtIDAuMDV9O1xuICBzY2VuZS5jb2xvcnMuaGlsbHMgPSB7aDogc2NlbmUuY29sb3JzLm1vdW50YWlucy5oICsgcmFuZG9tKCkgKiAwLjIgLSAwLjEsIHM6IDAuNCArIHJhbmRvbSgpICogMC4yLCBsOiBiYXNlLmwgKyByYW5kb20oKSAqIDAuMX07XG4gIHNjZW5lLmNvbG9ycy5yaXZlciA9IHtoOiBiYXNlLmgsIHM6IGJhc2UucyAtIHJhbmRvbSgpICogMC4xIC0gMC4wNSwgbDogYmFzZS5sICsgcmFuZG9tKCkgKiAwLjEgKyAwLjJ9O1xuICBzY2VuZS5jb2xvcnMuc2t5ID0ge2g6IGJhc2UuaCwgczogYmFzZS5zLCBsOiBiYXNlLmwgLSAwLjF9O1xuICBzY2VuZS5jb2xvcnMuc2t5MiA9IHtoOiBiYXNlLmgsIHM6IGJhc2UucywgbDogYmFzZS5sIC0gMC4yIC0gcmFuZG9tKCkgKiAwLjJ9O1xuICBzY2VuZS5jb2xvcnMuY2xvdWRzID0ge2g6IGJhc2UuaCwgczogMC4zLCBsOiAwLjl9O1xuICBzY2VuZS5jb2xvcnMudHJlZXMgPSB7aDogYmFzZS5oLCBzOiAwLjQsIGw6IDAuNH07XG4gIHNjZW5lLmNvbG9ycy5sZWF2ZXMgPSB7aDogc2NlbmUuY29sb3JzLnRyZWVzLmggKyAwLjUsIHM6IDAuNjUsIGw6IDAuNn07XG4gIHNjZW5lLmNvbG9ycy5sZWF2ZXMyID0ge2g6IHNjZW5lLmNvbG9ycy50cmVlcy5oICsgMC40LCBzOiAwLjY1LCBsOiAwLjZ9O1xuICBzY2VuZS5jb2xvcnMucGxhbmV0ID0ge2g6IHNjZW5lLmNvbG9ycy50cmVlcy5oICsgMC41LCBzOiAwLjgsIGw6IDAuNn07XG5cbn0gZWxzZSB7IC8vIHNjZW5lLnRpbWUgPT09IFwiZGVzZXJ0XCJcblxuICB2YXIgYmFzZSA9IHJhbmRvbUNvbG9yKFwibGlnaHRcIik7XG4gIHNjZW5lLmNvbG9ycy5iYXNlID0gYmFzZTtcbiAgc2NlbmUuY29sb3JzLm1vdW50YWlucyA9IHtoOiBiYXNlLmggKyAwLjMgKyByYW5kb20oKSAqIDAuMDUsIHM6IDAuMiArIHJhbmRvbSgpICogMC4yLCBsOiBiYXNlLmwgKyByYW5kb20oKSAqIDAuMSAtIDAuMTV9O1xuICBzY2VuZS5jb2xvcnMuaGlsbHMgPSB7aDogc2NlbmUuY29sb3JzLm1vdW50YWlucy5oICsgcmFuZG9tKCkgKiAwLjIgLSAwLjEsIHM6IDAuNCArIHJhbmRvbSgpICogMC4yLCBsOiBiYXNlLmwgKyByYW5kb20oKSAqIDAuMX07XG4gIHNjZW5lLmNvbG9ycy5yaXZlciA9IHtoOiBiYXNlLmgsIHM6IGJhc2UucyAtIHJhbmRvbSgpICogMC4xIC0gMC4wNSwgbDogYmFzZS5sICsgcmFuZG9tKCkgKiAwLjEgKyAwLjJ9O1xuICBzY2VuZS5jb2xvcnMuc2t5ID0ge2g6IGJhc2UuaCwgczogYmFzZS5zLCBsOiBiYXNlLmwgLSAwLjF9O1xuICBzY2VuZS5jb2xvcnMuc2t5MiA9IHtoOiBiYXNlLmgsIHM6IGJhc2UucywgbDogYmFzZS5sIC0gMC4yIC0gcmFuZG9tKCkgKiAwLjJ9O1xuICBzY2VuZS5jb2xvcnMuY2xvdWRzID0ge2g6IGJhc2UuaCwgczogMC4zLCBsOiAwLjl9O1xuICBzY2VuZS5jb2xvcnMudHJlZXMgPSB7aDogYmFzZS5oLCBzOiAwLjQsIGw6IDAuNH07XG4gIHNjZW5lLmNvbG9ycy5sZWF2ZXMgPSB7aDogc2NlbmUuY29sb3JzLnRyZWVzLmggKyAwLjUsIHM6IDAuNiwgbDogMC42fTtcbiAgc2NlbmUuY29sb3JzLmxlYXZlczIgPSB7aDogc2NlbmUuY29sb3JzLnRyZWVzLmggKyAwLjQsIHM6IDAuNiwgbDogMC42fTtcbiAgc2NlbmUuY29sb3JzLnBsYW5ldCA9IHtoOiBzY2VuZS5jb2xvcnMudHJlZXMuaCArIDAuNSwgczogMC44LCBsOiAwLjZ9O1xufVxuXG4vLyAtLS0tLS0tLS0tIFNjZW5lIGZ1bmN0aW9ucyAtLS0tLS0tLS0tLS1cblxuZnVuY3Rpb24gbWFrZTFETm9pc2UoYXhpcywgYW1wbGl0dWRlLCBzY2FsZSwgcGFyYW1zKSB7IC8vc2NhbGUgbm9ybWFsaXplZCBhdCAwLjAxLCBhbXAgYXQgMTAwXG4gIHZhciBuZXdOb2lzZSA9IFtdO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY2FudmFzLndpZHRoOyBpKyspIHtcbiAgICBuZXdOb2lzZS5wdXNoKHt4OiBpLCB5OiBheGlzICsgYW1wbGl0dWRlICogcGFyYW1zLm5vaXNlRnVuY3Rpb24oc2NhbGUgKiBpLCBwYXJhbXMuemF4aXMpfSk7XG4gIH1cblxuICAvLyBGaW5kIG1pbmltdW1cbiAgaWYgKHBhcmFtcy5rZWVwbWF4KSB7XG4gICAgdmFyIG1heFZhbHVlID0gLTk5OTk5OTk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYW52YXMud2lkdGg7IGkrKykge1xuICAgICAgaWYgKG5ld05vaXNlW2ldLnkgPiBtYXhWYWx1ZSkge1xuICAgICAgICBzY2VuZS5tYXhWYWx1ZSA9IG5ld05vaXNlW2ldO1xuICAgICAgICBtYXhWYWx1ZSA9IG5ld05vaXNlW2ldLnk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChwYXJhbXMuc3RvcmVwb2ludHMpXG4gICAgc2NlbmUucG9pbnRzID0gVXRpbC5jb3B5KG5ld05vaXNlKTtcblxuICBuZXdOb2lzZS5wdXNoKExPV0VSX0xFRlQpO1xuICBuZXdOb2lzZS5wdXNoKExPV0VSX1JJR0hUKTtcbiAgY3R4LmZpbGxTdHlsZSA9IHBhcmFtcy5maWxsQ29sb3I7XG4gIERyYXcuZmlsbFBhdGgoY3R4LCBuZXdOb2lzZSk7XG5cbiAgaWYgKHBhcmFtcy5jbGlwKVxuICAgIGN0eC5jbGlwKCk7XG59XG5cbmZ1bmN0aW9uIG1ha2VTdGFycyhzdGFyY291bnQsIHBhcmFtcykge1xuICBjdHguZmlsbFN0eWxlID0gXCIjRkZGRkZGXCI7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RhcmNvdW50OyBpKyspIHsgLy9tYWtpbmcgMzAwIHN0YXJzXG4gICAgdmFyIHN0YXJ4ID0gcmFuZG9tKCkgKiBjYW52YXMud2lkdGg7XG4gICAgdmFyIHN0YXJ5ID0gcmFuZG9tKCkgKiBjYW52YXMuaGVpZ2h0O1xuXG4gICAgaWYgKHN0YXJ5IDwgMjAwKSB7IC8vbmVhciB0aGUgdG9wXG4gICAgICBpZiAocmFuZG9tKCkgPCBwYXJhbXMubGFyZ2VuZXNzRmFjdG9yKSB7XG4gICAgICAgIC8vbWFrZSBhIGJpZyBzdGFyICgyMCUgY2hhbmNlKVxuICAgICAgICBjdHguYmVnaW5QYXRoKCk7XG5cbiAgICAgICAgLy8gUmFuZG9taXplIHdpZHRoIGJ5IHZhcmlhbmNlJVxuICAgICAgICB2YXIgc3RhcndpZHRoID0gcGFyYW1zLndpZHRoICsgTWF0aC5mbG9vcihyYW5kb20oKSAqIChwYXJhbXMud2lkdGggKiBwYXJhbXMudmFyaWFuY2UpKTtcbiAgICAgICAgY3R4LnJlY3Qoc3RhcnggLSAxLCBzdGFyeSAtIHN0YXJ3aWR0aCwgMiwgMiAqIHN0YXJ3aWR0aCk7XG4gICAgICAgIGN0eC5yZWN0KHN0YXJ4IC0gc3RhcndpZHRoLCBzdGFyeSAtIDEsIDIgKiBzdGFyd2lkdGgsIDIpO1xuXG4gICAgICAgIHZhciBncmQgPSBjdHguY3JlYXRlUmFkaWFsR3JhZGllbnQoc3RhcngsIHN0YXJ5LCAzLCBzdGFyeCwgc3RhcnksIHN0YXJ3aWR0aCArIDUgKyByYW5kb20oKSAqIDUpO1xuICAgICAgICBncmQuYWRkQ29sb3JTdG9wKDAsIFwid2hpdGVcIik7XG4gICAgICAgIGdyZC5hZGRDb2xvclN0b3AoMSwgXCJyZ2JhKDEsIDEsIDEsIDAuMClcIik7XG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSBncmQ7XG5cbiAgICAgICAgY3R4LmZpbGwoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vbWFrZSBhIG5vcm1hbCBzdGFyXG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgY3R4LmFyYyhzdGFyeCwgc3RhcnksIDEsIDAsIDIuMCAqIE1hdGguUEkpO1xuICAgICAgICBjdHguZmlsbCgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvL21ha2UgYSBub3JtYWwgc3RhclxuICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgY3R4LmFyYyhzdGFyeCwgc3RhcnksIDEsIDAsIDIuMCAqIE1hdGguUEkpO1xuICAgICAgY3R4LmZpbGwoKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gbWFrZVJpdmVyKHBhcmFtcykge1xuICBpZiAoIXNjZW5lLmVuYWJsZWQucml2ZXIpXG4gICAgcmV0dXJuO1xuXG4gIHZhciBwb3NpdGlvbiA9IHNjZW5lLm1heFZhbHVlO1xuICBmb3IgKHZhciByID0gNTsgciA+IDA7IHItLSkge1xuICAgIHZhciBjb2xvclN0ciA9IENvbG9yLnRvSHNsU3RyaW5nKHtcbiAgICAgIGg6IHNjZW5lLmNvbG9ycy5yaXZlci5oICsgcmFuZG9tKCkgKiAwLjA1IC0gcGFyYW1zLnZhcmlhbmNlIC8gMixcbiAgICAgIHM6IHNjZW5lLmNvbG9ycy5yaXZlci5zICsgcmFuZG9tKCkgKiAwLjEgLSBwYXJhbXMudmFyaWFuY2UsXG4gICAgICBsOiBzY2VuZS5jb2xvcnMucml2ZXIubCArIHJhbmRvbSgpICogMC4xIC0gcGFyYW1zLnZhcmlhbmNlXG4gICAgfSk7XG4gICAgdmFyIGhhbGZ3aWR0aCA9IHIgKiAxMDtcbiAgICB2YXIgc2xvcGUgPSAxIC0gKDUgLSByKSAqIDAuMjtcblxuICAgIHZhciBwb2ludHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbnZhcy5oZWlnaHQ7IGkrKykgeyAvL2dvIGFsb25nIG9uZSBlZGdlXG4gICAgICBkZWwgPSBNYXRoLmFicyhwb3NpdGlvbi55IC0gaSk7XG4gICAgICBwb2ludHMucHVzaCh7eDogMTAgKiBzaW1wbGV4Lm5vaXNlMkQoMTAwLCBpIC8gMzApICsgcG9zaXRpb24ueCArIGhhbGZ3aWR0aCArIGRlbCAqIHNsb3BlLCB5OiBpfSk7XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSBjYW52YXMuaGVpZ2h0IC0gMTsgaSA+PSAwOyBpLS0pIHsgLy9nbyBhbG9uZyB0aGUgb3RoZXIgZWRnZVxuICAgICAgZGVsID0gTWF0aC5hYnMocG9zaXRpb24ueSAtIGkpO1xuICAgICAgcG9pbnRzLnB1c2goe3g6IDEwICogc2ltcGxleC5ub2lzZTJEKDIwMCwgaSAvIDMwKSArIHBvc2l0aW9uLnggLSBoYWxmd2lkdGggLSBkZWwgKiBzbG9wZSwgeTogaX0pO1xuICAgIH1cblxuICAgIGN0eC5maWxsU3R5bGUgPSBjb2xvclN0cjtcbiAgICBEcmF3LmZpbGxQYXRoKGN0eCwgcG9pbnRzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtYWtlU3VuKHBvc2l0aW9uLCBwYXJhbXMpIHtcbiAgLy8gUmFuZG9taXplIHJhZGl1cyBieSB2YXJpYW5jZSVcbiAgdmFyIG91dGVyUmFkaXVzID0gcGFyYW1zLm91dGVyUmFkaXVzICsgTWF0aC5mbG9vcihyYW5kb20oKSAqIChwYXJhbXMub3V0ZXJSYWRpdXMgKiBwYXJhbXMudmFyaWFuY2UpKTtcbiAgdmFyIGlubmVyUmFkaXVzID0gcGFyYW1zLmlubmVyUmFkaXVzICsgTWF0aC5mbG9vcihyYW5kb20oKSAqIChwYXJhbXMuaW5uZXJSYWRpdXMgKiBwYXJhbXMudmFyaWFuY2UpKTtcbiAgdmFyIHJhZGl1c1JhbmdlID0gb3V0ZXJSYWRpdXMgLSBpbm5lclJhZGl1cztcblxuICBjdHguYmVnaW5QYXRoKCk7XG4gIGN0eC5hcmMocG9zaXRpb24ueCwgcG9zaXRpb24ueSwgaW5uZXJSYWRpdXMsIDAsIDIgKiBNYXRoLlBJKTtcbiAgY3R4Lmdsb2JhbEFscGhhID0gMC45NTtcbiAgY3R4LmZpbGxTdHlsZSA9IENvbG9yLnRvSHNsU3RyaW5nKHtoOiBzY2VuZS5jb2xvcnMuYmFzZS5oLCBzOiAwLjMsIGw6IDAuOH0pO1xuICBjdHguZmlsbCgpO1xuXG4gIGN0eC5hcmMocG9zaXRpb24ueCwgcG9zaXRpb24ueSwgaW5uZXJSYWRpdXMgKyByYWRpdXNSYW5nZSAvIDMgKiAyLCAwLCAyICogTWF0aC5QSSk7XG4gIGN0eC5nbG9iYWxBbHBoYSA9IDAuNzU7XG4gIGN0eC5maWxsU3R5bGUgPSBDb2xvci50b0hzbFN0cmluZyh7aDogc2NlbmUuY29sb3JzLmJhc2UuaCwgczogMC4zLCBsOiAwLjg1fSk7XG4gIGN0eC5maWxsKCk7XG5cbiAgY3R4LmFyYyhwb3NpdGlvbi54LCBwb3NpdGlvbi55LCBvdXRlclJhZGl1cywgMCwgMiAqIE1hdGguUEkpO1xuICBjdHguZ2xvYmFsQWxwaGEgPSAwLjU7XG4gIGN0eC5maWxsU3R5bGUgPSBDb2xvci50b0hzbFN0cmluZyh7aDogc2NlbmUuY29sb3JzLmJhc2UuaCwgczogMC4zLCBsOiAwLjl9KTtcbiAgY3R4LmZpbGwoKTtcblxuICBjdHguYXJjKHBvc2l0aW9uLngsIHBvc2l0aW9uLnksIG91dGVyUmFkaXVzICsgcmFkaXVzUmFuZ2UgKiAyIC8gMywgMCwgMiAqIE1hdGguUEkpO1xuICBjdHguZ2xvYmFsQWxwaGEgPSAwLjI1O1xuICBjdHguZmlsbFN0eWxlID0gQ29sb3IudG9Ic2xTdHJpbmcoe2g6IHNjZW5lLmNvbG9ycy5iYXNlLmgsIHM6IDAuMywgbDogMC45NX0pO1xuICBjdHguZmlsbCgpO1xuXG4gIGN0eC5nbG9iYWxBbHBoYSA9IDEuMDtcbn1cblxuZnVuY3Rpb24gbWFrZVBsYW5ldChwb3NpdGlvbiwgcGFyYW1zKSB7XG4gIC8vIFJhbmRvbWl6ZSByYWRpdXMgYnkgdmFyaWFuY2UlXG4gIHZhciByYWRpdXMgPSBwYXJhbXMucmFkaXVzICsgTWF0aC5mbG9vcihyYW5kb20oKSAqIChwYXJhbXMucmFkaXVzICogcGFyYW1zLnZhcmlhbmNlKSk7XG4gIGN0eC5iZWdpblBhdGgoKTtcbiAgY3R4LmFyYyhwb3NpdGlvbi54LCBwb3NpdGlvbi55LCByYWRpdXMsIDAsIDIgKiBNYXRoLlBJKTtcbiAgY3R4LmZpbGxTdHlsZSA9IENvbG9yLnRvSHNsU3RyaW5nKHNjZW5lLmNvbG9ycy5wbGFuZXQpO1xuICBjdHguZmlsbCgpO1xuICBjdHguc2F2ZSgpO1xuICBjdHguY2xpcCgpO1xuXG4gIHZhciB4cG9zbWF4ID0gTWF0aC5mbG9vcihwb3NpdGlvbi54ICsgcmFkaXVzKTtcbiAgdmFyIHlwb3NtYXggPSBNYXRoLmZsb29yKHBvc2l0aW9uLnkgKyByYWRpdXMpO1xuICBmb3IgKHZhciB4cG9zID0gcG9zaXRpb24ueCAtIHJhZGl1czsgeHBvcyA8IHhwb3NtYXg7IHhwb3MrKykge1xuICAgIGZvciAodmFyIHlwb3MgPSBwb3NpdGlvbi55IC0gcmFkaXVzOyB5cG9zIDwgeXBvc21heDsgeXBvcysrKSB7XG4gICAgICAvL3RoaXMgYWRkcyBzb21lIGdyYWluaW5lc3NcbiAgICAgIGlmIChzaW1wbGV4Lm5vaXNlMkQoeHBvcyAqIDAuNSwgeXBvcyAqIDAuNSkgPiAwLjEgKyByYW5kb20oKSAqIDAuMikge1xuICAgICAgICBEcmF3LmRyYXdQaXhlbChjdHgsIHt4OiB4cG9zLCB5OiB5cG9zfSwgJ3JnYmEoMCwgMCwgMCwgMC4wMSknKTtcbiAgICAgIH1cbiAgICAgIGlmIChzaW1wbGV4Lm5vaXNlMkQoeHBvcyAqIDAuMDMsIHlwb3MgKiAwLjAzKSA+IDAuMSArIHJhbmRvbSgpICogMC4yKSB7XG4gICAgICAgIERyYXcuZHJhd1BpeGVsKGN0eCwge3g6IHhwb3MsIHk6IHlwb3N9LCAncmdiYSgwLCAwLCAwLCAwLjAzKScpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBjdHguZ2xvYmFsQ29tcG9zaXRlT3BlcmF0aW9uID0gJ292ZXJsYXknO1xuICBjdHguZmlsbFN0eWxlID0gXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSlcIjtcbiAgY3R4LmJlZ2luUGF0aCgpO1xuICBjdHguZWxsaXBzZShwb3NpdGlvbi54ICsgNjAsIHBvc2l0aW9uLnkgLSA2MCwgNjAsIDQwLCA0NSAqIE1hdGguUEkgLyAxODAsIDAsIDIgKiBNYXRoLlBJKTtcbiAgY3R4LmZpbGwoKTtcbiAgY3R4LmJlZ2luUGF0aCgpO1xuICBjdHguZWxsaXBzZShwb3NpdGlvbi54ICsgNDAsIHBvc2l0aW9uLnkgLSA0MCwgODAsIDYwLCA0NSAqIE1hdGguUEkgLyAxODAsIDAsIDIgKiBNYXRoLlBJKTtcbiAgY3R4LmZpbGwoKTtcbiAgY3R4LmJlZ2luUGF0aCgpO1xuICBjdHguZWxsaXBzZShwb3NpdGlvbi54ICsgMjAsIHBvc2l0aW9uLnkgLSAyMCwgMTAwLCA4MCwgNDUgKiBNYXRoLlBJIC8gMTgwLCAwLCAyICogTWF0aC5QSSk7XG4gIGN0eC5maWxsKCk7XG4gIGN0eC5nbG9iYWxDb21wb3NpdGVPcGVyYXRpb24gPSAnc291cmNlLW92ZXInO1xuICBjdHgucmVzdG9yZSgpO1xufVxuXG5mdW5jdGlvbiBtYWtlQ2xvdWRzKHBhcmFtcykge1xuICBpZiAoIXNjZW5lLmVuYWJsZWQuY2xvdWRzKVxuICAgIHJldHVybjtcblxuICB2YXIgY29sb3JTdHIgPSBDb2xvci50b0hzbFN0cmluZyhzY2VuZS5jb2xvcnMuY2xvdWRzKTtcbiAgY3R4Lmdsb2JhbEFscGhhID0gMC40O1xuICBjdHguYmVnaW5QYXRoKCk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY2FudmFzLndpZHRoOyBpKyspIHtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGNhbnZhcy5oZWlnaHQ7IGorKykge1xuICAgICAgdmFyIG5vaXNlVmFsdWUgPSBzaW1wbGV4Lm5vaXNlMkQoaSAqIDAuMDAyICsgcGFyYW1zLm9mZnNldCwgaiAqIDAuMDEgKyBwYXJhbXMub2Zmc2V0KTtcbiAgICAgIGlmIChub2lzZVZhbHVlID4gcGFyYW1zLnRocmVzaG9sZCArIHJhbmRvbSgpICogcGFyYW1zLnZhcmlhbmNlKSB7XG4gICAgICAgIERyYXcuZHJhd1BpeGVsKGN0eCwge3g6IGksIHk6IGp9LCBjb2xvclN0cik7XG4gICAgICAgIGlmIChyYW5kb20oKSA+IHBhcmFtcy5mbHVmZnlGYWN0b3IpIHtcbiAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICAgICAgY3R4LmFyYyhpLCBqLCA1LCAwLCAyICogTWF0aC5QSSk7XG4gICAgICAgICAgY3R4LmZpbGwoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgfVxuICB9XG4gIGN0eC5nbG9iYWxBbHBoYSA9IDEuMDtcbn1cblxuZnVuY3Rpb24gbWFrZVN1blBsYW5ldHMocGFyYW1zKSB7XG4gIGlmICghc2NlbmUuZW5hYmxlZC5zdGFycylcbiAgICByZXR1cm47XG5cbiAgaWYgKHNjZW5lLnRpbWUgPT09IFwibmlnaHRcIikge1xuICAgIG1ha2VTdGFycygzMDAsIHt3aWR0aDogMywgdmFyaWFuY2U6IDIuMiwgbGFyZ2VuZXNzRmFjdG9yOiAwLjJ9KTtcblxuICAgIGlmIChzY2VuZS5lbmFibGVkLnBsYW5ldCkge1xuICAgICAgbWFrZVBsYW5ldCh7eDogMTAwICsgcmFuZG9tKCkgKiAoY2FudmFzLndpZHRoIC0gMjAwKSwgeTogMTMwfSwge3JhZGl1czogcGFyYW1zLnBsYW5ldFJhZGl1cywgdmFyaWFuY2U6IDAuMX0pO1xuICAgICAgbWFrZVBsYW5ldCh7eDogODAgKyByYW5kb20oKSAqIChjYW52YXMud2lkdGggLSAzMDApLCB5OiA1MCArIHJhbmRvbSgpICogKGNhbnZhcy5oZWlnaHQgLSAzMDApfSwge3JhZGl1czogcGFyYW1zLnBsYW5ldFJhZGl1cyAvIDMsIHZhcmlhbmNlOiAwLjE1fSk7XG4gICAgfVxuXG4gIH0gZWxzZSB7XG4gICAgbWFrZVN1bih7eDogMTAwICsgcmFuZG9tKCkgKiAoY2FudmFzLndpZHRoIC0gMjAwKSwgeTogMTAwfSwge2lubmVyUmFkaXVzOiBwYXJhbXMuc3VuUmFkaXVzIC8gMyAqIDIsIG91dGVyUmFkaXVzOiBwYXJhbXMuc3VuUmFkaXVzICsgMTUsIHZhcmlhbmNlOiAwLjE1fSk7XG5cbiAgICBpZiAocmFuZG9tKCkgPiAwLjUpIHtcbiAgICAgIG1ha2VQbGFuZXQoe3g6IDgwICsgcmFuZG9tKCkgKiAoY2FudmFzLndpZHRoIC0gMzAwKSwgeTogNTAgKyByYW5kb20oKSAqIChjYW52YXMuaGVpZ2h0IC0gMzAwKX0sIHtyYWRpdXM6IHBhcmFtcy5wbGFuZXRSYWRpdXMgLyA0LCB2YXJpYW5jZTogMC4xNX0pO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBtYWtlU2t5KCkge1xuICBpZiAoIXNjZW5lLmVuYWJsZWQuc2t5KVxuICAgIHJldHVybjtcblxuICBjdHguYmVnaW5QYXRoKCk7XG4gIGN0eC5yZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG5cbiAgdmFyIGdyZCA9IGN0eC5jcmVhdGVMaW5lYXJHcmFkaWVudCgwLCBjYW52YXMuaGVpZ2h0LCAwLCAwKTtcbiAgZ3JkLmFkZENvbG9yU3RvcCgwLCBDb2xvci50b0hzbFN0cmluZyhzY2VuZS5jb2xvcnMuc2t5KSk7XG4gIGdyZC5hZGRDb2xvclN0b3AoMSwgQ29sb3IudG9Ic2xTdHJpbmcoc2NlbmUuY29sb3JzLnNreTIpKTtcbiAgY3R4LmZpbGxTdHlsZSA9IGdyZDtcbiAgY3R4LmZpbGwoKTtcblxuICAvLyBkbyBzb21lIHRyaWFuZ3VsYXRpb25cbiAgdmFyIHRyaWFuZ2xlUG9pbnRzID0gW107XG4gIHRyaWFuZ2xlUG9pbnRzLnB1c2goWzAsIGNhbnZhcy5oZWlnaHRdLCBbMCwgMF0sIFtjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHRdLCBbY2FudmFzLndpZHRoLCAwXSk7IC8vYWRkIGNvcm5lcnNcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCAxNTsgaSsrKSB7IC8vYWRkIHNvbWUgc3R1ZmYgb24gdG9wIGFuZCBib3R0b21cbiAgICB0cmlhbmdsZVBvaW50cy5wdXNoKFtyYW5kb20oKSAqIGNhbnZhcy53aWR0aCwgMF0pO1xuICAgIHRyaWFuZ2xlUG9pbnRzLnB1c2goW3JhbmRvbSgpICogY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0XSk7XG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCAyNTsgaSsrKSB7IC8vYWRkIHNvbWUgc3R1ZmYgb24gdGhlIHNpZGVzXG4gICAgdHJpYW5nbGVQb2ludHMucHVzaChbMCwgcmFuZG9tKCkgKiBjYW52YXMuaGVpZ2h0XSk7XG4gICAgdHJpYW5nbGVQb2ludHMucHVzaChbY2FudmFzLndpZHRoLCByYW5kb20oKSAqIGNhbnZhcy5oZWlnaHRdKTtcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IDc1OyBpKyspIHsgLy9hZGQgc29tZSBzdHVmZiBpbiB0aGUgbWlkZGxlXG4gICAgdHJpYW5nbGVQb2ludHMucHVzaChbcmFuZG9tKCkgKiBjYW52YXMud2lkdGgsIHJhbmRvbSgpICogY2FudmFzLmhlaWdodF0pO1xuICAgIHRyaWFuZ2xlUG9pbnRzLnB1c2goW3JhbmRvbSgpICogY2FudmFzLndpZHRoLCByYW5kb20oKSAqIGNhbnZhcy5oZWlnaHRdKTtcbiAgfVxuXG4gIHZhciB0cmlhbmdsZXMgPSBEZWxhdW5heS50cmlhbmd1bGF0ZSh0cmlhbmdsZVBvaW50cyk7IC8vZG8gdGhlIGFjdHVhbCB0cmlhbmd1bGF0aW9uXG5cbiAgdmFyIG5ld3RyaWFuZ2xlID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdHJpYW5nbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgbmV3dHJpYW5nbGUucHVzaChVdGlsLnRvVHVwbGUodHJpYW5nbGVQb2ludHNbdHJpYW5nbGVzW2ldXSkpO1xuICAgIGlmIChuZXd0cmlhbmdsZS5sZW5ndGggPT09IDMpIHtcbiAgICAgIGlmIChzY2VuZS50aW1lID09PSAnZGF5JyB8fCBzY2VuZS50aW1lID09PSAnZGVzZXJ0Jykge1xuICAgICAgICBjdHguZmlsbFN0eWxlID0gQ29sb3IudG9Ic2xTdHJpbmcoe2g6IHNjZW5lLmNvbG9ycy5iYXNlLmgsIHM6IHNjZW5lLmNvbG9ycy5iYXNlLnMgKyByYW5kb20oKSAqIDAuMiAtIDAuMSwgbDogc2NlbmUuY29sb3JzLmJhc2UubCArIHJhbmRvbSgpICogMC4yIC0gMC4xfSk7XG4gICAgICAgIHZhciBjZW50ZXIgPSB7eDogMCwgeTogMH07XG4gICAgICAgIGNlbnRlci54ID0gKG5ld3RyaWFuZ2xlWzBdLnggKyBuZXd0cmlhbmdsZVsxXS54ICsgbmV3dHJpYW5nbGVbMl0ueCkgLyAzO1xuICAgICAgICBjZW50ZXIueSA9IChuZXd0cmlhbmdsZVswXS55ICsgbmV3dHJpYW5nbGVbMV0ueSArIG5ld3RyaWFuZ2xlWzJdLnkpIC8gMztcbiAgICAgICAgdmFyIGNlbnRlcmNvbG9yID0gY3R4LmdldEltYWdlRGF0YShjZW50ZXIueCwgY2VudGVyLnksIDEsIDEpLmRhdGE7XG5cbiAgICAgICAgdmFyIGZpbGxjb2xvciA9IFwicmdiKFwiICsgY2VudGVyY29sb3JbMF0gKyBcIiwgXCIgKyBjZW50ZXJjb2xvclsxXSArIFwiLCBcIiArIGNlbnRlcmNvbG9yWzJdICsgXCIpXCI7XG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSBmaWxsY29sb3I7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjdHguZmlsbFN0eWxlID0gQ29sb3IudG9Ic2xTdHJpbmcoe2g6IHNjZW5lLmNvbG9ycy5iYXNlLmgsIHM6IHNjZW5lLmNvbG9ycy5iYXNlLnMgKyByYW5kb20oKSAqIDAuMDEgLSAwLjAwNSwgbDogc2NlbmUuY29sb3JzLmJhc2UubCArIHJhbmRvbSgpICogMC4wMSAtIDAuMDA1fSk7XG4gICAgICB9XG4gICAgICBEcmF3LmZpbGxQYXRoKGN0eCwgbmV3dHJpYW5nbGUpO1xuXG4gICAgICBuZXd0cmlhbmdsZSA9IFtdO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBtYWtlTW91bnRhaW5zKCkge1xuICBpZiAoIXNjZW5lLmVuYWJsZWQubW91bnRhaW5zKVxuICAgIHJldHVybjtcblxuICB2YXIgc3N0ZXAgPSAwLjAzLCBsc3RlcCA9IDAuMDI7XG4gIHZhciB0YWxsUmFuZ2UgPSAxNTAsIGxvd2VyUmFuZ2UgPSAxMDA7XG4gIG1ha2UxRE5vaXNlKDQzMCwgdGFsbFJhbmdlLCAwLjAwNSwge25vaXNlRnVuY3Rpb246IHNjZW5lLm1vdW50YWluTm9pc2UsIGZpbGxDb2xvcjogQ29sb3IudG9Ic2xTdHJpbmcoc2NlbmUuY29sb3JzLm1vdW50YWlucyksIHpheGlzOiAwfSk7XG4gIG1vdW50YWluU2hhZGUgPSB7aDogc2NlbmUuY29sb3JzLm1vdW50YWlucy5oLCBzOiBzY2VuZS5jb2xvcnMubW91bnRhaW5zLnMgLSBzc3RlcCwgbDogc2NlbmUuY29sb3JzLm1vdW50YWlucy5sIC0gbHN0ZXB9O1xuICBmb3IgKHZhciBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgIG1ha2UxRE5vaXNlKDQzMCwgdGFsbFJhbmdlICsgaSAqIDM1LCAwLjAwNSwge25vaXNlRnVuY3Rpb246IHNjZW5lLm1vdW50YWluTm9pc2UsIGZpbGxDb2xvcjogQ29sb3IudG9Ic2xTdHJpbmcobW91bnRhaW5TaGFkZSksIHpheGlzOiAwLjA1ICogaX0pO1xuICAgIG1vdW50YWluU2hhZGUucyArPSBzc3RlcCArIHJhbmRvbSgpICogbHN0ZXA7XG4gICAgbW91bnRhaW5TaGFkZS5sIC09IGxzdGVwIC0gcmFuZG9tKCkgKiBzc3RlcDtcbiAgfVxuXG4gIG1ha2UxRE5vaXNlKDQzMCwgbG93ZXJSYW5nZSwgMC4wMDQ1LCB7bm9pc2VGdW5jdGlvbjogc2NlbmUubW91bnRhaW5Ob2lzZSwgZmlsbENvbG9yOiBDb2xvci50b0hzbFN0cmluZyhzY2VuZS5jb2xvcnMubW91bnRhaW5zKSwgemF4aXM6IDB9KTtcbiAgbW91bnRhaW5TaGFkZSA9IHtoOiBzY2VuZS5jb2xvcnMubW91bnRhaW5zLmgsIHM6IHNjZW5lLmNvbG9ycy5tb3VudGFpbnMucyAtIHNzdGVwLCBsOiBzY2VuZS5jb2xvcnMubW91bnRhaW5zLmwgLSBsc3RlcH07XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgMzsgaSsrKSB7XG4gICAgbWFrZTFETm9pc2UoNDMwLCBsb3dlclJhbmdlIC0gaSAqIDI1LCAwLjAwNDUsIHtub2lzZUZ1bmN0aW9uOiBzY2VuZS5tb3VudGFpbk5vaXNlLCBmaWxsQ29sb3I6IENvbG9yLnRvSHNsU3RyaW5nKG1vdW50YWluU2hhZGUpLCB6YXhpczogMC4wNCAqIGl9KTtcbiAgICBtb3VudGFpblNoYWRlLnMgLT0gc3N0ZXAgLSByYW5kb20oKSAqIGxzdGVwO1xuICAgIG1vdW50YWluU2hhZGUubCArPSBsc3RlcCArIHJhbmRvbSgpICogc3N0ZXA7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWFrZUhpbGxzKCkge1xuICBpZiAoIXNjZW5lLmVuYWJsZWQuaGlsbHMpXG4gICAgcmV0dXJuO1xuXG4gIGN0eC5zYXZlKCk7XG4gIG1ha2UxRE5vaXNlKDUwMCwgNTAsIDAuMDAyLCB7bm9pc2VGdW5jdGlvbjogc2NlbmUuaGlsbE5vaXNlLCBmaWxsQ29sb3I6IENvbG9yLnRvSHNsU3RyaW5nKHNjZW5lLmNvbG9ycy5oaWxscyksIHpheGlzOiAwLCBrZWVwbWF4OiB0cnVlLCBjbGlwOiB0cnVlLCBzdG9yZXBvaW50czogdHJ1ZX0pO1xuICBmb3IgKHZhciBpID0gMTsgaSA8IDU7IGkrKykge1xuICAgIG1ha2UxRE5vaXNlKDUwMCArIGkgKiAyMCwgNTAgLSBpICogMiwgMC4wMDIsIHtub2lzZUZ1bmN0aW9uOiBzY2VuZS5oaWxsTm9pc2UsIGZpbGxDb2xvcjogQ29sb3IudG9Ic2xTdHJpbmcoe2g6IHNjZW5lLmNvbG9ycy5oaWxscy5oLCBzOiBzY2VuZS5jb2xvcnMuaGlsbHMucywgbDogc2NlbmUuY29sb3JzLmhpbGxzLmwgKyBpICogMC4wNX0pLCB6YXhpczogMC4wMiArIGkgKiAwLjAyfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWFrZUJpZ1RyZWUobmV3c2VlZCkge1xuICBjdHgyLnNldFRyYW5zZm9ybSgxLCAwLCAwLCAxLCAwLCAwKTtcbiAgY3R4Mi50cmFuc2xhdGUoMjAwLCAyMDApO1xuICBjdHgyLnNjYWxlKDEsIC0xKTtcbiAgY3R4Mi5jbGVhclJlY3QoLTIwMCwgLTIwMCwgNDAwLCA0MDApO1xuICBjdHgyLnN0cm9rZVN0eWxlID0gXCJibGFja1wiO1xuICBjdHgyLmxpbmVXaWR0aCA9IDM7XG4gIC8vc2NlbmUuc2VlZCA9IG5ld3NlZWQ7XG4gIGJyYW5jaCg1MCk7XG59XG5cbmZ1bmN0aW9uIGJyYW5jaChsZW4pIHtcbiAgdmFyIHRoZXRhID0gcmFuZG9tKCkgKiAoTWF0aC5QSSAvIDMpO1xuXG4gIERyYXcuZHJhd0xpbmUoe3g6IDAsIHk6IDB9LCB7eDogMCwgeTogbGVufSwgY3R4Mik7XG4gIGN0eDIudHJhbnNsYXRlKDAsIGxlbik7XG5cbiAgbGVuICo9IDAuNjY7XG4gIGlmIChsZW4gPiAyKSB7XG4gICAgY3R4Mi5zYXZlKCk7XG4gICAgY3R4Mi5yb3RhdGUodGhldGEpO1xuICAgIGJyYW5jaChsZW4pO1xuICAgIGN0eDIucmVzdG9yZSgpO1xuXG4gICAgY3R4Mi5zYXZlKCk7XG4gICAgY3R4Mi5yb3RhdGUoLXRoZXRhKTtcbiAgICBicmFuY2gobGVuKTtcbiAgICBjdHgyLnJlc3RvcmUoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtYWtlVHJlZXMoKSB7XG4gIGlmICghc2NlbmUuZW5hYmxlZC50cmVlcylcbiAgICByZXR1cm47XG5cbiAgY3R4LnJlc3RvcmUoKTtcblxuICB2YXIgdHJlZUNvbG9yU3RyID0gQ29sb3IudG9Ic2xTdHJpbmcoc2NlbmUuY29sb3JzLnRyZWVzKTtcblxuICB2YXIgbWF4TnVtVHJlZXMgPSAyMCArIE1hdGguZmxvb3IocmFuZG9tKCkgKiAyMCk7XG4gIHZhciBjb2xvclN0ZXBJbmMgPSAwLjIgLyBtYXhOdW1UcmVlcztcbiAgdmFyIGNvbG9yU3RlcCA9IDAuMDE7XG5cbiAgdmFyIGxlYXZlU2hhZGUgPSB7aDogc2NlbmUuY29sb3JzLmxlYXZlcy5oLCBzOiBzY2VuZS5jb2xvcnMubGVhdmVzLnMsIGw6IHNjZW5lLmNvbG9ycy5sZWF2ZXMubH07XG4gIHZhciB0cmVlQ291bnQgPSAwO1xuICB3aGlsZSAodHJlZUNvdW50IDwgbWF4TnVtVHJlZXMpIHtcbiAgICB2YXIgdHJlZXggPSByYW5kb20oKSAqIGNhbnZhcy53aWR0aDtcbiAgICB2YXIgdHJlZXkgPSByYW5kb20oKSAqIGNhbnZhcy5oZWlnaHQ7XG5cbiAgICAvLyBtYWtlIHRyZWVzIHJvb3RlZCBmcm9tIGJlbG93IGhpbGxzLCBhYm92ZSBib3R0b20sIGFuZCBub3Qgdy9pbiAxNTAgcGl4ZWxzIG9mIHJpdmVyXG4gICAgLy8gdGhpcyBjYW5ub3QgcG9zc2libHkgYmUgZWZmaWNpZW50IGJ1dCBpZGsgaG93IGVsc2UgdG8gZG8gaXQuIG1heWJlIGNhY2hlIGVhY2ggc2hhcGUgYXMgYW4gb2JqZWN0IHNvIHBvaW50cyBjYW4gYmUgcGlja2VkIGZyb20gd2l0aGluIHRoZSByZWdpb24/XG4gICAgaWYgKCh0cmVleCA8IHNjZW5lLm1heFZhbHVlLnggLSAxNTAgfHwgdHJlZXggPiBzY2VuZS5tYXhWYWx1ZS54ICsgMTUwKSAmJiB0cmVleSA+IHNjZW5lLnBvaW50c1tNYXRoLmZsb29yKHRyZWV4KV0ueSkge1xuXG4gICAgICB2YXIgdHJlZVdpZHRoID0gTWF0aC5mbG9vcigzICsgMi41ICogcmFuZG9tKCkpO1xuICAgICAgdmFyIHRyZWVIZWlnaHQgPSAoNiArIDMuMSAqIHJhbmRvbSgpKSAqIHRyZWVXaWR0aDtcblxuICAgICAgLy8gRHJhdyBhIHRyZWUgYXQgdHJlZXgsIHRyZWV5XG4gICAgICBjdHguZmlsbFN0eWxlID0gdHJlZUNvbG9yU3RyO1xuICAgICAgY3R4LmZpbGxSZWN0KHRyZWV4LCB0cmVleSwgLXRyZWVXaWR0aCwgLXRyZWVIZWlnaHQpO1xuXG4gICAgICAvLyBEcmF3IGEgYmxvYiBmb3IgbGVhdmVzXG4gICAgICBjdHguZmlsbFN0eWxlID0gQ29sb3IudG9Ic2xTdHJpbmcobGVhdmVTaGFkZSk7XG5cbiAgICAgIHZhciBsZWFmQ2VudGVyID0ge3g6IHRyZWV4IC0gdHJlZVdpZHRoIC8gMiwgeTogdHJlZXkgLSB0cmVlSGVpZ2h0fTtcbiAgICAgIHZhciBibG9icG9pbnRzID0gW107XG4gICAgICB2YXIgcG9pbnRjb3VudCA9IDMwLCByYWRpdXMgPSA4ICsgTWF0aC5mbG9vcihyYW5kb20oKSAqIDEwKTtcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcG9pbnRjb3VudDsgaisrKSB7IC8vIE1hcCBwb2ludHMgb250byBhIGNpcmNsZVxuICAgICAgICB2YXIgcHJlcG9zID0ge1xuICAgICAgICAgIHg6IGxlYWZDZW50ZXIueCArIHJhZGl1cyAqIE1hdGguY29zKGogKiAoMiAqIE1hdGguUEkpIC8gcG9pbnRjb3VudCksXG4gICAgICAgICAgeTogbGVhZkNlbnRlci55ICsgcmFkaXVzICogTWF0aC5zaW4oaiAqICgyICogTWF0aC5QSSkgLyBwb2ludGNvdW50KVxuICAgICAgICB9O1xuICAgICAgICB2YXIgbmV3UmFkaXVzID0gcmFkaXVzICsgNSAqIHNpbXBsZXgubm9pc2UyRChwcmVwb3MueCwgcHJlcG9zLnkpO1xuICAgICAgICB2YXIgbmV3cG9zID0ge1xuICAgICAgICAgIHg6IGxlYWZDZW50ZXIueCArIG5ld1JhZGl1cyAqIE1hdGguY29zKGogKiAoMiAqIE1hdGguUEkpIC8gcG9pbnRjb3VudCksXG4gICAgICAgICAgeTogbGVhZkNlbnRlci55ICsgbmV3UmFkaXVzICogTWF0aC5zaW4oaiAqICgyICogTWF0aC5QSSkgLyBwb2ludGNvdW50KVxuICAgICAgICB9O1xuICAgICAgICBibG9icG9pbnRzLnB1c2gobmV3cG9zKTtcbiAgICAgIH1cbiAgICAgIERyYXcuZmlsbFBhdGgoY3R4LCBibG9icG9pbnRzKTtcblxuICAgICAgLy8gU3RvcmUgdGhlIHBvc2l0aW9uIHNvIGl0IGNhbiBiZSBjbGlja2VkIG9uXG4gICAgICBzY2VuZS5jbGlja0JveGVzLnB1c2goe1xuICAgICAgICBsZWZ0OiB0cmVleCAtIHJhZGl1cyxcbiAgICAgICAgcmlnaHQ6IHRyZWV4ICsgcmFkaXVzLFxuICAgICAgICB0b3A6IHRyZWV5IC0gdHJlZUhlaWdodCAtIHJhZGl1cyxcbiAgICAgICAgYm90dG9tOiB0cmVleSxcbiAgICAgICAgYWN0aW9uOiBtYWtlQmlnVHJlZVxuICAgICAgfSk7XG5cbiAgICAgIGxlYXZlU2hhZGUucyArPSBjb2xvclN0ZXA7XG4gICAgICAvLyBsZWF2ZVNoYWRlLmwgLT0gY29sb3JTdGVwIC8gMjtcbiAgICAgIGNvbG9yU3RlcCArPSBjb2xvclN0ZXBJbmM7XG4gICAgICB0cmVlQ291bnQrKztcbiAgICB9XG4gIH0gLy8gd2hpbGUgKHRyZWVDb3VudCA8IG1heE51bVRyZWVzKVxufVxuXG4vLyAtLS0tLS0tLS0gTGV0J3MgY29tbWVuY2Ugc2NlbmUgZ2VuZXJhdGlvbiAtLS0tLS0tLS0tXG5cbi8vIEJ5IGRvaW5nIHRoaXMgaW4gdGhlIG9yZGVyIG9mIHNreSwgbW91bnRhaW5zLCBoaWxscywgcml2ZXIgYW5kIHRyZWVzLCB3ZSBjYW4gZXNzZW50aWFsbHkgYXBwbHkgYSBQYWludGVycyBBbGdvcml0aG0sXG4vLyBoZW5jZSBlYXJsaWVyIHBhcnRzIG9mIHRoZSBwYWludGluZyBhcmUgbGF5ZXJlZCBvdmVyIGFuZCBoaWRkZW4gYnkgbW9yZSByZWNlbnQgaXRlbS5cblxubWFrZVNreSgpO1xubWFrZUNsb3Vkcyh7dGhyZXNob2xkOiAwLjY1LCB2YXJpYW5jZTogMC4wNCwgb2Zmc2V0OiAxMDAsIGZsdWZmeUZhY3RvcjogMC4xfSk7XG5tYWtlU3VuUGxhbmV0cyh7cGxhbmV0UmFkaXVzOiAxMDAsIHN1blJhZGl1czogNTB9KTtcbm1ha2VDbG91ZHMoe3RocmVzaG9sZDogMC41NSwgdmFyaWFuY2U6IDAuMDMsIG9mZnNldDogMTUwLCBmbHVmZnlGYWN0b3I6IDAuMn0pO1xubWFrZU1vdW50YWlucygpO1xubWFrZUhpbGxzKCk7XG5tYWtlUml2ZXIoe3ZhcmlhbmNlOiAwLjA2fSk7XG5tYWtlVHJlZXMoKTtcblxuLy8gZnVuY3Rpb24gZ2V0TW91c2VQb3MoY2FudmFzLCBldnQpIHtcbi8vICAgdmFyIHJlY3QgPSBjYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4vLyAgIHJldHVybiB7eDogZXZ0LmNsaWVudFggLSByZWN0LmxlZnQsIHk6IGV2dC5jbGllbnRZIC0gcmVjdC50b3B9O1xuLy8gfVxuLy9cbi8vIGZ1bmN0aW9uIGRvTW91c2VNb3ZlKGV2dCkge1xuLy8gICB2YXIgbW91c2VQb3MgPSBnZXRNb3VzZVBvcyhjYW52YXMsIGV2dCk7XG4vLyAgIHZhciBzaG93Qm94ID0gZmFsc2U7XG4vLyAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2NlbmUuY2xpY2tCb3hlcy5sZW5ndGg7IGkrKykge1xuLy8gICAgIGlmIChtb3VzZVBvcy54ID4gc2NlbmUuY2xpY2tCb3hlc1tpXS5sZWZ0ICYmIG1vdXNlUG9zLnggPCBzY2VuZS5jbGlja0JveGVzW2ldLnJpZ2h0ICYmXG4vLyAgICAgICBtb3VzZVBvcy55ID4gc2NlbmUuY2xpY2tCb3hlc1tpXS50b3AgJiYgbW91c2VQb3MueSA8IHNjZW5lLmNsaWNrQm94ZXNbaV0uYm90dG9tKSB7XG4vLyAgICAgICBzY2VuZS5jbGlja0JveGVzW2ldLmFjdGlvbihpKTtcbi8vICAgICAgIHNob3dCb3ggPSB0cnVlO1xuLy8gICAgIH1cbi8vICAgfVxuLy9cbi8vICAgaWYgKHNob3dCb3gpIHtcbi8vICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjY2FudmFzMicpLmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpO1xuLy8gICB9IGVsc2Uge1xuLy8gICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNjYW52YXMyJykuY2xhc3NMaXN0LmFkZCgnaGlkZGVuJyk7XG4vLyAgIH1cbi8vIH1cbi8vXG4vLyBjYW52YXMuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgZG9Nb3VzZU1vdmUsIGZhbHNlKTtcbiIsIi8qIVxuICogUHJvY2VkdXJhbCBBcnQgLSBQcm9jZWR1cmFsbHkgZ2VuZXJhdGVkIGFydCAocHJvY2VkdXJhbC1hcnQgdjEuMC4wIC0gaHR0cHM6Ly9naXRodWIuY29tL2JodWRpYXh5ei9wcm9jZWR1cmFsLWFydClcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciBNSVQgKGh0dHBzOi8vZ2l0aHViLmNvbS9iaHVkaWF4eXovcHJvY2VkdXJhbC1hcnQvYmxvYi9tYXN0ZXIvTElDRU5TRSlcbiAqXG4gKiBCYXNlZCBvbiB3b3JrcyBvZjogaHR0cHM6Ly9naXRodWIuY29tL2FsYW4tbHVvL3BsYW5ldHByb2NlZHVyYWwgYW5kIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXJpYW40Mi9wcm9jZWR1cmFsYXJ0XG4gKi9cblxudmFyIFV0aWwgPSB7fTtcblxuKGZ1bmN0aW9uICgpIHtcbiAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgVXRpbCA9IHtcblxuICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzEwOTk2NzAvODk1NTg5XG4gICAgZ2V0UXVlcnlQYXJhbXM6IGZ1bmN0aW9uIChxcykge1xuICAgICAgcXMgPSBxcy5zcGxpdCgnKycpLmpvaW4oJyAnKTtcblxuICAgICAgdmFyIHBhcmFtcyA9IHt9LFxuICAgICAgICB0b2tlbnMsXG4gICAgICAgIHJlID0gL1s/Jl0/KFtePV0rKT0oW14mXSopL2c7XG5cbiAgICAgIHdoaWxlICh0b2tlbnMgPSByZS5leGVjKHFzKSkge1xuICAgICAgICBwYXJhbXNbZGVjb2RlVVJJQ29tcG9uZW50KHRva2Vuc1sxXSldID0gZGVjb2RlVVJJQ29tcG9uZW50KHRva2Vuc1syXSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwYXJhbXM7XG4gICAgfSxcblxuICAgIC8vIC0tLS0tLS0tLS0gVXNlZnVsIGhlbHBlciB0b29scyAtLS0tLS0tLS0tLS1cblxuICAgIGNvcHk6IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAgIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG9iamVjdCkpO1xuICAgIH0sXG5cbiAgICB0b1R1cGxlOiBmdW5jdGlvbiAoY29vcmRpbmF0ZSkge1xuICAgICAgcmV0dXJuIHt4OiBjb29yZGluYXRlWzBdLCB5OiBjb29yZGluYXRlWzFdfTtcbiAgICB9XG5cbiAgfTsgLy8gVXRpbFxuXG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiKVxuICAgIG1vZHVsZS5leHBvcnRzID0gVXRpbDtcblxufSkoKTtcbiJdfQ==
