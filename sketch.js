let comfy;
let srcImg;
let resImg;
let beautyStandard = "";
let generateButton;
let fileInput;
let displayDuration = 10 * 60; // 10 seconds
let isGenerating = false;
let frameCountAtDisplay = 0;
let inputImg = null; 

// Define beauty prompts
let beautyPrompts = {
  "Middle Eastern": "human face, photorealistic, Middle Eastern, round or oval face, large almond-shaped eyes, prominent elevated arched eyebrows, a small, straight nose, full lips, well-defined jawline, feminine, with smooth skin and realistic proportions.Retain the user's distinct facial structure and key recognizable traits, blending them harmoniously with the described features. ",
  "Chinese": "human face, photorealistic, chinese, egg-shaped face, narrow jaw, small mouth and lips, large round eyes, double eyelids, high-bridged nose, feminine, with smooth skin and realistic proportions. Retain the user's distinct facial structure and key recognizable traits, blending them harmoniously with the described features.",
  "South Korean": "human face, photorealistic, South Korean, with a V-line face, straight nose, straight eyebrows, flawless skin, round face, double eyelids, small cherry lips, feminine, delicate, with smooth skin and realistic details.Retain the user's distinct facial structure and key recognizable traits, blending them harmoniously with the described features.",
  "Latina": "human face, photorealistic, Latina, with lighter hair (blonde or light brown), lighter eyes (hazel, green, blue), plump lips, straight hair, feminine, smooth skin and realistic proportions. Retain the user's distinct facial structure and key recognizable traits, blending them harmoniously with the described features.",
  "Nigerian": "human face, photorealistic, Nigerian, with lighter yellow-toned skin, smooth and even skin texture, youthful appearance, low facial adiposity, and narrow facial features, and graceful and delicate eyeballs ('Ẹl-éyinjú-ẹgé'). Retain the user's distinct facial structure and key recognizable traits, blending them harmoniously with the described features.",
  "Western": "Make this a realistic woman from the United States or Europe, ideally white, with facial proportions based on the Golden Ratio. The face length (hairline to chin) should be 1.618 times the face width (cheekbone to cheekbone). The distance between the eyes should be 1.618 times the width of each eye. The nose length (bridge to tip) should be 1.618 times the distance from the nose base to the upper lip. The mouth width should be 1.618 times the nose width. Ensure smooth skin, feminine features, and realistic proportions.",
};

function preload() {
  workflow = loadJSON("workflow_api.json");
}

function setup() {
  let canvasParent = document.getElementById("sketch-container");
  let canvasWidth = 800;
  let canvasHeight = 480;
  let canvas = createCanvas(canvasWidth, canvasHeight);
  canvas.parent("sketch-container");

  pixelDensity(2);
  srcImg = createGraphics(width, height);

  comfy = new ComfyUiP5Helper("https://gpu1.gohai.xyz:8188");
  console.log("workflow is", workflow);

  // Set up file input button
  fileInput = document.getElementById("file-input-button");
  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        inputImg = loadImage(e.target.result, () => {
          console.log("Image uploaded successfully!");
        }, (err) => {
          console.error("Error loading image:", err);
        });
      };
      reader.readAsDataURL(file);
    }
  });

  // Set up generate button
  generateButton = document.getElementById("generate-button");
  generateButton.addEventListener("click", requestImage);

  // Beauty standard buttons
  let buttons = [
    { id: 'middle-eastern', label: 'Middle Eastern', beauty: beautyPrompts["Middle Eastern"] },
    { id: 'chinese', label: 'Chinese', beauty: beautyPrompts["Chinese"] },
    { id: 'south-korean', label: 'South Korean', beauty: beautyPrompts["South Korean"] },
    { id: 'latina', label: 'Latina', beauty: beautyPrompts["Latina"] },
    { id: 'nigerian', label: 'Nigerian', beauty: beautyPrompts["Nigerian"] },
    { id: 'western', label: 'Western', beauty: beautyPrompts["Western"] },
  ];

  buttons.forEach((button) => {
    let buttonElement = document.getElementById(button.id);
    buttonElement.addEventListener("click", () => {
      beautyStandard = button.beauty;
      console.log(`${button.label} selected`);
      console.log("Selected Beauty Standard:", beautyStandard);
    });
  });
}

function requestImage() {
  if (!beautyStandard) {
    console.log("Please select a beauty standard first!");
    return;
  }

  console.log("Workflow before generation:", workflow);

  if (inputImg) {
    workflow[10] = comfy.image(inputImg); // Use uploaded image
  }

  workflow[6].inputs.text = beautyStandard;
  workflow[3].inputs.seed = workflow[3].inputs.seed + 1;
  workflow[10].inputs.strength = 0.5; // blending ratio
  isGenerating = true;

  comfy.run(workflow, gotImage);
}

function gotImage(data, err) {
  if (err) {
    console.error("Error:", err);
    return;
  }

  console.log("gotImage", data);

  if (data.length > 0) {
    resImg = loadImage(data[0].src);
    isGenerating = false;
    frameCountAtDisplay = frameCount;
  }
}

function scaleImage(img, canvasWidth, canvasHeight) {
  let aspect = img.width / img.height;
  let newWidth = canvasWidth;
  let newHeight = newWidth / aspect;

  if (newHeight > canvasHeight) {
    newHeight = canvasHeight;
    newWidth = newHeight * aspect;
  }

  return { width: newWidth, height: newHeight };
}

function windowResized() {
  let canvasParent = document.getElementById("sketch-container");
  resizeCanvas(canvasParent.offsetWidth, canvasParent.offsetHeight);
}

function draw() {
  background('#FFFFFF');

  if (inputImg && inputImg.width > 0 && inputImg.height > 0) {
    // Centering uploaded image
    let scaled = scaleImage(inputImg, width, height);
    image(inputImg, (width - scaled.width) / 2, (height - scaled.height) / 2, scaled.width, scaled.height);
  }

  image(srcImg, 0, 0);

  if (resImg) {
    // Centering generated image
    let scaled = scaleImage(resImg, width, height);
    image(resImg, (width - scaled.width) / 2, (height - scaled.height) / 2, scaled.width, scaled.height);
    if (frameCount - frameCountAtDisplay > displayDuration) {
      resImg = null;
    }
  }

  if (isGenerating) {
    fill(0);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("Generating Image...", width / 2, height / 2);
  }
}
