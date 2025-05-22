const colorGrid = document.querySelector(".color-grid");

const addColor = document.querySelector(".color-option.add-color");
const clearColors = document.querySelector(".popup-clear");

const pickerContainer = document.getElementById('pickerContainer');
const colorDetails = document.getElementById('colorDetails');
const hexInput = document.getElementById('hexInput');
const textColorSelect = document.getElementById('textColorSelect');
const colorNameInput = document.getElementById('colorNameInput');

const colorActions = document.querySelector('.color-actions');
const saveButton = document.getElementById('saveColor');
const cancelButton = document.getElementById('cancelColor');

let colorPicker;

populateColorGrid()

function showColorPicker() {
    pickerContainer.style.display = 'flex';
    colorDetails.style.display = 'flex';
    colorActions.style.display = 'flex';
    clearColors.style.display = 'none';
}

function hideColorPicker() {
    pickerContainer.style.display = 'none';
    colorDetails.style.display = 'none';
    colorActions.style.display = 'none';
    clearColors.style.display = 'flex';
}

function saveColor(color) {
    chrome.storage.local.get({ customColors: [] }, (result) => {
        const updatedColors = [...result.customColors, color];
        chrome.storage.local.set({ customColors: updatedColors });
    });
}

function deleteColor(colorName) {
    chrome.storage.local.get({ customColors: [] }, (result) => {
        const updatedColors = result.customColors.filter( (c) => c.colorName !== colorName);
        chrome.storage.local.set({ customColors: updatedColors });
    });
}

function addColorToGrid(hex, colorName) {
    // create and insert a .color-option for each saved color
    const div = document.createElement("div");
    div.className = "color-option";
    div.tabIndex = 0;
    div.style.backgroundColor = hex;
    div.setAttribute("data-color", hex);
    div.setAttribute("data-title", colorName);

    // TODO: event listener for deleting
    div.addEventListener("click", () => {
        deleteColor(colorName);
        removeColorFromGrid(colorName);
    });

    // append the color to the grid of colors
    colorGrid.insertBefore(div, addColor);
}

function removeColorFromGrid(colorName) {
    const colorOptions = document.querySelectorAll(".color-option");
    colorOptions.forEach(option => {
        if (option.getAttribute("data-title") === colorName) {
            option.remove();
        }
    });
}

function populateColorGrid() {
    // clear all but the addColor button
    colorGrid.innerHTML = "";
    
    // push the add new custom color button at the end
    colorGrid.appendChild(addColor);

    chrome.storage.local.get({ customColors: [] }, (result) => {
        const savedColors = result.customColors;

        // Create and insert a .color-option for each saved color
        savedColors.forEach(({ hex, textColor, colorName }) => {
            addColorToGrid(hex, colorName);
        });
    });
    
}

clearColors.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete all saved colors?")) {
        chrome.storage.local.clear(() => {
            // refresh grid after clearing
            populateColorGrid();
        });
    }
});

addColor.addEventListener("click", () => {
    // set visibility of elements
    showColorPicker();

    // create the color picker only once
    if (!colorPicker) {
        colorPicker = new iro.ColorPicker('#pickerContainer', {
            width: 150,
            color: "#FF0000", // default to red
            handleRadius: 9
        });

        // update hex value in input when new color is picked
        colorPicker.on('color:change', function(color) {
            hexInput.value = color.hexString;
        });

        // sync the hex value from the user back into the color picker
        hexInput.addEventListener("input", () => {
            const value = hexInput.value;
            if (/^#[0-9a-fA-F]{6}$/.test(value)) {
                colorPicker.color.hexString = value;
            }
        });
    }
});

saveButton.addEventListener("click", () => {

    // get inputs from color picker, select, and input
    const hex = colorPicker.color.hexString;
    const textColor = textColorSelect.value;
    const colorName = colorNameInput.value.trim();

    // check if inputs are valid
    if (textColor !== "black" && textColor !== "white") {
        alert("Please select a text color.");
        return;
    }

    if (colorName === "") {
        alert("Please enter a name for your color.");
        return;
    }

    const newColor = { hex, textColor, colorName };
    // console.log("Saved:", newColor);

    // save the color to persistant storage
    saveColor(newColor);
    addColorToGrid(hex, colorName);

    // set visibility of elements
    hideColorPicker();
});

cancelButton.addEventListener("click", () => {
    // set visibility of elements
    hideColorPicker();
});


