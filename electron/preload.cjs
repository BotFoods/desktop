const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Identificador para detectar ambiente Electron
  isElectron: true,
  
  // Printer APIs
  printer: {
    scanUSB: () => ipcRenderer.invoke('printer:scan-usb'),
    testPrint: (printerConfig) => ipcRenderer.invoke('printer:test-print', printerConfig),
    printReceipt: (printerConfig, receiptData) => ipcRenderer.invoke('printer:print-receipt', printerConfig, receiptData),
    print: (data) => ipcRenderer.invoke('printer:print', data)
  }
});
