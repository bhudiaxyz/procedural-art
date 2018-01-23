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

var LOWER_LEFT = {x: canvas.width, y: canvas.height};
var LOWER_RIGHT = {x: 0, y: canvas.height};
var UPPER_LEFT = {x: canvas.width, y: 0};
var UPPER_RIGHT = {x: 0, y: 0};

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
  return {h: randH, s: randS, l: randL};
}

function rollingMountainNoise(x, z) {
  return simplex.noise2D(z, x) +
    0.5 * simplex.noise2D(0, 2 * x);
}

function mountainNoise(x, z) {
  return simplex.noise2D(z, x) +
    0.5 * simplex.noise2D(0, 2 * x) +
    0.25 * simplex.noise2D(0, 4 * x) +
    0.125 * simplex.noise2D(0, 8 * x);
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

  if (v < lowerCap)
    return 0;
  if (v > upperCap)
    return 1;
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
  scene.colors.mountains = {h: base.h + random() * 0.2 - 0.1, s: base.s + random() * 0.2 - 0.1, l: base.l + random() * 0.1 + 0.15};
  scene.colors.hills = {h: scene.colors.mountains.h + random() * 0.2 - 0.1, s: scene.colors.mountains.s + random() * 0.2 - 0.1, l: scene.colors.mountains.l + random() * 0.1 + 0.15};
  scene.colors.river = {h: base.h, s: base.s - random() * 0.1 - 0.05, l: base.l + random() * 0.1 - 0.05};
  scene.colors.sky = {h: base.h, s: base.s, l: base.l - 0.1};
  scene.colors.sky2 = {h: base.h, s: base.s, l: base.l - 0.2 - random() * 0.2};
  scene.colors.clouds = {h: base.h, s: 0.4, l: 0.2};
  scene.colors.trees = {h: base.h + 0.5, s: 0.4, l: 0.2};
  scene.colors.leaves = {h: scene.colors.trees.h + 0.5, s: 0.6, l: 0.5};
  scene.colors.leaves2 = {h: scene.colors.trees.h + 0.4, s: 0.6, l: 0.5};
  scene.colors.planet = {h: scene.colors.hills.h, s: 0.4, l: 0.4};

} else if (scene.time === "day") {

  var base = randomColor("medium");
  scene.colors.base = base;
  scene.colors.mountains = {h: base.h + 0.4 + random() * 0.1, s: 0.2 + random() * 0.2, l: base.l + random() * 0.1 - 0.05};
  scene.colors.hills = {h: scene.colors.mountains.h + random() * 0.2 - 0.1, s: 0.4 + random() * 0.2, l: base.l + random() * 0.1};
  scene.colors.river = {h: base.h, s: base.s - random() * 0.1 - 0.05, l: base.l + random() * 0.1 + 0.2};
  scene.colors.sky = {h: base.h, s: base.s, l: base.l - 0.1};
  scene.colors.sky2 = {h: base.h, s: base.s, l: base.l - 0.2 - random() * 0.2};
  scene.colors.clouds = {h: base.h, s: 0.3, l: 0.9};
  scene.colors.trees = {h: base.h, s: 0.4, l: 0.4};
  scene.colors.leaves = {h: scene.colors.trees.h + 0.5, s: 0.65, l: 0.6};
  scene.colors.leaves2 = {h: scene.colors.trees.h + 0.4, s: 0.65, l: 0.6};
  scene.colors.planet = {h: scene.colors.trees.h + 0.5, s: 0.8, l: 0.6};

} else { // scene.time === "desert"

  var base = randomColor("light");
  scene.colors.base = base;
  scene.colors.mountains = {h: base.h + 0.3 + random() * 0.05, s: 0.2 + random() * 0.2, l: base.l + random() * 0.1 - 0.15};
  scene.colors.hills = {h: scene.colors.mountains.h + random() * 0.2 - 0.1, s: 0.4 + random() * 0.2, l: base.l + random() * 0.1};
  scene.colors.river = {h: base.h, s: base.s - random() * 0.1 - 0.05, l: base.l + random() * 0.1 + 0.2};
  scene.colors.sky = {h: base.h, s: base.s, l: base.l - 0.1};
  scene.colors.sky2 = {h: base.h, s: base.s, l: base.l - 0.2 - random() * 0.2};
  scene.colors.clouds = {h: base.h, s: 0.3, l: 0.9};
  scene.colors.trees = {h: base.h, s: 0.4, l: 0.4};
  scene.colors.leaves = {h: scene.colors.trees.h + 0.5, s: 0.6, l: 0.6};
  scene.colors.leaves2 = {h: scene.colors.trees.h + 0.4, s: 0.6, l: 0.6};
  scene.colors.planet = {h: scene.colors.trees.h + 0.5, s: 0.8, l: 0.6};
}

// ---------- Scene functions ------------

function make1DNoise(axis, amplitude, scale, params) { //scale normalized at 0.01, amp at 100
  var newNoise = [];

  for (var i = 0; i < canvas.width; i++) {
    newNoise.push({x: i, y: axis + amplitude * params.noiseFunction(scale * i, params.zaxis)});
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
  if (params.storepoints)
    scene.points = Util.copy(newNoise);

  newNoise.push(LOWER_LEFT);
  newNoise.push(LOWER_RIGHT);
  ctx.fillStyle = params.fillColor;
  Draw.fillPath(ctx, newNoise);

  if (params.clip)
    ctx.clip();
}

function makeStars(starcount, params) {
  ctx.fillStyle = "#FFFFFF";
  for (var i = 0; i < starcount; i++) { //making 300 stars
    var starx = random() * canvas.width;
    var stary = random() * canvas.height;

    if (stary < 200) { //near the top
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
  if (!scene.enabled.river)
    return;

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
    for (var i = 0; i < canvas.height; i++) { //go along one edge
      del = Math.abs(position.y - i);
      points.push({x: 10 * simplex.noise2D(100, i / 30) + position.x + halfwidth + del * slope, y: i});
    }
    for (var i = canvas.height - 1; i >= 0; i--) { //go along the other edge
      del = Math.abs(position.y - i);
      points.push({x: 10 * simplex.noise2D(200, i / 30) + position.x - halfwidth - del * slope, y: i});
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
  ctx.fillStyle = Color.toHslString({h: scene.colors.base.h, s: 0.3, l: 0.8});
  ctx.fill();

  ctx.arc(position.x, position.y, innerRadius + radiusRange / 3 * 2, 0, 2 * Math.PI);
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = Color.toHslString({h: scene.colors.base.h, s: 0.3, l: 0.85});
  ctx.fill();

  ctx.arc(position.x, position.y, outerRadius, 0, 2 * Math.PI);
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = Color.toHslString({h: scene.colors.base.h, s: 0.3, l: 0.9});
  ctx.fill();

  ctx.arc(position.x, position.y, outerRadius + radiusRange * 2 / 3, 0, 2 * Math.PI);
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = Color.toHslString({h: scene.colors.base.h, s: 0.3, l: 0.95});
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
        Draw.drawPixel(ctx, {x: xpos, y: ypos}, 'rgba(0, 0, 0, 0.01)');
      }
      if (simplex.noise2D(xpos * 0.03, ypos * 0.03) > 0.1 + random() * 0.2) {
        Draw.drawPixel(ctx, {x: xpos, y: ypos}, 'rgba(0, 0, 0, 0.03)');
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
  if (!scene.enabled.clouds)
    return;

  var colorStr = Color.toHslString(scene.colors.clouds);
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  for (var i = 0; i < canvas.width; i++) {
    for (var j = 0; j < canvas.height; j++) {
      var noiseValue = simplex.noise2D(i * 0.002 + params.offset, j * 0.01 + params.offset);
      if (noiseValue > params.threshold + random() * params.variance) {
        Draw.drawPixel(ctx, {x: i, y: j}, colorStr);
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
  if (!scene.enabled.stars)
    return;

  if (scene.time === "night") {
    makeStars(300, {width: 3, variance: 2.2, largenessFactor: 0.2});

    if (scene.enabled.planet) {
      makePlanet({x: 100 + random() * (canvas.width - 200), y: 130}, {radius: params.planetRadius, variance: 0.1});
      makePlanet({x: 80 + random() * (canvas.width - 300), y: 50 + random() * (canvas.height - 300)}, {radius: params.planetRadius / 3, variance: 0.15});
    }

  } else {
    makeSun({x: 100 + random() * (canvas.width - 200), y: 100}, {innerRadius: params.sunRadius / 3 * 2, outerRadius: params.sunRadius + 15, variance: 0.15});

    if (random() > 0.5) {
      makePlanet({x: 80 + random() * (canvas.width - 300), y: 50 + random() * (canvas.height - 300)}, {radius: params.planetRadius / 4, variance: 0.15});
    }
  }
}

function makeSky() {
  if (!scene.enabled.sky)
    return;

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
  for (var i = 0; i < 15; i++) { //add some stuff on top and bottom
    trianglePoints.push([random() * canvas.width, 0]);
    trianglePoints.push([random() * canvas.width, canvas.height]);
  }
  for (var i = 0; i < 25; i++) { //add some stuff on the sides
    trianglePoints.push([0, random() * canvas.height]);
    trianglePoints.push([canvas.width, random() * canvas.height]);
  }
  for (var i = 0; i < 75; i++) { //add some stuff in the middle
    trianglePoints.push([random() * canvas.width, random() * canvas.height]);
    trianglePoints.push([random() * canvas.width, random() * canvas.height]);
  }

  var triangles = Delaunay.triangulate(trianglePoints); //do the actual triangulation

  var newtriangle = [];
  for (var i = 0; i < triangles.length; i++) {
    newtriangle.push(Util.toTuple(trianglePoints[triangles[i]]));
    if (newtriangle.length === 3) {
      if (scene.time === 'day' || scene.time === 'desert') {
        ctx.fillStyle = Color.toHslString({h: scene.colors.base.h, s: scene.colors.base.s + random() * 0.2 - 0.1, l: scene.colors.base.l + random() * 0.2 - 0.1});
        var center = {x: 0, y: 0};
        center.x = (newtriangle[0].x + newtriangle[1].x + newtriangle[2].x) / 3;
        center.y = (newtriangle[0].y + newtriangle[1].y + newtriangle[2].y) / 3;
        var centercolor = ctx.getImageData(center.x, center.y, 1, 1).data;

        var fillcolor = "rgb(" + centercolor[0] + ", " + centercolor[1] + ", " + centercolor[2] + ")";
        ctx.fillStyle = fillcolor;
      } else {
        ctx.fillStyle = Color.toHslString({h: scene.colors.base.h, s: scene.colors.base.s + random() * 0.01 - 0.005, l: scene.colors.base.l + random() * 0.01 - 0.005});
      }
      Draw.fillPath(ctx, newtriangle);

      newtriangle = [];
    }
  }
}

function makeMountains() {
  if (!scene.enabled.mountains)
    return;

  var sstep = 0.03, lstep = 0.02;
  var tallRange = 150, lowerRange = 100;
  make1DNoise(430, tallRange, 0.005, {noiseFunction: scene.mountainNoise, fillColor: Color.toHslString(scene.colors.mountains), zaxis: 0});
  mountainShade = {h: scene.colors.mountains.h, s: scene.colors.mountains.s - sstep, l: scene.colors.mountains.l - lstep};
  for (var i = 0; i < 3; i++) {
    make1DNoise(430, tallRange + i * 35, 0.005, {noiseFunction: scene.mountainNoise, fillColor: Color.toHslString(mountainShade), zaxis: 0.05 * i});
    mountainShade.s += sstep + random() * lstep;
    mountainShade.l -= lstep - random() * sstep;
  }

  make1DNoise(430, lowerRange, 0.0045, {noiseFunction: scene.mountainNoise, fillColor: Color.toHslString(scene.colors.mountains), zaxis: 0});
  mountainShade = {h: scene.colors.mountains.h, s: scene.colors.mountains.s - sstep, l: scene.colors.mountains.l - lstep};
  for (var i = 0; i < 3; i++) {
    make1DNoise(430, lowerRange - i * 25, 0.0045, {noiseFunction: scene.mountainNoise, fillColor: Color.toHslString(mountainShade), zaxis: 0.04 * i});
    mountainShade.s -= sstep - random() * lstep;
    mountainShade.l += lstep + random() * sstep;
  }
}

function makeHills() {
  if (!scene.enabled.hills)
    return;

  ctx.save();
  make1DNoise(500, 50, 0.002, {noiseFunction: scene.hillNoise, fillColor: Color.toHslString(scene.colors.hills), zaxis: 0, keepmax: true, clip: true, storepoints: true});
  for (var i = 1; i < 5; i++) {
    make1DNoise(500 + i * 20, 50 - i * 2, 0.002, {noiseFunction: scene.hillNoise, fillColor: Color.toHslString({h: scene.colors.hills.h, s: scene.colors.hills.s, l: scene.colors.hills.l + i * 0.05}), zaxis: 0.02 + i * 0.02});
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

  Draw.drawLine({x: 0, y: 0}, {x: 0, y: len}, ctx2);
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
  if (!scene.enabled.trees)
    return;

  ctx.restore();

  var treeColorStr = Color.toHslString(scene.colors.trees);

  var maxNumTrees = 20 + Math.floor(random() * 20);
  var colorStepInc = 0.2 / maxNumTrees;
  var colorStep = 0.01;

  var leaveShade = {h: scene.colors.leaves.h, s: scene.colors.leaves.s, l: scene.colors.leaves.l};
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

      var leafCenter = {x: treex - treeWidth / 2, y: treey - treeHeight};
      var blobpoints = [];
      var pointcount = 30, radius = 8 + Math.floor(random() * 10);
      for (var j = 0; j < pointcount; j++) { // Map points onto a circle
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
makeClouds({threshold: 0.65, variance: 0.04, offset: 100, fluffyFactor: 0.1});
makeSunPlanets({planetRadius: 100, sunRadius: 50});
makeClouds({threshold: 0.55, variance: 0.03, offset: 150, fluffyFactor: 0.2});
makeMountains();
makeHills();
makeRiver({variance: 0.06});
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
