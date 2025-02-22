const PrintPlugin = {
    print: async function(content) {
        // Check if running in mobile
        if (window.Capacitor) {
            try {
                // Convert content to HTML string
                const printContent = `
                    <html>
                        <head>
                            <style>
                                .print-container { 
                                    position: relative;
                                    background: white;
                                }
                                .text-overlay-print { 
                                    position: absolute;
                                    white-space: pre-wrap;
                                    word-wrap: break-word;
                                }
                            </style>
                        </head>
                        <body>
                            ${content}
                        </body>
                    </html>
                `;

                // Call native print dialog
                await window.Capacitor.Plugins.Printer.print({
                    content: printContent,
                    name: "Document",
                    orientation: "portrait"
                });
            } catch (err) {
                console.error('Print failed:', err);
                alert('Unable to print. Please check if you have a printer configured.');
            }
        } else {
            // Fallback for web
            const printWindow = window.open('', '_blank');
            printWindow.document.write(content);
            printWindow.document.close();
            printWindow.print();
            printWindow.close();
        }
    }
}; 