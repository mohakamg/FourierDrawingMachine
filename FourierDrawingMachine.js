// Global Variables

  // States
const USER = 0;
const FOURIER = 1;
let state = USER;

  // Elements
let toggleButton;

  // signalVector Variables
let drawingx = [], drawingy = [], drawingVector = [];
let signalVector = [], path = [], cnv;

// Smoothing Filter
// const movingFilter = [1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9];
const movingFilter = [1/2, 1/2];

// Fourier and signal
let signalx = [], signaly = [], fourierSignalX = [], fourierSignalY = [];
let time = 0;

// Setup function
function setup(){
  // Create a canvas
  cnv = createCanvas(1024,600);
  // cnv.mouseDragged(drawShapeUser);
  // Create a button
  toggleButton = createButton('Compute Fourier signalVector');
  toggleButton.mousePressed(toggleState); // Attach the Button Pressed Handler
}



// Continous Draw function
function draw(){
  toggleButton.mousePressed(toggleState);
  // Set Background of canvas based on the state
  if(state == USER){
    background(255);
    toggleButton.html('Compute Fourier Drawing');
    drawShapeUser();
  } else if(state == FOURIER){
    background(0);
    toggleButton.html('Draw');

    let x = 0, y = 0;

    var rotating_pt_of_x_epicycle = epicycle(width/2, 100, 0, fourierSignalX);
    var rotating_pt_of_y_epicycle = epicycle(100, height/2, HALF_PI, fourierSignalY);

    var path_point = createVector(rotating_pt_of_x_epicycle.x, rotating_pt_of_y_epicycle.y);
    path.unshift(path_point);
    line(rotating_pt_of_x_epicycle.x, rotating_pt_of_x_epicycle.y, path_point.x, path_point.y);
    line(rotating_pt_of_y_epicycle.x, rotating_pt_of_y_epicycle.y, path_point.x, path_point.y);

    beginShape();
       noFill();
       strokeWeight(1);
       for(let i = 0; i < path.length; i++){
         smooth();
         strokeWeight(5);
         point(path[i].x, path[i].y);
         strokeWeight(1);
         noSmooth();
       }
    endShape();

    const dt = 2 * Math.PI / fourierSignalX.length;
    time += dt;

    if (time > TWO_PI) {
      time = 0;
      path = [];
    }

  }
}




// Event Handlers
function toggleState(){
  // Toggle the State
  path = [];


  if(state == USER){
    state = FOURIER;
    for(var i = 0; i < signalVector.length; i++){
      signalx.push(signalVector[i].x);
      signaly.push(signalVector[i].y);
    }

    fourierSignalX = dft(signalx);
    fourierSignalY = dft(signaly);

    fourierSignalX.sort((a, b) => b.amp - a.amp);
    fourierSignalY.sort((a, b) => b.amp - a.amp);

  } else if (state == FOURIER){
    state = USER;

    // Reset Variables
    signalVector = [];
    signalx = [], signaly = []; time = 0;
    fourierSignalX = [], fourierSignalY = [];
    drawingx = []; drawingy = []; drawingVector = [];

  } else{
    state = -1;
  }



}

function mouseDragged() {
  recordShape();
}

// Helper Functions
// Draw the shape, store it and display it
function recordShape(){
  if(state == USER){
    var pointx = mouseX - width / 2;
    var pointy = mouseY - height / 2;
    drawingx.push(pointx);
    drawingy.push(pointy);

    drawingVector.push(createVector(pointx, pointy));

    // drawingx = beta*drawingx[drawingx.length - 1] + (1 - beta)*
    drawingx = conv(drawingx, movingFilter);
    drawingy = conv(drawingy, movingFilter);

    var point = createVector(drawingx[drawingx.length - 1], drawingy[drawingy.length - 1]);
    signalVector.push(point);
  }
}

// Render the shape that user drew
function drawShapeUser(){
  if(state == USER){
    beginShape();
    stroke(0);
    strokeWeight(10);
    noFill();
    for(var v of drawingVector){
      point( v.x + width / 2, v.y + height / 2 );
    }
    endShape();
  }
}

// Calculate N-point dft of signal
function dft(x) {
  var X = [];
  const N = x.length;

  var re = 0, im = 0;

  for(var k = 0; k < N; k++){
    for(var n = 0; n < N; n++){
      var phi = TWO_PI * k * n / N;
      re += x[n] * cos(phi);
      im -= x[n] * sin(phi);
    }

    re /= N;
    im /= N;

    let freq = k;
    let amp = sqrt( re ** 2 + im ** 2 );
    let phase = atan2(im, re);

    X[k] = { re, im, freq, amp, phase };

  }

  return X;

}

// Convolution funciton
function conv(vec1, vec2){
    var disp = 0; // displacement given after each vector multiplication by element of another vector
    var convVec = [];
    // for first multiplication
    for (j = 0; j < vec2.length ; j++){
        convVec.push(vec1[0] * vec2[j]);
    }
    disp = disp + 1;
    for (i = 1; i < vec1.length ; i++){
        for (j = 0; j < vec2.length ; j++){
            if ((disp + j) !== convVec.length){
                convVec[disp + j] = convVec[disp + j] + (vec1[i] * vec2[j])
            }
            else{
                convVec.push(vec1[i] * vec2[j]);
            }
        }
        disp = disp + 1;
    }
    return convVec;
}

// Draw the complex FT
function epicycle(x, y, rotation, fourierSignal){

  for(var i = 0; i < fourierSignal.length; i++){
    // Draw the Frequencise caluclated
    var prevx = x, prevy = y;
    var freq = fourierSignal[i].freq;
    var radius = fourierSignal[i].amp;
    var phase = fourierSignal[i].phase;

    // Plot the complex Circle from the location of the last Circle
    noFill();
    ellipse(prevx, prevy, radius*2);
    x += radius * cos(freq * time + phase +rotation);
    y += radius * sin(freq * time + phase + rotation);

    // Draw a line from the center of circle to the rotating point
    stroke(255);
    fill(255);
    ellipse(x, y, radius/16);
    line(prevx, prevy, x, y);

  }

  return createVector(x, y);

}
