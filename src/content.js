// for debugging
console.log("Content script running on:", window.location.href);

// Cache for storing custom colors to avoid repeated storage calls
let customColorsCache = {};
let eventColorsCache = {};
let colorOrderCache = {};
let injectedCSS = null;

// Array of official Google colors for selecting closest match
const googleColors = [
    ["#D50000", [213, 0, 0]], ["#E67C73", [230, 124, 115]],
    ["#F4511E", [244, 81, 30]], ["#F6BF26", [246, 191, 38]],
    ["#33B679", [51, 182, 121]], ["#0B8043", [11, 128, 67]],
    ["#039BE5", [3, 155, 229]], ["#3F51B5", [63, 81, 181]],
    ["#7986CB", [121, 134, 203]], ["#8E24AA", [142, 36, 170]],
    ["#616161", [97, 97, 97]]
];

// Simple variables for temporary event editing
let tempEventId = null;
let tempColorName = null;
let tempOfficialColorSelected = false; 

// Initialize cache
function initializeCache() {
    chrome.storage.local.get(['customColors', 'eventColors', 'colorOrder'], (result) => {
        customColorsCache = result.customColors || {};
        eventColorsCache = result.eventColors || {};
        colorOrderCache = result.colorOrder || {};
        console.log('Cache initialized:', { customColorsCache, eventColorsCache, colorOrderCache });
        
        // Inject CSS rules for all mapped events
        injectCustomColorCSS();
    });
}

// Inject CSS rules that will automatically apply to events as they're created
function injectCustomColorCSS() {
    // Remove existing injected CSS if any
    if (injectedCSS) {
        injectedCSS.remove();
    }
    
    // Create new style element
    injectedCSS = document.createElement('style');
    injectedCSS.id = 'custom-event-colors';
    
    let cssRules = '';
    
    // Generate CSS rules for each event that has a custom color
    Object.entries(eventColorsCache).forEach(([eventId, colorName]) => {
        if (customColorsCache[colorName]) {
            const { hex, textColor } = customColorsCache[colorName];
            
            // CSS rules for this specific event ID
            cssRules += `
                /* All-day events - DON'T touch .o4Z98 or .pmUZFe (that's the stripe) and DON'T touch .smECzc (ranged events in month view) */
                /* Only color the main content area */
                [data-eventid="${eventId}"][data-stacked-layout-chip-container] .KF4T6b:not(.smECzc),
                [data-eventid="${eventId}"][data-stacked-layout-chip-container] .UflSff {
                    background-color: ${hex} !important;
                    color: ${textColor} !important;
                }
                
                /* Time-ranged events - avoid covering the left border stripe */
                [data-eventid="${eventId}"].GTG3wb {
                    background-color: ${hex} !important;
                    border-radius: 8px !important;
                }

                [data-eventid="${eventId}"].GTG3wb .I0UMhf { 
                    /* event title */
                    color: ${textColor} !important;
                }
                [data-eventid="${eventId}"].GTG3wb .gVNoLb {
                    /* time */
                    color: ${textColor} !important;
                }
                [data-eventid="${eventId}"].GTG3wb .K9QN7e {
                    /* location */
                    color: ${textColor} !important;
                } 

                /* Resize handle - don't apply background color to preserve stripe */
                [data-eventid="${eventId}"].GTG3wb .leOeGd {
                    border-bottom-left-radius: 8px !important;
                    border-bottom-right-radius: 8px !important;
                }

                /* EVENT POPUP/DETAIL VIEW - Color the square indicator */
                [data-eventid="${eventId}"] .xnWuge {
                    background-color: ${hex} !important;
                }

                /* MONTH VIEW - color the circle for ranged events */
                [data-eventid="${eventId}"] .VlNR9e {
                    border-color: ${hex} !important;
                }

                /* SCHEDULE VIEW - color the circle for events */
                [data-eventid="${eventId}"] .poxnAc {
                    border-color: ${hex} !important;
                }
            `;
        }
    });
    
    // Add CSS rules for temporary custom color preview (for event editing)
    if (tempEventId && tempColorName && customColorsCache[tempColorName]) {
        const { hex } = customColorsCache[tempColorName];
        
        // Color picker button preview in event edit page
        cssRules += `
            /* Event edit page - color picker button preview */
            .DJjYf [jsname="QPiGnd"] {
                background-color: ${hex} !important;
            }
            .DJjYf .kQuqUe {
                background-color: ${hex} !important;
            }
        `;
    }
    
    injectedCSS.textContent = cssRules;
    document.head.appendChild(injectedCSS);
    
    console.log('Injected CSS for custom event colors');
}

/**
 * Extracts event ID from the current URL if we're on an event edit page
 * @returns {string|null} The event ID or null if not found
 */
function getEventIdFromUrl() {
    const url = window.location.href;
    const match = url.match(/\/eventedit\/([^?&#]+)/);
    return match ? match[1] : null;
}

/**
 * Checks if we're currently on an event edit page
 * @returns {boolean}
 */
function isEventEditPage() {
    return window.location.href.includes('/eventedit/');
}

/**
 * Sets a temporary color for the event being edited
 */
function setTempEventColor(eventId, colorName) {
    tempEventId = eventId;
    tempColorName = colorName;
    tempOfficialColorSelected = false;
    
    // Update the preview button immediately
    updateEventEditPreview(colorName);
    
    // Regenerate CSS to include temp color preview
    injectCustomColorCSS();
    
    console.log(`Temporary color set: ${eventId} -> ${colorName}`);
}

/**
 * Updates the color picker button preview in event edit page
 */
function updateEventEditPreview(colorName) {
    if (!customColorsCache[colorName]) return;
    
    const { hex } = customColorsCache[colorName];
    
    // Update the color picker button preview
    const colorButton = document.querySelector('.DJjYf [jsname="QPiGnd"]');
    if (colorButton) {
        colorButton.style.backgroundColor = hex;
    }
    
    // Update the data-color attribute on the container
    const container = document.querySelector('.DJjYf');
    if (container) {
        container.setAttribute('data-color', hex);
    }
}

/**
 * Gets the current color for an event (temp or permanent)
 */
function getCurrentEventColor(eventId) {
    // If this is the event being edited and has a temp color, return that
    if (tempEventId === eventId && tempColorName) {
        return tempColorName;
    }
    
    // Otherwise return permanent color
    return eventColorsCache[eventId] || null;
}


/**
 * Converts hex to RGB array
 */
function hexToRgb(hex) {
    // remove the "#"
    var hexValue = hex.replace('#', '');

    // parse each of the rgb channels
    var r = parseInt(hexValue.slice(0, 2), 16);
    var g = parseInt(hexValue.slice(2, 4), 16);
    var b = parseInt(hexValue.slice(4, 6), 16);
    return [r, g, b];
}

/**
 * Calculates the closest match with Google's default color palette
 */
function getClosestGoogleColor(hex) {
    // convert the given hex color to rgb
    const rgb = hexToRgb(hex);
    console.log(`DEBUG1: ${rgb}`)

    // initialize closest color to first in list
    let closestColor = googleColors[0];
    let minDistance = Infinity;

    for (const [googleHex, googleRgb] of googleColors) {
        // compute the euclidean distance between the colors
        const distance = (rgb[0] - googleRgb[0])**2 + 
                         (rgb[1] - googleRgb[1])**2 + 
                         (rgb[2] - googleRgb[2])**2;

        if (distance < minDistance) {
            minDistance = distance;
            closestColor = [googleHex, googleRgb];
        }
    }

    // return the hex color of the closest Google color
    return closestColor[0];
}

/**
 * Sets Google's official color to the closest match (for creating the stripe)
 */
function setOfficialColor(eventId, officialHex) {
    console.log(`OFFICIAL COLOR: ${officialHex}`);
    console.log(`[data-color="${officialHex}"][role="menuitemradio"]`);
    // Try quick picker first
    let officialElement = document.querySelector(`[data-eid="${eventId}"] [data-color="${officialHex}"]`);
    
    // If not found, try main picker
    if (!officialElement) {
        officialElement = document.querySelector(`[data-color="${officialHex}"][role="menuitemradio"]`);
    }
    
    if (officialElement) {
        console.log(`Clicking ${officialHex} to set official color`);
        officialElement.click();
        return true;
    }
    
    console.warn(`Could not find ${officialHex} color element`);
    return false;
}

/**
 * Observes save button to commit temporary colors
 */
function observeSaveButton() {
    const observer = new MutationObserver(() => {
        const saveButton = document.querySelector('button[jsname="x8hlje"]');
        if (saveButton && !saveButton.hasAttribute('data-observer-added')) {
            saveButton.setAttribute('data-observer-added', 'true');
            
            saveButton.addEventListener('click', () => {
                const currentEventId = getEventIdFromUrl();
                
                if (currentEventId) {
                    if (tempEventId && tempColorName) {
                        // Commit temporary custom color
                        console.log(`Save clicked - committing temp color: ${tempEventId} -> ${tempColorName}`);
                        addEventColorMapping(tempEventId, tempColorName);
                    } else if (tempOfficialColorSelected) {
                        // Remove custom color mapping since official color was selected
                        if (eventColorsCache[currentEventId]) {
                            console.log(`Save clicked - removing custom color mapping for event ${currentEventId} (official color selected)`);
                            removeEventColorMapping(currentEventId);
                        }
                    }
                }
                
                // Clear all temp variables
                tempEventId = null;
                tempColorName = null;
                tempOfficialColorSelected = false;
            });
            
            console.log('Save button observer added');
        }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
}

function addEventColorMapping(eventId, colorName) {
    eventColorsCache[eventId] = colorName;
    chrome.storage.local.set({ eventColors: eventColorsCache });
    // Regenerate CSS to include new mapping
    injectCustomColorCSS();
}

function removeEventColorMapping(eventId) {
    delete eventColorsCache[eventId];
    chrome.storage.local.set({ eventColors: eventColorsCache });
    // Regenerate CSS without the removed mapping
    injectCustomColorCSS();
}

function updateColorPickerSelection(colorPickerMenu, selectedColorName) {
    // Remove checkmarks from all color options
    const allColorOptions = colorPickerMenu.querySelectorAll('[role="menuitemradio"]');
    allColorOptions.forEach(option => {
        option.setAttribute('aria-checked', 'false');
        const checkmark = option.querySelector('.eO2Zfd, .lLCaB.M8B6kc');
        if (checkmark) {
            checkmark.classList.remove('eO2Zfd');
        }
    });
    
    // Add checkmark to selected custom color
    if (selectedColorName) {
        // Find custom colors by data-color-name attribute 
        const customColorOptions = colorPickerMenu.querySelectorAll('[data-color-name]');
        customColorOptions.forEach(option => {
            const colorName = option.getAttribute('data-color-name');
            if (colorName === selectedColorName) {
                option.setAttribute('aria-checked', 'true');
                const checkmark = option.querySelector('.lLCaB');
                if (checkmark) {
                    checkmark.classList.add('eO2Zfd');
                }
            }
        });
    }
}

function addExtensionColors(container) {
    // check if already inserted to prevent double injection
    if (container.querySelector('.custom-color-injected')) return;

    // Declare eventId once at the top of the function
    let eventId = null;

    // Detect event color pickers
    const isQuickEventPicker = container.closest('[data-eid]');
    const isMainEventPicker = container.closest('[role="menu"]') && 
                             !container.closest('[jsname="lePJ0e"]') && 
                             !container.querySelector('[aria-label*="calendar color"]');

    if (!isQuickEventPicker && !isMainEventPicker) {
        console.log('Skipping color injection - not an event color picker');
        return;
    }

    console.log('Adding custom colors to event color picker');

    // Determine the color picker menu for later use
    const colorPickerMenu = isQuickEventPicker || container.closest('[role="menu"]');

    // Get event ID based on picker type
    if (isQuickEventPicker) {
        eventId = isQuickEventPicker.getAttribute('data-eid');
    } else if (isMainEventPicker) {
        eventId = getEventIdFromUrl();
        console.log('Main event picker - extracted event ID from URL:', eventId);
    }

    var colorsPerRow = container.parentElement.getAttribute("data-colors-per-row");
    var colorRowIndex = 1;
    var colorRow = container.children[colorRowIndex];

    // Get the color order from cache
    colorOrderCache.forEach((colorName) => {
        const { hex, textColor } = customColorsCache[colorName];
        if (!hex) return; // Skip if color not found

        const div = document.createElement('div');
        div.className = 'A1wrjc kQuqUe pka1xd';
        div.tabIndex = 0;
        div.setAttribute('role', 'menuitemradio');
        div.setAttribute('aria-label', `${colorName}, custom event color`);
        div.setAttribute('data-color', hex);
        div.setAttribute('data-color-name', colorName);
        div.setAttribute('aria-checked', 'false');
        div.style.backgroundColor = hex;

        // Add checkmark icon (same structure as Google's colors)
        const checkmark = document.createElement('i');
        checkmark.className = 'google-material-icons notranslate lLCaB M8B6kc';
        checkmark.setAttribute('aria-hidden', 'true');
        checkmark.textContent = 'bigtop_done';
        div.appendChild(checkmark);

        // Add tooltip (match Google's exact structure)
        const tooltip = document.createElement('div');
        tooltip.className = 'oMnJrf';
        tooltip.setAttribute('aria-hidden', 'true');
        tooltip.setAttribute('jscontroller', 'eg8UTd');
        tooltip.setAttribute('jsaction', 'focus: eGiyHb;mouseenter: eGiyHb; touchstart: eGiyHb');
        tooltip.setAttribute('data-text', colorName);
        tooltip.setAttribute('data-tooltip-position', 'top');
        tooltip.setAttribute('data-tooltip-vertical-offset', '0');
        tooltip.setAttribute('data-tooltip-horizontal-offset', '0');
        tooltip.setAttribute('data-tooltip-only-if-necessary', 'false');
        div.appendChild(tooltip);

        // Click handling for color selection
        div.addEventListener('click', () => {
            let currentEventId = eventId;
            
            if (!currentEventId) {
                if (isQuickEventPicker) {
                    currentEventId = isQuickEventPicker.getAttribute('data-eid');
                } else if (isMainEventPicker) {
                    currentEventId = getEventIdFromUrl();
                }
            }
            
            if (!currentEventId) {
                console.log('No event ID found');
                return;
            }
            
            console.log(`Custom color clicked: ${colorName} for event ${currentEventId}`);
            
            // ALWAYS set official Google color first (so Google back-end registers it for the stripe)
            const closestOfficialHex = getClosestGoogleColor(hex); 
            setOfficialColor(currentEventId, closestOfficialHex);
            
            if (isEventEditPage()) {
                // Main picker: Set temporary color (will be committed on save)
                setTempEventColor(currentEventId, colorName);
                console.log('Main picker - set temporary color, will commit on save');
            } else {
                // Quick picker: Apply custom color immediately
                addEventColorMapping(currentEventId, colorName);
                console.log('Quick picker - applied custom color immediately');
            }
            
            // Update color picker selection visual state
            updateColorPickerSelection(colorPickerMenu, colorName);
        });

        while (colorRow.children.length >= colorsPerRow) {
            // check if a new row needs to be created 
            if (colorRowIndex == container.children.length - 1) {
                colorRow = document.createElement('div');
                colorRow.className = 'vbVGZb custom-color-injected';
                container.appendChild(colorRow);
            }
            colorRowIndex++;
            colorRow = container.children[colorRowIndex];
        }

        colorRow.appendChild(div);
    });

    // Check if current event has a custom color and update selection
    if (eventId) {
        const currentColorName = getCurrentEventColor(eventId);
        if (currentColorName) {
            updateColorPickerSelection(colorPickerMenu, currentColorName);
            
            // If we're on event edit page, also update the preview
            if (isEventEditPage()) {
                updateEventEditPreview(currentColorName);
            }
        }
    }
}

// Function to handle clicks on Google's official colors
function handleOfficialColorClick(colorElement) {
    // Try to find the color picker with data-eid first (quick picker)
    let colorPickerMenu = colorElement.closest('[data-eid]');
    let eventId = null;
    let isQuickPicker = false;
    
    if (colorPickerMenu) {
        // Quick picker case
        eventId = colorPickerMenu.getAttribute('data-eid');
        isQuickPicker = true;
    } else {
        // Main picker case - get event ID from URL
        eventId = getEventIdFromUrl();
        colorPickerMenu = colorElement.closest('[role="menu"]');
        isQuickPicker = false;
    }
    
    if (!eventId) return;
    
    if (isQuickPicker) {
        // Quick picker: remove custom color mapping immediately from database
        if (eventColorsCache[eventId]) {
            console.log(`Removed custom color mapping for event ${eventId} (quick picker)`);
            removeEventColorMapping(eventId);
        }
        
        // Also clear temp color if it's the same event
        if (tempEventId === eventId) {
            tempEventId = null;
            tempColorName = null;
            injectCustomColorCSS();
        }
    } else {
        // Main picker: clear temporary color and mark that official color was selected
        if (tempEventId === eventId) {
            tempEventId = null;
            tempColorName = null;
            injectCustomColorCSS(); // Update preview to show official color
            console.log(`Cleared temporary custom color for event ${eventId} (main picker)`);
        }
        
        // Mark that an official color was selected (will be processed on save)
        tempOfficialColorSelected = true;
        console.log(`Official color selected for event ${eventId} (main picker) - will remove custom mapping on save`);
    }
}

// Intercept DOM modifications to catch new events and color pickers
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (!(node instanceof HTMLElement)) continue;

            // Skip popup/dialog elements to prevent coloring them
            if (node.closest('.pdqVLc, .hMdQi, .nBzcnc') || 
                node.matches('.pdqVLc, .hMdQi, .nBzcnc')) {
                continue;
            }

            // Check for color picker
            const colorGrid = node.querySelector('.WQPNJc');
            if (colorGrid) {
                console.log("Event color picker detected!");
                addExtensionColors(colorGrid.parentElement);
                
                // Add click listeners to official colors
                // Look for official colors (ones without data-color-name attribute)
                const officialColors = colorGrid.parentElement.querySelectorAll('.A1wrjc:not([data-color-name])');
                officialColors.forEach(colorElement => {
                    colorElement.addEventListener('click', () => handleOfficialColorClick(colorElement));
                });
            }
        }
    }
});

// Initialize everything
function initialize() {
    // Initialize cache first
    initializeCache();
    
    // Start observing
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Observe save button for committing temp colors
    observeSaveButton();
}

// Listen for storage changes to update cache and CSS
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        let needsCSSUpdate = false;
        
        if (changes.customColors) {
            customColorsCache = changes.customColors.newValue || {};
            needsCSSUpdate = true;
        }
        if (changes.eventColors) {
            eventColorsCache = changes.eventColors.newValue || {};
            needsCSSUpdate = true;
        }
        if (changes.colorOrder) {
            colorOrderCache = changes.colorOrder.newValue || {};
            needsCSSUpdate = true;
        }
        
        if (needsCSSUpdate) {
            injectCustomColorCSS();
        }
    }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

// Handle navigation changes in single-page app
let currentUrl = window.location.href;
setInterval(() => {
    if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        
        // Clear temp variables if we're no longer on an edit page
        if (!isEventEditPage()) {
            tempEventId = null;
            tempColorName = null;
            tempOfficialColorSelected = false; 
        }
        
        console.log('URL changed, regenerating CSS');
        injectCustomColorCSS();
    }
}, 1000);