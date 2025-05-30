// debug.js - Random color generator for testing
// This file should only be included during development

/**
 * Generates a random hex color
 * @returns {string} A hex color string like "#FF5733"
 */
function generateRandomColor() {
    const colors = Math.floor(Math.random() * 16777215).toString(16);
    return '#' + colors.padStart(6, '0').toUpperCase();
}

/**
 * Determines if a color is light or dark to choose appropriate text color
 * @param {string} hex - Hex color string
 * @returns {string} "black" or "white"
 */
function getTextColorForBackground(hex) {
    // Convert hex to RGB
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? 'black' : 'white';
}

/**
 * Generates creative color names
 * @returns {string} A creative color name
 */
function generateColorName() {
    const adjectives = [
        'Mystic', 'Electric', 'Cosmic', 'Vibrant', 'Dreamy', 'Bold', 'Soft', 'Neon',
        'Pastel', 'Deep', 'Bright', 'Muted', 'Rich', 'Subtle', 'Intense', 'Gentle',
        'Warm', 'Cool', 'Fiery', 'Icy', 'Golden', 'Silver', 'Crystal', 'Velvet'
    ];
    
    const nouns = [
        'Sunset', 'Ocean', 'Forest', 'Sky', 'Rose', 'Flame', 'Storm', 'Dawn',
        'Twilight', 'Coral', 'Jade', 'Amber', 'Ruby', 'Sapphire', 'Pearl', 'Opal',
        'Meadow', 'Desert', 'Mountain', 'River', 'Galaxy', 'Aurora', 'Prism', 'Rainbow'
    ];
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return `${adjective} ${noun}`;
}

/**
 * Generates 10 random colors and adds them to storage
 * @param {Function} callback - Called when complete with success status
 */
function addRandomColorsToDebug(callback) {
    chrome.storage.local.get({ customColors: {}, colorOrder: [] }, (result) => {
        const { customColors, colorOrder } = result;
        
        let addedCount = 0;
        const newColors = [];
        
        // Generate 10 unique random colors
        for (let i = 0; i < 10; i++) {
            let colorName;
            let attempts = 0;
            
            // Ensure unique color name
            do {
                colorName = generateColorName();
                attempts++;
            } while (customColors[colorName] && attempts < 50);
            
            // If we couldn't find a unique name after 50 attempts, add a number
            if (customColors[colorName]) {
                colorName = `${colorName} ${Date.now() + i}`;
            }
            
            const hex = generateRandomColor();
            const textColor = getTextColorForBackground(hex);
            
            customColors[colorName] = { hex, textColor };
            colorOrder.push(colorName);
            newColors.push({ name: colorName, hex, textColor });
            addedCount++;
        }
        
        // Save to storage
        chrome.storage.local.set({ customColors, colorOrder }, () => {
            console.log(`Debug: Added ${addedCount} random colors:`, newColors);
            if (callback) callback(true, newColors);
        });
    });
}

/**
 * Clears all colors and adds fresh random ones
 * @param {Function} callback - Called when complete
 */
function replaceWithRandomColors(callback) {
    chrome.storage.local.set({ customColors: {}, colorOrder: [] }, () => {
        addRandomColorsToDebug(callback);
    });
}

/**
 * Adds debug controls to the popup if in development mode
 * Only call this function when debugging is enabled
 */
function addDebugControls() {
    const popup = document.querySelector('.custom-color-picker');
    if (!popup || document.querySelector('.debug-controls')) return;
    
    const debugSection = document.createElement('div');
    debugSection.className = 'debug-controls';
    debugSection.style.cssText = `
        border-top: 2px solid #ff6b6b;
        padding: 16px 24px;
        background-color: #fff5f5;
        font-size: 12px;
    `;
    
    debugSection.innerHTML = `
        <div style="color: #d63031; font-weight: 600; margin-bottom: 8px;">
            DEBUG MODE
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button id="addRandomColors" style="
                padding: 6px 12px; 
                font-size: 11px; 
                background: #ff6b6b; 
                color: white; 
                border: none; 
                border-radius: 4px; 
                cursor: pointer;
            ">Add 10 Random</button>
            <button id="replaceWithRandom" style="
                padding: 6px 12px; 
                font-size: 11px; 
                background: #fd79a8; 
                color: white; 
                border: none; 
                border-radius: 4px; 
                cursor: pointer;
            ">Replace All</button>
        </div>
    `;
    
    popup.appendChild(debugSection);
    
    // Add event listeners
    document.getElementById('addRandomColors').addEventListener('click', () => {
        addRandomColorsToDebug((success, colors) => {
            if (success) {
                // Refresh the color grid if the populateColorGrid function exists
                if (typeof populateColorGrid === 'function') {
                    populateColorGrid();
                }
                // alert(`Added ${colors.length} random colors!`);
            }
        });
    });
    
    document.getElementById('replaceWithRandom').addEventListener('click', () => {
        if (confirm('Replace all existing colors with 10 random ones?')) {
            replaceWithRandomColors((success, colors) => {
                if (success) {
                    // Refresh the color grid
                    if (typeof populateColorGrid === 'function') {
                        populateColorGrid();
                    }
                    alert(`Replaced with ${colors.length} new random colors!`);
                }
            });
        }
    });
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        addRandomColorsToDebug,
        replaceWithRandomColors,
        addDebugControls,
        generateRandomColor,
        generateColorName
    };
}