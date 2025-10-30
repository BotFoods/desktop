const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');

// Ocultar console em produção (Windows)
if (process.platform === 'win32' && process.env.NODE_ENV === 'production') {
  // Redirecionar stdout e stderr para evitar console
  // process.stdout.write = () => {};
  // process.stderr.write = () => {};
}

// Função para aguardar o Vite dev server estar pronto
async function waitForVite(url, maxRetries = 30) {
  const http = require('http');
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await new Promise((resolve, reject) => {
        http.get(url, (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            reject(new Error(`Status: ${res.statusCode}`));
          }
        }).on('error', reject);
      });
      
      return true;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return false;
}

async function createWindow() {
  // Remove o menu principal
  Menu.setApplicationMenu(null);
  
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../public/botfood-icon.png'), // Ícone do BotFood
    show: false, // Não mostrar até estar pronto
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true, // DevTools habilitado para depuração
    },
  });

  // Mostrar a janela quando estiver pronta para evitar flash
  win.once('ready-to-show', () => {
    win.show();
    // Focar na janela
    win.focus();
  });

  const isDev = process.env.VITE_DEV_SERVER_URL;
  if (isDev) {
    // Aguardar o Vite dev server estar pronto antes de tentar carregar
    const isReady = await waitForVite(process.env.VITE_DEV_SERVER_URL);
    
    if (isReady) {
      win.loadURL(process.env.VITE_DEV_SERVER_URL);
      win.webContents.openDevTools();
    } else {
      // Tentar carregar mesmo assim
      win.loadURL(process.env.VITE_DEV_SERVER_URL);
      win.webContents.openDevTools();
    }
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
    win.webContents.openDevTools();
  }
}

// Printer IPC handlers - Delegados ao BotFood Service
ipcMain.handle('printer:scan-usb', async () => {
  return { error: 'Use o BotFood Service (porta 3000) para impressão', deprecated: true };
});

ipcMain.handle('printer:test-print', async () => {
  return { error: 'Use o BotFood Service (porta 3000) para impressão', deprecated: true };
});

ipcMain.handle('printer:print-receipt', async () => {
  return { error: 'Use o BotFood Service (porta 3000) para impressão', deprecated: true };
});

ipcMain.handle('printer:print', async () => {
  return { error: 'Use o BotFood Service (porta 3000) para impressão', deprecated: true };
});

// Variável para controlar o processo do service
let serviceProcess = null;

// Função para iniciar o BotFood Service
function startBotFoodService() {
  try {
    // Verificar se é desenvolvimento pela presença do VITE_DEV_SERVER_URL
    const isDev = process.env.VITE_DEV_SERVER_URL || process.env.NODE_ENV === 'development';
    
    if (isDev) {
      // Em desenvolvimento, não inicia o service (assume que está rodando separadamente)
      return;
    }

    // Em produção, tenta iniciar o service
    const servicePath = path.join(process.resourcesPath, 'service', 'botfood-service.exe');
    
    // Verificar se já existe um processo do service rodando
    exec('tasklist /FI "IMAGENAME eq botfood-service.exe"', (error, stdout, stderr) => {
      if (stdout.includes('botfood-service.exe')) {
        return;
      }
      
      // Iniciar o service
      serviceProcess = spawn(servicePath, [], {
        detached: true,
        stdio: 'ignore'
      });
      
      // Permitir que o processo continue rodando independentemente
      serviceProcess.unref();
    });
    
  } catch (error) {
    console.error('Erro ao iniciar service:', error.message);
  }
}

app.on('ready', async () => {
  await createWindow();
  startBotFoodService();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
