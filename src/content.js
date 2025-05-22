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

        colorOrder.forEach((name) => {
            const { hex, textColor } = customColors[name];

            const div = document.createElement('div');
            div.className = 'A1wrjc kQuqUe pka1xd'; // copy of built-in color icon classes
            div.tabIndex = 0;
            div.setAttribute('role', 'menuitemradio');
            div.setAttribute('aria-label', `${name}, custom event color`);
            div.setAttribute('data-color', hex);
            div.style.backgroundColor = hex;


            // TODO for click handling
            // div.addEventListener('click', () => {
            // });

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