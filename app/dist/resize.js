const {ipcRenderer} = window.require("electron");

const iFolder = document.querySelector('#iFolder');
const bSelectFolder = document.querySelector('#bSelectFolder');
const iWidth = document.querySelector('#iWidth');
const iHeight = document.querySelector('#iHeight');
const filters = document.querySelectorAll(".type-filter");
const bRun = document.querySelector('#bRun');
const bCancel = document.querySelector('#bCancel');
const progressBar = document.querySelector('#progressBar .resize-progress');

const state = {
    path: '',
    resolution: {
        x: parseInt(localStorage.getItem("resizeX")) || 1024,
        y: parseInt(localStorage.getItem("resizeY")) || 1024
    }
}

iWidth.value = state.resolution.x;
iHeight.value = state.resolution.y;

ipcRenderer.on("SELECT_FOLDER", (ev, folderPath) => {

    state.path = folderPath;
    iFolder.value = folderPath;
    bRun.disabled = false;

});

bRun.addEventListener("click", () => {

    if (state.path === '') return;

    bRun.disabled = true;
    bCancel.disabled = true;
    bSelectFolder.disabled = true;
    iWidth.disabled = true;
    iHeight.disabled =  true;

    state.resolution.x = parseInt(iWidth.value);
    state.resolution.y = parseInt(iHeight.value);
    state.resolution.x = Math.min(4096, Math.max(2, state.resolution.x));
    state.resolution.y = Math.min(4096, Math.max(2, state.resolution.y));
    localStorage.setItem("resizeX", state.resolution.x);
    localStorage.setItem("resizeY", state.resolution.y);

    const _filters = [];
    filters.forEach(el => {
        const val = el.dataset.value;
        if (el.checked) _filters.push(val);
    });

    const data = {
        filters: _filters,
        ...state
    }

    ipcRenderer.send("BATCH_RESIZE", data);

});

bSelectFolder.addEventListener("click", () => {
    ipcRenderer.send("SELECT_FOLDER");
});

bCancel.addEventListener("click", () => {
    window.close();
});

ipcRenderer.on("UPDATE_PROGRESS", (ev, progress) => {

    const t = progress[0] / progress[1];
    const percentage = Math.floor(t * 10000) / 100;

    progressBar.style.setProperty('--w', `${percentage}%`);

});