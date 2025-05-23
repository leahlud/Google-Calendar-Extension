// for debugging
console.log("Content script running on:", window.location.href);



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
            div.style.backgroundColor = hex;


            // TODO for click handling
            div.addEventListener('click', () => {
                // Find the event ID from the color picker container
                // Look for the closest color picker menu container that has data-eid
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