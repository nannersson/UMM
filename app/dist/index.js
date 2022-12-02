"use strict";
// const { app, BrowserWindow } = require('electron');
// const path = require('path');
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const original_fs_1 = require("original-fs");
const path = __importStar(require("path"));
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    // eslint-disable-line global-require
    electron_1.app.quit();
}
const createURPWindow = () => {
    const _window = new electron_1.BrowserWindow({
        width: 262,
        height: 273,
        'useContentSize': true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    electron_1.ipcMain.addListener("HDRP_WINDOW", ev => {
        createMainWindow();
        _window.close();
    });
    _window.on('close', () => {
        electron_1.ipcMain.removeAllListeners("HDRP_WINDOW");
    });
    _window.loadFile(path.join(__dirname, "urp.html"));
    _window.webContents.openDevTools();
};
const createMainWindow = () => {
    // Create the browser window.
    const mainWindow = new electron_1.BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    electron_1.ipcMain.addListener("URP_WINDOW", ev => {
        createURPWindow();
        mainWindow.close();
    });
    electron_1.ipcMain.addListener('SAVE_IMAGE', (ev, data) => {
        const buffer = Buffer.from(data);
        electron_1.dialog.showSaveDialog(mainWindow, {
            'filters': [
                {
                    'name': 'PNG Image',
                    'extensions': ['png']
                }
            ]
        })
            .then((res) => {
            if (res.canceled)
                return;
            (0, original_fs_1.writeFileSync)(res.filePath, buffer, 'binary');
        })
            .catch(console.error);
    });
    mainWindow.on('close', () => {
        // ipcMain.removeAllListeners("SAVE_IMAGE");
        electron_1.ipcMain.removeAllListeners("URP_WINDOW");
    });
    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
};
electron_1.app.applicationMenu = electron_1.Menu.buildFromTemplate([]);
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron_1.app.on('ready', createMainWindow);
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
