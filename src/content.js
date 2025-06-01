// Function to trigger Google's official color selection to ensure stripe exists
function setGoogleOfficialColor(eventId) {
    const colorPickerMenu = document.querySelector(`[data-eid="${eventId}"]`);
    if (!colorPickerMenu) {
        console.warn('Could not find color picker for event:', eventId);
        return false;
    }
    
    // Use Tomato red to ensure stripe is created
    const tomatoColorElement = colorPickerMenu.querySelector('[data-color="#D50000"]');
    
    if (tomatoColorElement) {
        tomatoColorElement.click();
        console.log(`Set event ${eventId} to official tomato color`);
        return true;
    }
    
    console.warn('Could not find tomato color option');
    return false;
}
// for debugging
console.log("Content script running on:", window.location.href);

// Cache for storing custom colors to avoid repeated storage calls
let customColorsCache = {};
let eventColorsCache = {};
let colorOrderCache = {};
let injectedCSS = null;

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
                /* All-day events - DON'T touch .o4Z98 or .pmUZFe (that's the stripe) */
                /* Only color the main content area */
                [data-eventid="${eventId}"][data-stacked-layout-chip-container] .KF4T6b,
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
            `;
        }
    });
    
    injectedCSS.textContent = cssRules;
    document.head.appendChild(injectedCSS);
    
    console.log('Injected CSS for custom event colors');
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

    // Check if this is specifically an EVENT color picker, not a calendar color picker
    // TODO: doesnt work for editing events
    const colorPickerMenu = container.closest('[data-eid]');
    if (!colorPickerMenu) {
        console.log('Skipping color injection - not an event color picker');
        return;
    }

    console.log('Adding custom colors to event color picker');

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
            const eventId = colorPickerMenu.getAttribute('data-eid');
            
            console.log(`Event ${eventId} mapped to custom color: ${colorName}`);
            
            // Set to official color first to ensure stripe exists, then apply custom color
            setGoogleOfficialColor(eventId);
            addEventColorMapping(eventId, colorName);
            
            // Update color picker selection visual state
            updateColorPickerSelection(colorPickerMenu, colorName);
            
            // Close the color picker menu
            const menu = div.closest('.tB5Jxf-xl07Ob-XxIAqe');
            if (menu) {
                menu.style.display = 'none';
            }
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
    const eventId = colorPickerMenu.getAttribute('data-eid');
    const currentColorName = eventColorsCache[eventId];
    if (currentColorName) {
        updateColorPickerSelection(colorPickerMenu, currentColorName);
    }
}

// Function to handle clicks on Google's official colors
function handleOfficialColorClick(colorElement) {
    const colorPickerMenu = colorElement.closest('[data-eid]');
    if (colorPickerMenu) {
        const eventId = colorPickerMenu.getAttribute('data-eid');
        
        // Remove custom color mapping when official color is selected
        if (eventColorsCache[eventId]) {
            console.log(`Removed custom color mapping for event ${eventId}`);
            removeEventColorMapping(eventId);
        }
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
        console.log('URL changed, regenerating CSS');
        injectCustomColorCSS();
    }
}, 1000);