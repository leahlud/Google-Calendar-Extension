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