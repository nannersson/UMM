// const { app, BrowserWindow } = require('electron');
// const path = require('path');

import {app, BrowserWindow, ipcMain, Menu, dialog} from 'electron';
import { writeFileSync } from 'original-fs';
import * as path from 'path';

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
    createMainWindow();
    _window.close();
  });

  _window.on('close', () => {
    ipcMain.removeAllListeners("HDRP_WINDOW");
  });

  _window.loadFile(path.join(__dirname, "urp.html"));
  _window.webContents.openDevTools();

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
    createURPWindow();
    mainWindow.close();
  });

  ipcMain.addListener('SAVE_IMAGE', (ev, data) => {

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

      })
      .catch(console.error);

  })

  mainWindow.on('close', () => {
    // ipcMain.removeAllListeners("SAVE_IMAGE");
    ipcMain.removeAllListeners("URP_WINDOW");
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};


app.applicationMenu = Menu.buildFromTemplate([]);


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
