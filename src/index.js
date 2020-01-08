const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const serverConfig = require("./server");
const socket = require("socket.io");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  // eslint-disable-line global-require
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let pickerDialog;
let io;

const createWindow = () => {
  const { server, port } = serverConfig;
  server.listen(port, err => {
    if (err) throw err;
    console.log("Server Started at :", port);
  });
  io = socket(server);
  io.sockets.on("connection", socket => {
    socket.on("screenCaptureOffer", message => {
      console.log(message);
      socket.to(socket.id).emit("screenCaptureOffer", message);
    });
    socket.on("screenCaptureAnswer", message => {
      socket.emit("screenCaptureAnswer", message);
    });
    // socket.emit("message", "hello from server");
  });

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: true
    }
  });

  pickerDialog = new BrowserWindow({
    parent: mainWindow,
    skipTaskbar: true,
    modal: true,
    show: false,
    height: 390,
    width: 680,
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWindow.loadURL(port === 443 ? "https" : "http" + "://localhost" + `:${port}/`);
  pickerDialog.loadFile(path.join(__dirname, "picker.html"));

  //  mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  pickerDialog.on("closed", () => {
    pickerDialog = null;
  });
};

ipcMain.on("show-picker", (event, options) => {
  pickerDialog.show();
  console.log(options);
  pickerDialog.webContents.send("get-sources", options);
});

ipcMain.on("source-id-selected", (event, sourceId) => {
  pickerDialog.hide();
  mainWindow.webContents.send("source-id-selected", sourceId);
});

app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
