const dropArea = document.getElementById('drop-area');
const progressBar = document.getElementById('progress');
const progressLabel = document.getElementById('progress-label');

console.log('Renderer loaded. window.electronAPI:', window.electronAPI);

// Add a button for selecting files via dialog
const button = document.createElement('button');
button.textContent = 'Select Files/Folder';
button.style.display = 'block';
button.style.margin = '10px auto';
button.style.padding = '10px 20px';
document.getElementById('container').appendChild(button);

dropArea.ondragover = (e) => { 
  e.preventDefault(); 
  dropArea.style.borderColor = '#333'; 
  console.log('Drag over event');
};

dropArea.ondragleave = (e) => { 
  e.preventDefault(); 
  dropArea.style.borderColor = '#888'; 
  console.log('Drag leave event');
};

// Simple approach - just notify main process about the drop
dropArea.ondrop = (e) => {
  e.preventDefault();
  dropArea.style.borderColor = '#888';
  
  console.log('Drop event received');
  
  // Get file paths directly from the files array
  // In Electron, file objects have a path property
  const filelist = e.dataTransfer.files;
  const files = [];
  
  console.log('Number of files dropped:', filelist.length);
  
  for (let i = 0; i < filelist.length; i++) {
    const file = filelist[i];
    console.log('File:', file.name, 'Size:', file.size, 'Type:', file.type);
    console.log('File path:', file.path);
    if (file.path) {
      files.push(file.path);
    }
  }
  
  console.log('Files to send to main process:', files);
  
  if (files.length > 0 && window.electronAPI && window.electronAPI.sendFiles) {
    console.log('Sending files to main process');
    window.electronAPI.sendFiles(files);
    console.log('Sent files to main process.');
  } else {
    console.log('No files to send or API not available');
  }
  
  progressBar.style.width = '0%';
  progressLabel.textContent = '0%';
};

// Handle button click for file selection
button.addEventListener('click', async () => {
  console.log('File selection button clicked');
  
  // Since we can't directly get file paths from renderer, 
  // we'll need to implement file dialog in main process
  if (window.electronAPI && window.electronAPI.selectFiles) {
    console.log('Requesting file selection through main process');
    window.electronAPI.selectFiles();
  } else {
    console.error('File selection API not available!');
  }
});

if (window.electronAPI && window.electronAPI.onProgress) {
  window.electronAPI.onProgress((percent) => {
    progressBar.style.width = percent + '%';
    progressLabel.textContent = percent + '%';
    console.log('Progress update:', percent);
  });
} else {
  console.error('window.electronAPI.onProgress is not available!');
}
