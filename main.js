const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 450,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  
  win.loadFile('index.html');
  
  // Enable file drop on the window
  win.webContents.on('dom-ready', () => {
    console.log('Window DOM ready');
  });
  
  return win;
}

app.whenReady().then(() => {
  const win = createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  
  // Set up file drop handling for the window
  setupFileDropHandling();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function setupFileDropHandling() {
  // Handle file drops directly on the BrowserWindow
  app.on('browser-window-created', (event, window) => {
    window.webContents.on('did-finish-load', () => {
      console.log('Window loaded - injecting drop handling script');
      
      // Inject script to capture drop events and send them to main process
      window.webContents.executeJavaScript(`
        document.addEventListener('drop', (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Drop event captured in page');
        }, false);
        
        document.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.stopPropagation();
        }, false);
      `);
    });
  });
}

// Function to recursively find all .eml files in a directory
function findEmlFiles(dir) {
  console.log('Finding EML files in directory:', dir);
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    console.log('Files in directory:', list);
    list.forEach(file => {
      file = path.join(dir, file);
      console.log('Processing file:', file);
      try {
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
          console.log('It is a directory, recursing...');
          results = results.concat(findEmlFiles(file));
        } else {
          const ext = path.extname(file).toLowerCase();
          console.log('File extension:', ext);
          if (ext === '.eml') {
            console.log('Found EML file:', file);
            results.push(file);
          } else {
            console.log('Not an EML file:', file);
          }
        }
      } catch (fileError) {
        console.error('Error processing file:', file, fileError);
      }
    });
  } catch (dirError) {
    console.error('Error reading directory:', dir, dirError);
  }
  console.log('EML files found in', dir, ':', results);
  return results;
}

// Handle file selection through dialog
ipcMain.on('select-files', async (event) => {
  console.log('File selection requested');
  
  const win = BrowserWindow.getAllWindows()[0];
  if (!win) {
    console.error('No window available for dialog');
    return;
  }
  
  try {
    // Show open dialog for files and folders
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile', 'openDirectory', 'multiSelections'],
      filters: [
        { name: 'EML Files', extensions: ['eml'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      console.log('Selected files:', result.filePaths);
      handleDroppedFiles(result.filePaths, event.sender);
    } else {
      console.log('File selection was canceled');
    }
  } catch (error) {
    console.error('Error during file selection:', error);
  }
});

// Handle dropped files
function handleDroppedFiles(filePaths, sender) {
  console.log('Handling dropped files:', filePaths);
  
  if (!filePaths || !Array.isArray(filePaths)) {
    console.error('Received invalid file paths data:', filePaths);
    return;
  }
  
  // Process all dropped items (files and directories)
  let allFiles = [];
  filePaths.forEach(filePath => {
    try {
      console.log('Examining file:', filePath);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        // If it's a directory, find all .eml files in it
        console.log('Processing directory:', filePath);
        const emlFiles = findEmlFiles(filePath);
        console.log('Found EML files in directory:', emlFiles);
        allFiles = allFiles.concat(emlFiles);
      } else if (path.extname(filePath).toLowerCase() === '.eml') {
        // If it's an .eml file, add it directly
        console.log('Processing EML file:', filePath);
        allFiles.push(filePath);
      } else {
        console.log('Skipping non-EML file:', filePath, 'with extension:', path.extname(filePath));
      }
    } catch (error) {
      console.error('Error processing file:', filePath, error);
    }
  });
  
  console.log('All EML files to process:', allFiles);
  
  // Filter out any falsy values
  const items = allFiles.filter(f => f);
  console.log('Filtered items:', items);
  
  let completed = 0;
  const total = items.length;
  
  if (total === 0) {
    console.log('No valid EML files to process');
    sender.send('progress-update', 100);
    return;
  }
  
  items.forEach(item => {
    console.log('Processing item:', item);
    const child = fork(path.join(__dirname, 'convert.js'), [item]);
    
    child.on('message', (message) => {
      console.log('Message from child process:', message);
    });
    
    child.on('exit', (code) => {
      console.log('Child process exited with code:', code);
      completed++;
      const progress = Math.round((completed / total) * 100);
      sender.send('progress-update', progress);
      if (completed === total) {
        sender.send('progress-update', 100);
        console.log('All files processed');
      }
    });
    
    child.on('error', (error) => {
      console.error('Child process error:', error);
      completed++;
      if (completed === total) {
        sender.send('progress-update', 100);
        console.log('All files processed (with errors)');
      }
    });
  });
}

ipcMain.on('files-dropped', (event, files) => {
  console.log('Main received files:', files);
  
  // Handle the files directly
  if (files && Array.isArray(files) && files.length > 0) {
    handleDroppedFiles(files, event.sender);
  } else {
    console.log('No valid files received through IPC');
  }
});
