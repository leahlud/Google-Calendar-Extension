const colorGrid = document.querySelector(".color-grid");

const addColor = document.querySelector(".color-option.add-color");
const clearColors = document.querySelector(".clear-actions");

const pickerContainer = document.getElementById('pickerContainer');
const colorDetails = document.getElementById('colorDetails');
const hexInput = document.getElementById('hexInput');
const textColorSelect = document.getElementById('textColorSelect');
const colorNameInput = document.getElementById('colorNameInput');

const colorActions = document.querySelector('.color-actions');
const saveButton = document.getElementById('saveColor');
const cancelButton = document.getElementById('cancelColor');

let colorPicker;

// on startup, populate the color grid from local storage
populateColorGrid()

/**
 * Displays the custom color picker UI.
 */
function showColorPicker() {
    pickerContainer.style.display = 'flex';
    colorDetails.style.display = 'flex';
    colorActions.style.display = 'flex';
    clearColors.style.display = 'none';
}

/**
 * Hides the custom color picker UI.
 */
function hideColorPicker() {
    pickerContainer.style.display = 'none';
    colorDetails.style.display = 'none';
    colorActions.style.display = 'none';
    clearColors.style.display = 'flex';
}

/**
 * Saves the new color to Chrome local storage.
 * @param {String} color - The color object containing hex, textColor, and colorName.
 * @param {Function} callback - Callback called with true if successful, false if color name exists.
 */
function saveColor(color, callback) {
    chrome.storage.local.get({ customColors: {}, colorOrder: [] }, (result) => {
        const { customColors, colorOrder } = result;

        // check if custom color with that name already exists
        if (color.colorName in customColors) {
            callback(false);
            return;
        }

        // add the custom color to local storage
        customColors[color.colorName] = {
            hex: color.hex,
            textColor: color.textColor
        };
        colorOrder.push(color.colorName);
        
        chrome.storage.local.set({ customColors, colorOrder }, () => {
            callback(true);
        });
    });
}

/**
 * Deletes the saved color from Chrome local storage.
 * @param {String} colorName - The name of the color to delete.
 */
function deleteColor(colorName) {
    chrome.storage.local.get({ customColors: {}, colorOrder: [] }, (result) => {
        const { customColors, colorOrder } = result;

        delete customColors[colorName]
        const updatedOrder = colorOrder.filter(name => name !== colorName);

        chrome.storage.local.set({ customColors, colorOrder : updatedOrder });
    });
}

/**
 * Creates a color option element and adds it to the color grid.
 * @param {string} hex - The background color hex code.
 * @param {string} textColor - The color of the label text ("black" or "white").
 * @param {string} colorName - The unique name for the color used for identification.
 */
function addColorToGrid(hex, textColor, colorName) {
    // create and insert a .color-option for each saved color
    const div = document.createElement("div");
    div.className = "color-option";
    div.tabIndex = 0;
    div.style.backgroundColor = hex;
    div.style.color = textColor;
    div.setAttribute("data-color", hex);
    div.setAttribute("data-title", colorName);
    div.setAttribute("aria-label", `Color: ${colorName}`); // for accessibility
    div.setAttribute("role", "button"); // for accessibility


    const hoverText = document.createElement("span");
    hoverText.className = "hover-text";
    hoverText.textContent = "Aa";

    div.appendChild(hoverText);

    // add event listener for clicking the color option 
    div.addEventListener("click", () => {
        deleteColor(colorName);
        removeColorFromGrid(colorName);
    });

    // append the color to the grid of colors
    colorGrid.insertBefore(div, addColor);
}

/**
 * Removes specified color from the color grid.
 * @param {String} colorName - The name of the color to remove.
 */
function removeColorFromGrid(colorName) {
    // find the matching color option and remove it
    const colorOption = document.querySelector(`.color-option[data-title="${colorName}"]`);
    if (colorOption) colorOption.remove();
}

/**
 * Clears and repopulates the color grid using saved values from Chrome local storage.
 */
function populateColorGrid() {
    // clear the inner html and push the add new custom color button
    colorGrid.innerHTML = "";
    colorGrid.appendChild(addColor);

    // fetch the custom colors from local storage
    chrome.storage.local.get({ customColors: {}, colorOrder: [] }, (result) => {
        const { customColors, colorOrder } = result;

        // create and insert a .color-option for each saved color (in order it was added)
        for (const colorName of colorOrder) {
            const { hex, textColor } = customColors[colorName];
            addColorToGrid(hex, textColor, colorName);
        }
    });
}

/**
 * Add click listener to clear button for removing user's color palette.
 */
clearColors.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete all saved colors?")) {
        chrome.storage.local.remove(["customColors", "colorOrder"], () => {
            // refresh grid after clearing
            populateColorGrid();
        });
    }
});

/**
 * Add click listener to add button for opening custom color popup.
 */
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
        colorPicker.on('color:change', function (color) {
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

/**
 * Add click listener to save button for saving the new custom color to user's color palette.
 */
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

    // save the color to persistant storage
    saveColor(newColor, (success) => {
        if (!success) {
            alert(`A color named "${colorName}" already exists.`);
            return;
        }

        addColorToGrid(hex, textColor, colorName);

        // set visibility of elements
        hideColorPicker();
    });
});

/**
 * Add click listener to cancel button for exiting the custom color popup.
 */
cancelButton.addEventListener("click", () => {
    // set visibility of elements
    hideColorPicker();
});

const DEBUG_MODE = true;

if (DEBUG_MODE && typeof addDebugControls === 'function') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addDebugControls);
    } else {
        addDebugControls();
    }
}