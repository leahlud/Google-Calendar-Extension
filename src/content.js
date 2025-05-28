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
let injectedCSS = null;

// Initialize cache
function initializeCache() {
    chrome.storage.local.get(['customColors', 'eventColors'], (result) => {
        customColorsCache = result.customColors || {};
        eventColorsCache = result.eventColors || {};
        console.log('Cache initialized:', { customColorsCache, eventColorsCache });
        
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
                    color: ${textColor} !important;
                }
                [data-eventid="${eventId}"].GTG3wb .gVNoLb {
                    color: ${textColor} !important;
                }
                /* Resize handle - don't apply background color to preserve stripe */
                [data-eventid="${eventId}"].GTG3wb .leOeGd {
                    border-bottom-left-radius: 8px !important;
                    border-bottom-right-radius: 8px !important;
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

function addExtensionColors(container) {
    // check if already inserted to prevent double injection
    if (container.querySelector('.custom-color-injected')) return;

    chrome.storage.local.get(['customColors', 'colorOrder'], ({ customColors = {}, colorOrder = [] }) => {
        // console.log('customColors:', customColors);
        // console.log('colorOrder:', colorOrder);

        // reuse Google's row class for styling the extension's custom colors
        const colorRow = document.createElement('div');
        colorRow.className = 'vbVGZb custom-color-injected';

        colorOrder.forEach((colorName) => {
            const { hex, textColor } = customColors[colorName];

            const div = document.createElement('div');
            div.className = 'A1wrjc kQuqUe pka1xd'; // copy of built-in color icon classes
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
                const colorPickerMenu = div.closest('[data-eid]');
                
                if (colorPickerMenu) {
                    const eventId = colorPickerMenu.getAttribute('data-eid');
                    
                    // Store the mapping of eventId to color name in local storage
                    chrome.storage.local.get(['eventColors'], (result) => {
                        const eventColors = result.eventColors || {};
                        eventColors[eventId] = colorName; // 'name' is the color name from the forEach loop
                        
                        chrome.storage.local.set({ eventColors }, () => {
                            console.log(`Event ${eventId} mapped to custom color: ${colorName}`);
                            
                            // Close the color picker menu (similar to how Google's colors work)
                            const menu = div.closest('.tB5Jxf-xl07Ob-XxIAqe');
                            if (menu) {
                                menu.style.display = 'none';
                            }
                        });
                    });
                } else {
                    console.warn('Could not find event ID for color selection');
                }
            });

            colorRow.appendChild(div);
        });

        container.appendChild(colorRow);
    });
}

const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (!(node instanceof HTMLElement)) continue;

            const colorGrid = node.querySelector('.WQPNJc');
            if (colorGrid) {
                console.log("Event color picker detected!");
                addExtensionColors(colorGrid.parentElement);
            }
        }
    }
});

observer.observe(document.body, { childList: true, subtree: true });