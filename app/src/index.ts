// const { app, BrowserWindow } = require('electron');
// const path = require('path');

import {app, BrowserWindow, ipcMain, Menu, dialog, Event, IpcMainEvent} from 'electron';
import { createReadStream, writeFileSync } from 'original-fs';
import * as path from 'path';
import { BatchResize, ResizeData } from './Batch';

const _debug = false;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

const createURPWindow = () => {

  const _window = new BrowserWindow({
    width: 262,
    height: 273,
    'useContentSize': true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  ipcMain.addListener("HDRP_WINDOW", ev => {
    ipcMain.removeAllListeners("SAVE_IMAGE");
    createMainWindow();
    _window.close();
  });

  ipcMain.addListener("SAVE_IMAGE", (ev, data) => {
    
    const buffer = Buffer.from(data);

    dialog.showSaveDialog(_window, {
      'filters': [
        {
          'name': 'PNG Image',
          'extensions': ['png']
        }
      ]
    })
      .then((res) => {

        if (res.canceled) return;

        writeFileSync(res.filePath, buffer, 'binary');

        ev.sender.send("RELOAD");

      })
      .catch(console.error);

  });

  _window.on('close', () => {
    ipcMain.removeAllListeners("HDRP_WINDOW");
    
  });

  _window.loadFile(path.join(__dirname, "urp.html"));
  if (_debug) _window.webContents.openDevTools();

}

const createMainWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  ipcMain.addListener("URP_WINDOW", ev => {
    ipcMain.removeAllListeners("SAVE_IMAGE");
    createURPWindow();
    mainWindow.close();
  });

  ipcMain.addListener("SAVE_IMAGE", (ev, data) => {
    
    const buffer = Buffer.from(data);

    dialog.showSaveDialog(mainWindow, {
      'filters': [
        {
          'name': 'PNG Image',
          'extensions': ['png']
        }
      ]
    })
      .then((res) => {

        if (res.canceled) return;

        writeFileSync(res.filePath, buffer, 'binary');

        ev.sender.send("RELOAD");

      })
      .catch(console.error);

  });

  mainWindow.on('close', () => {
    ipcMain.removeAllListeners("URP_WINDOW");
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  if (_debug) mainWindow.webContents.openDevTools();
};

const createResizeWindow = (parent:BrowserWindow) => {

  const resizeWin = new BrowserWindow({
    width: 320,
    height: 372,
    useContentSize: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    parent: parent,
    modal: true,
    maximizable: false,
    minimizable: false
  });

  ipcMain.addListener("SELECT_FOLDER", (ev) => {

    dialog.showOpenDialog(resizeWin, {
      title: "Select Folder",
      properties: ["openDirectory"]
    })
      .then(res => {
        if (res.canceled) return;

        ev.sender.send("SELECT_FOLDER", res.filePaths[0]);

      })
      .catch(console.error);

  });

  ipcMain.addListener("BATCH_RESIZE", (ev, data:ResizeData) => {

    BatchResize(data, (done, total) => {

      ev.sender.send("UPDATE_PROGRESS", [done, total]);

    })
      .then(() => {
        resizeWin.close();
      })
      .catch(console.error);

  });

  resizeWin.on('close', () => {
    ipcMain.removeAllListeners("SELECT_FOLDER");
    ipcMain.removeAllListeners("BATCH_RESIZE");
  });

  resizeWin.setMenu(Menu.buildFromTemplate([]));

  resizeWin.loadFile(path.join(__dirname, 'batchResize.html'));
  if (_debug) resizeWin.webContents.openDevTools();

}

const createFlipNormalsWindow = (parent:BrowserWindow) => {

  const flipWin = new BrowserWindow({
    width: 320,
    height: 123,
    useContentSize: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    parent: parent,
    modal: true,
    maximizable: false,
    minimizable: false
  });

  ipcMain.addListener("SAVE_FIMAGES", (ev, data:{path:string;buffer:Uint8Array}[]) => {

    for (let i = 0; i < data.length; i++) {

      const file = data[i];
      const buffer = Buffer.from(file.buffer);

      writeFileSync(file.path, buffer, 'binary');
      ev.sender.send("UPDATE_PROGRESS", i+1);

    }

    setTimeout(() => {
      flipWin.close();
    }, 500);

  });

  flipWin.on('close', () => {
    ipcMain.removeAllListeners("SAVE_FIMAGES");
  });

  flipWin.setMenu(Menu.buildFromTemplate([]));

  flipWin.loadFile(path.join(__dirname, 'batchFlipNormals.html'));
  if (_debug) flipWin.webContents.openDevTools();

}


app.applicationMenu = Menu.buildFromTemplate([
  {
    'label': 'Tools',
    'submenu': [
      {
        'label': "Batch Resize",
        'click': (item, window, ev) => {
          createResizeWindow(window);
        }
      },
      {
        'label': "Flip Normals",
        'click': (item, window, ev) => {
          createFlipNormalsWindow(window);
        }
      }
    ]
  }
]);


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createMainWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
