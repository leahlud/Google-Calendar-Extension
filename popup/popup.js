const addColor = document.querySelector(".color-option.add-color");
const clearColors = document.querySelector(".popup-clear");

const pickerContainer = document.getElementById('pickerContainer');
const colorDetails = document.getElementById('colorDetails');
const textColorSelect = document.getElementById('textColorSelect');
const colorNameInput = document.getElementById('colorNameInput');

const colorActions = document.querySelector('.color-actions');
const saveButton = document.getElementById('saveColor');
const cancelButton = document.getElementById('cancelColor');

let colorPicker;

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
    console.log("Saved:", newColor);

    // set visibility of elements
    hideColorPicker();
});

cancelButton.addEventListener("click", () => {
    // set visibility of elements
    hideColorPicker();
});


