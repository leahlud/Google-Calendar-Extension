const addColor = document.querySelector(".color-option.add-color");
const clearColors = document.querySelector(".popup-clear");
const pickerContainer = document.getElementById('pickerContainer');
const colorDetails = document.getElementById('colorDetails');

let colorPicker;

addColor.addEventListener("click", () => {
    // set visibility of elements
    pickerContainer.style.display = 'flex';
    colorDetails.style.display = 'flex';
    clearColors.style.display = 'none';


    // Create picker only once
    if (!colorPicker) {

        colorPicker = new iro.ColorPicker('#pickerContainer', {
            width: 150,
            color: "#FF0000", // default to red
            handleRadius: 9
        });

        colorPicker.on("color:change", (color) => {
            console.log("Picked:", color.hexString);
            // Add logic here to add color to your palette
        });

        // Update inputs when picker changes
        colorPicker.on("color:change", (color) => {
            const hex = color.hexString;
            hexInput.value = hex;
        });

        // Sync user-typed hex back into picker
        hexInput.addEventListener("input", () => {
            const value = hexInput.value;
            if (/^#[0-9a-fA-F]{6}$/.test(value)) {
                colorPicker.color.hexString = value;
            }
        });

    }


});