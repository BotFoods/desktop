const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Import printer libraries for main process
const escpos = require('escpos');
const USB = require('escpos-usb');
const Network = require('escpos-network');
const Serial = require('escpos-serialport');

// Configure adapters
escpos.USB = USB;
escpos.Network = Network;
escpos.Serial = Serial;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const isDev = process.env.VITE_DEV_SERVER_URL;
  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// Printer IPC handlers
ipcMain.handle('printer:scan-usb', async () => {
  try {
    const devices = escpos.USB.findPrinter();
    return devices.map(device => ({
      vendorId: device.deviceDescriptor.idVendor,
      productId: device.deviceDescriptor.idProduct,
      manufacturer: device.deviceDescriptor.iManufacturer || 'Desconhecido',
      product: device.deviceDescriptor.iProduct || 'Impressora USB'
    }));
  } catch (error) {
    console.error('Erro ao escanear USB:', error);
    return [];
  }
});

ipcMain.handle('printer:test-print', async (event, printerConfig) => {
  return new Promise((resolve, reject) => {
    try {
      // Debug: Log the received config
      console.log('=== PRINTER CONFIG DEBUG ===');
      console.log('Full config object:', JSON.stringify(printerConfig, null, 2));
      console.log('Connection type:', printerConfig?.connectionType);
      console.log('Connection type type:', typeof printerConfig?.connectionType);
      console.log('============================');
      
      if (!printerConfig || !printerConfig.connectionType) {
        reject(new Error('Configuração de impressora inválida'));
        return;
      }
      
      let device;
      
      switch (printerConfig.connectionType) {
        case 'usb':
          if (!printerConfig.vendorId || !printerConfig.productId) {
            reject(new Error('Vendor ID e Product ID são obrigatórios para conexão USB'));
            return;
          }
          device = new escpos.USB(
            parseInt(printerConfig.vendorId, 16),
            parseInt(printerConfig.productId, 16)
          );
          break;
          
        case 'network':
          if (!printerConfig.ip || !printerConfig.port) {
            reject(new Error('IP e porta são obrigatórios para conexão de rede'));
            return;
          }
          device = new escpos.Network(printerConfig.ip, parseInt(printerConfig.port));
          break;
          
        case 'serial':
          if (!printerConfig.serialPort) {
            reject(new Error('Porta serial é obrigatória para conexão serial'));
            return;
          }
          device = new escpos.Serial(printerConfig.serialPort, {
            baudRate: parseInt(printerConfig.baudRate) || 9600
          });
          break;
          
        default:
          reject(new Error(`Tipo de conexão não suportado: ${printerConfig.connectionType}`));
          return;
      }

      const printer = new escpos.Printer(device);
      
      device.open((error) => {
        if (error) {
          reject(new Error(`Erro ao conectar: ${error.message}`));
          return;
        }

        try {
          const now = new Date();
          const printerTypeName = printerConfig.type || 'Impressora';
          
          printer
            .font('a')
            .align('ct')
            .style('bu')
            .size(1, 1)
            .text('TESTE DE IMPRESSÃO')
            .text('BotFoods Desktop')
            .text('')
            .align('lt')
            .style('normal')
            .text(`Tipo: ${printerTypeName}`)
            .text(`Conexão: ${printerConfig.connectionType}`)
            .text(`Data: ${now.toLocaleDateString('pt-BR')}`)
            .text(`Hora: ${now.toLocaleTimeString('pt-BR')}`)
            .text('')
            .align('ct')
            .text('Teste realizado com sucesso!')
            .text('')
            .cut()
            .close();

          resolve('Teste de impressão enviado com sucesso');
          
        } catch (printError) {
          reject(new Error(`Erro na impressão: ${printError.message}`));
        }
      });
      
    } catch (error) {
      console.error('Error in printer:test-print:', error);
      reject(error);
    }
  });
});

ipcMain.handle('printer:print-receipt', async (event, printerConfig, receiptData) => {
  return new Promise((resolve, reject) => {
    try {
      let device;
      
      switch (printerConfig.connectionType) {
        case 'usb':
          device = new escpos.USB(
            parseInt(printerConfig.vendorId, 16),
            parseInt(printerConfig.productId, 16)
          );
          break;
          
        case 'network':
          device = new escpos.Network(printerConfig.ip, parseInt(printerConfig.port));
          break;
          
        case 'serial':
          device = new escpos.Serial(printerConfig.serialPort, {
            baudRate: parseInt(printerConfig.baudRate) || 9600
          });
          break;
          
        default:
          reject(new Error('Tipo de conexão não suportado'));
          return;
      }

      const printer = new escpos.Printer(device);
      
      device.open((error) => {
        if (error) {
          reject(new Error(`Erro ao conectar: ${error.message}`));
          return;
        }

        try {
          printer
            .font('a')
            .align('ct')
            .style('bu')
            .size(1, 1)
            .text(receiptData.title || 'BOTFOODS')
            .text('')
            .align('lt')
            .style('normal');

          // Adicionar itens
          if (receiptData.items && receiptData.items.length > 0) {
            receiptData.items.forEach(item => {
              printer
                .text(`${item.quantity}x ${item.name}`)
                .text(`   R$ ${item.price.toFixed(2)}`);
            });
            printer.text('');
          }

          // Total
          if (receiptData.total) {
            printer
              .align('rt')
              .style('bu')
              .text(`TOTAL: R$ ${receiptData.total.toFixed(2)}`);
          }

          printer
            .text('')
            .align('ct')
            .style('normal')
            .text(`Data: ${new Date().toLocaleString('pt-BR')}`)
            .text('')
            .cut()
            .close();

          resolve('Cupom impresso com sucesso');
          
        } catch (printError) {
          reject(new Error(`Erro na impressão: ${printError.message}`));
        }
      });
      
    } catch (error) {
      reject(error);
    }
  });
});

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Add a new IPC handler for direct printing
ipcMain.handle('printer:print', async (event, data) => {
  return new Promise((resolve, reject) => {
    try {
      if (!data || !data.printerConfig || !data.text) {
        reject(new Error('Dados de impressão inválidos'));
        return;
      }
      
      const { printerConfig, text } = data;
      let device;
      
      switch (printerConfig.connectionType) {
        case 'usb':
          if (!printerConfig.vendorId || !printerConfig.productId) {
            reject(new Error('Vendor ID e Product ID são obrigatórios para conexão USB'));
            return;
          }
          device = new escpos.USB(
            parseInt(printerConfig.vendorId, 16),
            parseInt(printerConfig.productId, 16)
          );
          break;
          
        case 'network':
          if (!printerConfig.ip || !printerConfig.port) {
            reject(new Error('IP e porta são obrigatórios para conexão de rede'));
            return;
          }
          device = new escpos.Network(printerConfig.ip, parseInt(printerConfig.port));
          break;
          
        case 'serial':
          if (!printerConfig.serialPort) {
            reject(new Error('Porta serial é obrigatória para conexão serial'));
            return;
          }
          device = new escpos.Serial(printerConfig.serialPort, {
            baudRate: parseInt(printerConfig.baudRate) || 9600
          });
          break;
          
        default:
          reject(new Error(`Tipo de conexão não suportado: ${printerConfig.connectionType}`));
          return;
      }

      const printer = new escpos.Printer(device);
      
      device.open((error) => {
        if (error) {
          reject(new Error(`Erro ao conectar: ${error.message}`));
          return;
        }

        try {
          // Imprimir o texto formatado
          printer
            .font('a')
            .align('lt')
            .style('normal')
            .size(0, 0);
            
          // Dividir o texto por linhas e imprimir cada linha
          const lines = text.split('\n');
          lines.forEach(line => {
            if (line.trim().length > 0) {
              printer.text(line);
            } else {
              printer.text(' ');  // linha vazia
            }
          });
          
          // Finalizar a impressão
          printer
            .cut()
            .close();

          resolve({ success: true, message: 'Impressão realizada com sucesso' });
          
        } catch (printError) {
          reject(new Error(`Erro na impressão: ${printError.message}`));
        }
      });
      
    } catch (error) {
      reject(error);
    }
  });
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
