document.getElementById('uploadButton').addEventListener('click', function() {
    document.getElementById('imageInput').click();
});

document.getElementById('imageInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = document.getElementById('uploadedImage');
            img.src = event.target.result;
            img.style.display = 'block';
            
            // Clear existing text boxes
            document.getElementById('editableLayer').innerHTML = '';
            
            // Adjust image and container to A4 size
            img.onload = function() {
                const container = document.getElementById('imageContainer');
                const editableLayer = document.getElementById('editableLayer');
                
                // Set container to A4 dimensions
                container.style.width = A4_WIDTH + 'px';
                container.style.height = A4_HEIGHT + 'px';
                
                // Scale image to fit A4 while maintaining aspect ratio
                const imgAspectRatio = img.naturalWidth / img.naturalHeight;
                const a4AspectRatio = A4_WIDTH / A4_HEIGHT;
                
                if (imgAspectRatio > a4AspectRatio) {
                    // Image is wider than A4
                    img.style.width = A4_WIDTH + 'px';
                    img.style.height = 'auto';
                    img.style.marginTop = '0';
                } else {
                    // Image is taller than A4
                    img.style.height = A4_HEIGHT + 'px';
                    img.style.width = 'auto';
                    img.style.marginLeft = '0';
                }
                
                // Center the image
                img.style.position = 'absolute';
                img.style.left = '50%';
                img.style.top = '50%';
                img.style.transform = 'translate(-50%, -50%)';
                
                // Set editable layer to A4 size
                editableLayer.style.width = A4_WIDTH + 'px';
                editableLayer.style.height = A4_HEIGHT + 'px';
            };
        };
        reader.readAsDataURL(file);
    }
});

let currentRotation = 0;
let flipHorizontal = 1;
let flipVertical = 1;
let dragTarget = null;
let dragOffset = { x: 0, y: 0 };
let textBoxCounter = 0;
const MIN_SPACING = 10; // Minimum space between text boxes

// Add these constants at the top
const A4_WIDTH = 794; // A4 width in pixels (roughly 210mm at 96dpi)
const A4_HEIGHT = 1123; // A4 height in pixels (roughly 297mm at 96dpi)

function rotateImage(degrees) {
    const img = document.getElementById('uploadedImage');
    currentRotation = (currentRotation + degrees) % 360;
    
    const container = document.getElementById('imageContainer');
    const editableLayer = document.getElementById('editableLayer');
    
    // Apply transformations
    const transform = `rotate(${currentRotation}deg) scale(${flipHorizontal}, ${flipVertical})`;
    img.style.transform = transform;
    editableLayer.style.transform = transform;
    
    // Adjust container dimensions for rotation
    if (currentRotation % 180 === 90 || currentRotation % 180 === -90) {
        container.style.width = img.naturalHeight + 'px';
        container.style.height = img.naturalWidth + 'px';
        editableLayer.style.width = img.naturalHeight + 'px';
        editableLayer.style.height = img.naturalWidth + 'px';
    } else {
        container.style.width = img.naturalWidth + 'px';
        container.style.height = img.naturalHeight + 'px';
        editableLayer.style.width = img.naturalWidth + 'px';
        editableLayer.style.height = img.naturalHeight + 'px';
    }
}

function flipImage(direction) {
    const img = document.getElementById('uploadedImage');
    const editableLayer = document.getElementById('editableLayer');
    
    if (direction === 'horizontal') {
        flipHorizontal *= -1;
    } else if (direction === 'vertical') {
        flipVertical *= -1;
    }
    
    const transform = `rotate(${currentRotation}deg) scale(${flipHorizontal}, ${flipVertical})`;
    img.style.transform = transform;
    editableLayer.style.transform = transform;
}

// Add these constants at the top
const FONT_OPTIONS = [
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' },
    { name: 'Courier New', value: 'Courier New, monospace' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
    { name: 'Helvetica', value: 'Helvetica, sans-serif' },
    { name: 'Tahoma', value: 'Tahoma, sans-serif' }
];

// Keep only simple toolbar creation
function createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';
    toolbar.innerHTML = `
        <button onclick="addTextBox()">Add Text</button>
        <button onclick="printDocument()">Print</button>
    `;
    return toolbar;
}

// Update the initialization to ensure floating editor is created
document.addEventListener('DOMContentLoaded', function() {
    document.body.appendChild(createToolbar());
    createFloatingEditor();
});

// Add these new functions
function selectAllText() {
    const activeElement = document.activeElement;
    if (activeElement && activeElement.classList.contains('text-overlay')) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(activeElement);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

function shareText() {
    const activeElement = document.activeElement;
    if (!activeElement || !activeElement.classList.contains('text-overlay')) return;

    const textContent = activeElement.textContent;
    
    if (navigator.share) {
        navigator.share({
            title: 'Notepad Text',
            text: textContent
        }).catch(err => console.error('Share failed:', err));
    } else {
        navigator.clipboard.writeText(textContent)
            .then(() => alert('Text copied to clipboard!'))
            .catch(err => console.error('Copy failed:', err));
    }
}

// Update the print function to use the correct text styles
function printDocument() {
    // Create preview container
    const previewContainer = document.createElement('div');
    previewContainer.className = 'print-preview-container';
    
    // Get the image container dimensions
    const imageContainer = document.getElementById('imageContainer');
    const containerRect = imageContainer.getBoundingClientRect();
    
    // Create print content
    const printContent = `
        <div class="print-container">
            ${Array.from(document.querySelectorAll('.text-overlay')).map(box => {
                const textContent = box.querySelector('.text-content');
                if (!textContent || textContent.textContent === 'Enter text') return '';
                
                const boxRect = box.getBoundingClientRect();
                const left = boxRect.left - containerRect.left;
                const top = boxRect.top - containerRect.top;
                
                const text = textContent.textContent.trim();
                const styles = window.getComputedStyle(textContent);
                
                return `
                    <div class="text-overlay-print" style="
                        position: absolute;
                        left: ${left}px;
                        top: ${top}px;
                        color: ${styles.color};
                        font-size: ${styles.fontSize};
                        font-family: ${styles.fontFamily};
                        transform: ${styles.transform};
                        width: ${boxRect.width}px;
                        min-height: ${boxRect.height}px;
                        padding: ${styles.padding};
                        line-height: ${styles.lineHeight};
                        text-align: ${styles.textAlign};
                    ">${text}</div>
                `;
            }).join('')}
        </div>
    `;

    // Create preview dialog with footer
    previewContainer.innerHTML = `
        <div class="print-preview-header">
            <h3>Print Preview</h3>
            <div class="print-preview-buttons">
                ${window.Capacitor ? `
                    <button class="print-btn android-print">Android Print</button>
                    <button class="print-btn web-print">Web Print</button>
                ` : `
                    <button class="print-btn web-print">Print</button>
                `}
                <button class="close-btn">Close</button>
            </div>
        </div>
        <div class="print-preview-content">
            ${printContent}
        </div>
        <div class="print-preview-footer">
            <button class="print-btn pdf-print">
                <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSJ3aGl0ZSIgZD0iTTYgMkMyLjY5IDIgMCA0LjY5IDAgOHY4YzAgMy4zMSAyLjY5IDYgNiA2aDEyYzMuMzEgMCA2LTIuNjkgNi02VjhjMC0zLjMxLTIuNjktNi02LTZINnptNyA3djNIN3YyaDZ2M2w0LTR6Ii8+PC9zdmc+" alt="PDF" style="width: 20px; height: 20px; margin-right: 8px;">
                Save as PDF
            </button>
        </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .print-preview-container {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            z-index: 10000;
        }
        .print-preview-header {
            background: white;
            padding: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .print-preview-buttons {
            display: flex;
            gap: 10px;
        }
        .print-btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .android-print {
            background: #4CAF50;
        }
        .web-print {
            background: #2196F3;
        }
        .pdf-print {
            background: #FF5722;
            margin: 10px;
        }
        .close-btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            background: #ddd;
            cursor: pointer;
        }
        .print-preview-content {
            flex: 1;
            padding: 20px;
            background: #f0f0f0;
            overflow: auto;
            display: flex;
            justify-content: center;
        }
        .print-preview-footer {
            background: white;
            padding: 10px;
            display: flex;
            justify-content: center;
            border-top: 1px solid #ddd;
        }
        .print-container {
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            position: relative;
            width: ${imageContainer.offsetWidth}px;
            height: ${imageContainer.offsetHeight}px;
        }
        .text-overlay-print {
            position: absolute;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(previewContainer);

    // Add button handlers
    if (window.Capacitor) {
        previewContainer.querySelector('.android-print').addEventListener('click', () => {
            PrintPlugin.print(printContent);
            document.body.removeChild(previewContainer);
        });
    }

    previewContainer.querySelector('.web-print').addEventListener('click', () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html><head><style>${style.textContent}</style></head>
            <body><div class="print-container">${printContent}</div></body></html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
        document.body.removeChild(previewContainer);
    });

    previewContainer.querySelector('.pdf-print').addEventListener('click', () => {
        const element = document.createElement('div');
        element.innerHTML = printContent;
        
        // Get container dimensions
        const container = document.getElementById('imageContainer');
        const width = container.offsetWidth;
        const height = container.offsetHeight;

        // Calculate PDF dimensions to match container aspect ratio
        const pdfWidth = 210; // A4 width in mm
        const pdfHeight = (height * pdfWidth) / width;

        html2pdf()
            .set({
                margin: 0,
                filename: 'document.pdf',
                image: { type: 'jpeg', quality: 1 },
                html2canvas: {
                    scale: 4, // Higher scale for better quality
                    useCORS: true,
                    logging: true,
                    letterRendering: true,
                    width: width,
                    height: height,
                    windowWidth: width,
                    windowHeight: height
                },
                jsPDF: {
                    unit: 'mm',
                    format: [pdfWidth, pdfHeight],
                    orientation: 'portrait',
                    precision: 16
                }
            })
            .from(element)
            .save()
            .then(() => {
                document.body.removeChild(previewContainer);
            })
            .catch(err => {
                console.error('PDF generation failed:', err);
                alert('Failed to generate PDF. Please try again.');
            });
    });

    previewContainer.querySelector('.close-btn').addEventListener('click', () => {
        document.body.removeChild(previewContainer);
    });
}

// Update font size options with both px and pt values for clarity
function updateFontSizeOptions() {
    const fontSize = document.getElementById('fontSize');
    fontSize.innerHTML = `
        <option value="12px">12px (9pt)</option>
        <option value="14px">14px (10.5pt)</option>
        <option value="16px">16px (12pt)</option>
        <option value="18px">18px (13.5pt)</option>
        <option value="20px">20px (15pt)</option>
        <option value="24px">24px (18pt)</option>
        <option value="28px">28px (21pt)</option>
        <option value="32px">32px (24pt)</option>
        <option value="36px">36px (27pt)</option>
        <option value="48px">48px (36pt)</option>
        <option value="64px">64px (48pt)</option>
    `;
}

// Update font family options
function updateFontFamilyOptions() {
    const fontName = document.getElementById('fontName');
    fontName.innerHTML = FONT_OPTIONS.map(font => 
        `<option value="${font.value}">${font.name}</option>`
    ).join('');
}

// Initialize controls with better accessibility
document.addEventListener('DOMContentLoaded', function() {
    updateFontFamilyOptions();
    
    // Initialize font size display
    document.getElementById('fontSizeDisplay').textContent = 
        document.getElementById('fontSize').value + 'px';
    
    // Add event listeners for text formatting
    document.getElementById('fontSize').addEventListener('input', updateFontSize);
    document.getElementById('textColor').addEventListener('change', updateTextColor);
    document.getElementById('fontName').addEventListener('change', updateFontFamily);
});

function execCommand(command, value = null) {
    document.execCommand(command, false, value);
    updateToolbarState();
}

function updateToolbarState() {
    const commands = ['bold', 'italic', 'underline', 'justifyLeft', 'justifyCenter', 'justifyRight'];
    commands.forEach(command => {
        const state = document.queryCommandState(command);
        const button = document.querySelector(`button[onclick="execCommand('${command}')"]`);
        if (button) {
            button.classList.toggle('active', state);
        }
    });
}

let activeTextBox = null;

function addTextBox() {
    // Create main container
    const textBox = document.createElement('div');
    textBox.className = 'text-overlay';
    textBox.dataset.mode = 'edit';
    textBox.contentEditable = false; // Main container not editable

    // Create text content div
    const textContent = document.createElement('div');
    textContent.className = 'text-content';
    textContent.contentEditable = true; // Only text content is editable
    textContent.textContent = 'Enter text';
    textContent.classList.add('placeholder');
    
    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '×';
    deleteBtn.className = 'delete-btn';
    deleteBtn.title = 'Delete text';

    // Set initial position
    const container = document.getElementById('imageContainer');
    textBox.style.left = (container.offsetWidth / 2 - 50) + 'px';
    textBox.style.top = (container.offsetHeight / 2 - 10) + 'px';

    // Variables for interactions
    let isDragging = false;
    let startX, startY;
    let initialLeft, initialTop;
    let lastTap = 0;
    let longPressTimer;

    // Long press for select all (edit mode only)
    textContent.addEventListener('touchstart', function(e) {
        if (textBox.dataset.mode === 'edit') {
            longPressTimer = setTimeout(() => {
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(textContent);
                selection.removeAllRanges();
                selection.addRange(range);
            }, 500);
        }
    });

    textContent.addEventListener('touchend', function() {
        clearTimeout(longPressTimer);
    });

    textContent.addEventListener('touchmove', function() {
        clearTimeout(longPressTimer);
    });

    // Double tap/click for mode switching
    textBox.addEventListener('dblclick', function(e) {
        e.preventDefault();
        toggleMode();
    });

    // Mouse movement handlers
    textBox.addEventListener('mousedown', function(e) {
        if (textBox.dataset.mode === 'move') {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = parseInt(textBox.style.left) || 0;
            initialTop = parseInt(textBox.style.top) || 0;
            e.preventDefault();
        }
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging || textBox.dataset.mode !== 'move') return;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        textBox.style.left = (initialLeft + deltaX) + 'px';
        textBox.style.top = (initialTop + deltaY) + 'px';
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
    });

    // Touch handlers for movement
    textBox.addEventListener('touchstart', function(e) {
        const now = Date.now();
        if (now - lastTap < 300) {
            toggleMode();
            e.preventDefault();
        }
        lastTap = now;

        if (textBox.dataset.mode === 'move') {
            isDragging = true;
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            initialLeft = parseInt(textBox.style.left) || 0;
            initialTop = parseInt(textBox.style.top) || 0;
        }
    });

    textBox.addEventListener('touchmove', function(e) {
        if (!isDragging || textBox.dataset.mode !== 'move') return;
        const touch = e.touches[0];
        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;
        textBox.style.left = (initialLeft + deltaX) + 'px';
        textBox.style.top = (initialTop + deltaY) + 'px';
        e.preventDefault();
    });

    textBox.addEventListener('touchend', function() {
        isDragging = false;
    });

    // Delete button handler
    deleteBtn.addEventListener('click', function(e) {
        if (textBox.dataset.mode === 'move') {
            textBox.remove();
        }
        e.stopPropagation();
    });

    // Handle placeholder text
    textContent.addEventListener('input', function() {
        if (this.classList.contains('placeholder') && 
            this.textContent !== 'Enter text') {
            this.classList.remove('placeholder');
            this.textContent = this.textContent.replace('Enter text', '');
        }
    });

    // Mode switching function
    function toggleMode() {
        if (textBox.dataset.mode === 'edit') {
            // Switch to move mode
            textBox.dataset.mode = 'move';
            textContent.contentEditable = false;
            textBox.classList.add('move-mode');
        } else {
            // Switch to edit mode
            textBox.dataset.mode = 'edit';
            textContent.contentEditable = true;
            textBox.classList.remove('move-mode');
            textContent.focus();
        }
    }

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .text-overlay {
            position: absolute;
            min-width: 50px;
            min-height: 20px;
            padding: 5px;
            border: 1px solid transparent;
            user-select: none;
        }
        .text-content {
            width: 100%;
            min-height: 20px;
            outline: none;
            user-select: text;
            cursor: text;
        }
        .text-overlay.move-mode {
            border: 2px dashed #2196F3;
            cursor: move;
        }
        .text-overlay.move-mode .text-content {
            cursor: move;
            user-select: none;
        }
        .placeholder {
            color: #999;
        }
        .delete-btn {
            position: absolute;
            right: -10px;
            top: -10px;
            width: 20px;
            height: 20px;
            background: red;
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            padding: 0;
            line-height: 1;
            z-index: 1000;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s;
        }
        .text-overlay.move-mode .delete-btn {
            opacity: 1;
            pointer-events: auto;
        }
    `;
    document.head.appendChild(style);

    // Assemble the text box
    textBox.appendChild(textContent);
    textBox.appendChild(deleteBtn);
    document.getElementById('editableLayer').appendChild(textBox);
    textContent.focus();

    // Update focus handler
    textContent.addEventListener('focus', function() {
        activeTextBox = textBox;
        // Update floating editor controls to match current text settings
        const fontSelect = document.getElementById('fontSelect');
        const fontSize = document.getElementById('fontSize');
        const fontColor = document.getElementById('fontColor');
        
        if (fontSelect) fontSelect.value = this.style.fontFamily || 'Arial';
        if (fontSize) fontSize.value = parseInt(this.style.fontSize) || 16;
        if (fontColor) fontColor.value = rgbToHex(this.style.color || '#000000');
    });
}

// Add this CSS
const style = document.createElement('style');
style.textContent = `
    .text-overlay.placeholder {
        color: #999;
    }
    .context-menu {
        position: fixed;
        background: white;
        border: 1px solid #ccc;
        border-radius: 5px;
        padding: 5px;
        box-shadow: 2px 2px 5px rgba(0,0,0,0.2);
        z-index: 1000;
    }
    .context-menu button {
        display: block;
        width: 100%;
        padding: 8px;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
    }
    .context-menu button:hover {
        background: #f0f0f0;
    }
`;
document.head.appendChild(style);

// Helper function to show context menu
function showContextMenu(textBox, x, y) {
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `
        <button id="selectAll">Select All</button>
        <button id="copy">Copy</button>
        <button id="cut">Cut</button>
        <button id="paste">Paste</button>
    `;
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    
    document.body.appendChild(menu);
    
    // Handle menu item clicks
    menu.addEventListener('click', function(e) {
        const action = e.target.id;
        switch(action) {
            case 'selectAll':
                const range = document.createRange();
                range.selectNodeContents(textBox);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
                break;
            case 'copy':
                document.execCommand('copy');
                break;
            case 'cut':
                document.execCommand('cut');
                break;
            case 'paste':
                document.execCommand('paste');
                break;
        }
        document.body.removeChild(menu);
    });
    
    // Remove menu when clicking outside
    document.addEventListener('click', function removeMenu(e) {
        if (!menu.contains(e.target)) {
            document.body.removeChild(menu);
            document.removeEventListener('click', removeMenu);
        }
    });
}

// Helper function to update toolbar with text box settings
function updateToolbarWithTextBoxSettings(textBox) {
    if (!textBox.classList.contains('placeholder')) {
        const fontSize = parseInt(textBox.style.fontSize);
        document.getElementById('fontSize').value = fontSize || 16;
        document.getElementById('fontSizeDisplay').textContent = (fontSize || 16) + 'px';
        document.getElementById('textColor').value = rgbToHex(textBox.style.color || '#000000');
        document.getElementById('fontName').value = textBox.style.fontFamily.split(',')[0].replace(/['"]/g, '') || 'Arial';
    }
}

// Check contrast ratio for accessibility
function hasGoodContrast(color) {
    const rgb = color.match(/\d+/g);
    if (!rgb) return true;
    
    const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
    return luminance > 0.5 ? true : false;
}

function makeTextBold() {
    const activeElement = document.activeElement;
    if (activeElement.classList.contains('text-overlay')) {
        if (activeElement.style.fontWeight === 'bold') {
            activeElement.style.fontWeight = 'normal';
        } else {
            activeElement.style.fontWeight = 'bold';
        }
    }
}

function makeTextItalic() {
    const activeElement = document.activeElement;
    if (activeElement.classList.contains('text-overlay')) {
        if (activeElement.style.fontStyle === 'italic') {
            activeElement.style.fontStyle = 'normal';
        } else {
            activeElement.style.fontStyle = 'italic';
        }
    }
}

function findOpenSpace(newTextBox, container) {
    const existingBoxes = Array.from(document.querySelectorAll('.text-overlay'));
    const containerRect = container.getBoundingClientRect();
    const boxWidth = newTextBox.offsetWidth;
    const boxHeight = newTextBox.offsetHeight;
    
    // Grid system for positioning
    const gridSize = 50;
    const cols = Math.floor(containerRect.width / gridSize);
    const rows = Math.floor(containerRect.height / gridSize);
    
    // Try each grid position
    for(let row = 0; row < rows; row++) {
        for(let col = 0; col < cols; col++) {
            const x = col * gridSize;
            const y = row * gridSize;
            
            // Check if this position overlaps with existing boxes
            const hasOverlap = existingBoxes.some(box => {
                if(box === newTextBox) return false;
                
                const boxRect = box.getBoundingClientRect();
                const boxLeft = parseInt(box.style.left) || 0;
                const boxTop = parseInt(box.style.top) || 0;
                
                return !(x + boxWidth + MIN_SPACING < boxLeft ||
                        x > boxLeft + boxRect.width + MIN_SPACING ||
                        y + boxHeight + MIN_SPACING < boxTop ||
                        y > boxTop + boxRect.height + MIN_SPACING);
            });
            
            if(!hasOverlap) {
                return { x, y };
            }
        }
    }
    
    // If no space found, offset from last box
    const lastBox = existingBoxes[existingBoxes.length - 1];
    if(lastBox && lastBox !== newTextBox) {
        const lastX = parseInt(lastBox.style.left) || 0;
        const lastY = parseInt(lastBox.style.top) || 0;
        return {
            x: (lastX + 20) % (containerRect.width - boxWidth),
            y: lastY + ((lastX + 20 > containerRect.width - boxWidth) ? 20 : 0)
        };
    }
    
    // Default position if no other boxes exist
    return { x: 50, y: 50 };
}

// Add event listeners for text formatting
document.getElementById('textColor').addEventListener('change', function(e) {
    const activeElement = document.activeElement;
    if (activeElement.classList.contains('text-overlay')) {
        activeElement.style.color = e.target.value;
    }
});

document.getElementById('fontName').addEventListener('change', function(e) {
    const activeElement = document.activeElement;
    if (activeElement.classList.contains('text-overlay')) {
        activeElement.style.fontFamily = e.target.value;
    }
});

// Add this function to create and manage the floating editor
function createFloatingEditor() {
    const editor = document.createElement('div');
    editor.className = 'floating-editor';
    editor.innerHTML = `
        <div class="editor-toggle">⚙️</div>
        <div class="editor-content">
            <div class="editor-section">
                <label>Font</label>
                <select id="fontSelect" class="editor-control">
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                </select>
            </div>
            <div class="editor-section">
                <label>Size</label>
                <input type="range" id="fontSize" min="8" max="72" value="16">
                <span id="fontSizeDisplay">16px</span>
            </div>
            <div class="editor-section">
                <label>Color</label>
                <input type="color" id="fontColor" value="#000000">
            </div>
        </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .floating-editor {
            position: fixed;
            right: -200px;
            top: 50%;
            transform: translateY(-50%);
            width: 200px;
            background: white;
            border-radius: 10px 0 0 10px;
            box-shadow: -2px 0 10px rgba(0,0,0,0.1);
            transition: right 0.3s;
            z-index: 1000;
        }
        .floating-editor.open {
            right: 0;
        }
        .editor-toggle {
            position: absolute;
            left: -40px;
            top: 50%;
            transform: translateY(-50%);
            width: 40px;
            height: 40px;
            background: white;
            border-radius: 10px 0 0 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: -2px 0 10px rgba(0,0,0,0.1);
            font-size: 20px;
        }
        .editor-content {
            padding: 15px;
            max-height: 80vh;
            overflow-y: auto;
        }
        .editor-section {
            margin-bottom: 15px;
        }
        .editor-control {
            width: 100%;
            margin-top: 5px;
            padding: 5px;
        }
        .text-overlay.move-mode {
            border: 2px dashed #2196F3;
            cursor: move;
        }
    `;
    document.head.appendChild(style);

    // Add toggle functionality
    const toggle = editor.querySelector('.editor-toggle');
    toggle.addEventListener('click', () => {
        editor.classList.toggle('open');
    });

    // Add event listeners for controls
    const fontSelect = editor.querySelector('#fontSelect');
    const fontSize = editor.querySelector('#fontSize');
    const fontColor = editor.querySelector('#fontColor');
    const fontSizeDisplay = editor.querySelector('#fontSizeDisplay');

    fontSelect.addEventListener('change', (e) => {
        if (activeTextBox) {
            const textContent = activeTextBox.querySelector('.text-content');
            if (textContent) {
                textContent.style.fontFamily = e.target.value;
            }
        }
    });

    fontSize.addEventListener('input', (e) => {
        fontSizeDisplay.textContent = e.target.value + 'px';
        if (activeTextBox) {
            const textContent = activeTextBox.querySelector('.text-content');
            if (textContent) {
                textContent.style.fontSize = e.target.value + 'px';
            }
        }
    });

    fontColor.addEventListener('change', (e) => {
        if (activeTextBox) {
            const textContent = activeTextBox.querySelector('.text-content');
            if (textContent) {
                textContent.style.color = e.target.value;
            }
        }
    });

    document.body.appendChild(editor);
}

// Add these helper functions
function rgbToHex(rgb) {
    // If already hex, return it
    if (rgb.startsWith('#')) return rgb;
    
    // Convert rgb(r, g, b) to hex
    const rgbArray = rgb.match(/\d+/g);
    if (!rgbArray) return '#000000';
    
    const r = parseInt(rgbArray[0]);
    const g = parseInt(rgbArray[1]);
    const b = parseInt(rgbArray[2]);
    
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Add these new functions to handle text formatting
function updateFontSize(e) {
    const size = e.target.value;
    document.getElementById('fontSizeDisplay').textContent = size + 'px';
    
    const activeElement = document.activeElement;
    if (activeElement && activeElement.classList.contains('text-overlay')) {
        activeElement.style.fontSize = size + 'px';
    }
}

function updateTextColor(e) {
    const activeElement = document.activeElement;
    if (activeElement && activeElement.classList.contains('text-overlay')) {
        activeElement.style.color = e.target.value;
    }
}

function updateFontFamily(e) {
    const activeElement = document.activeElement;
    if (activeElement && activeElement.classList.contains('text-overlay')) {
        activeElement.style.fontFamily = e.target.value;
    }
} 