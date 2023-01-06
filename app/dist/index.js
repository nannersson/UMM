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
const Batch_1 = require("./Batch");
const _debug = false;
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
    if (_debug)
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
    if (_debug)
        mainWindow.webContents.openDevTools();
};
const createResizeWindow = (parent) => {
    const resizeWin = new electron_1.BrowserWindow({
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
    electron_1.ipcMain.addListener("SELECT_FOLDER", (ev) => {
        electron_1.dialog.showOpenDialog(resizeWin, {
            title: "Select Folder",
            properties: ["openDirectory"]
        })
            .then(res => {
            if (res.canceled)
                return;
            ev.sender.send("SELECT_FOLDER", res.filePaths[0]);
        })
            .catch(console.error);
    });
    electron_1.ipcMain.addListener("BATCH_RESIZE", (ev, data) => {
        (0, Batch_1.BatchResize)(data, (done, total) => {
            ev.sender.send("UPDATE_PROGRESS", [done, total]);
        })
            .then(() => {
            resizeWin.close();
        })
            .catch(console.error);
    });
    resizeWin.on('close', () => {
        electron_1.ipcMain.removeAllListeners("SELECT_FOLDER");
        electron_1.ipcMain.removeAllListeners("BATCH_RESIZE");
    });
    resizeWin.setMenu(electron_1.Menu.buildFromTemplate([]));
    resizeWin.loadFile(path.join(__dirname, 'batchResize.html'));
    if (_debug)
        resizeWin.webContents.openDevTools();
};
const createFlipNormalsWindow = (parent) => {
    const flipWin = new electron_1.BrowserWindow({
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
    electron_1.ipcMain.addListener("SAVE_FIMAGES", (ev, data) => {
        for (let i = 0; i < data.length; i++) {
            const file = data[i];
            const buffer = Buffer.from(file.buffer);
            (0, original_fs_1.writeFileSync)(file.path, buffer, 'binary');
            ev.sender.send("UPDATE_PROGRESS", i + 1);
        }
        setTimeout(() => {
            flipWin.close();
        }, 500);
    });
    flipWin.on('close', () => {
        electron_1.ipcMain.removeAllListeners("SAVE_FIMAGES");
    });
    flipWin.setMenu(electron_1.Menu.buildFromTemplate([]));
    flipWin.loadFile(path.join(__dirname, 'batchFlipNormals.html'));
    if (_debug)
        flipWin.webContents.openDevTools();
};
electron_1.app.applicationMenu = electron_1.Menu.buildFromTemplate([
    {
        'label': 'File',
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
