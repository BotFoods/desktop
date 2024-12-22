const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Expose APIs as needed
});
