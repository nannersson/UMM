const {ipcRenderer} = window.require("electron");

import {BlackMap, Canvas, GenerateDetailMap, GenerateMaskMap, GenerateURPMap, WhiteMap} from './Canvas.js';

const btnHDRP = document.querySelector('#btnHDRP');
const btnReload = document.querySelector('#btnReload');
const SIR = document.querySelector('#SIR');
const btnGenerate = document.querySelector('#btnGenerate');
const sizeText = document.querySelector('#sizeText');
const inputs = document.querySelectorAll('.map-input');

SIR.checked = localStorage.getItem("urpSIR") ? true : false;

const state = {
    size: null,
    maps: {
        metallic: null,
        smoothness: null
    }
};

/**
 * 
 * @param {Event} e 
 */
 const drophandle = e => {
    console.log("dropped");
    e.preventDefault();
    e.currentTarget.classList.remove("bg-info");

    const inputEl = e.currentTarget;

    const item = e.dataTransfer.items[0];

    if (item.kind === 'file' && item.type.startsWith("image")) {
        
        const file = item.getAsFile();
        const map = inputEl.dataset.map;
        const id = inputEl.dataset.id;
        
        const reader = new FileReader();

            reader.onloadend = e => {
                const res = e.target.result;
                const img = new Image();
                img.onload = () => {

                    if (state.size === null) {
                        state.size = {w: img.width, h:img.height};
                        document.querySelector("#sizeText").innerHTML = `${state.size.w} x ${state.size.h}`;
                    }

                    const c = new Canvas(img);
                    state.maps[id] = c;
                    inputEl.querySelector('.avatar div').innerHTML = `<img src="${res}" alt="${id}">`;
                }
                img.src = res;
            }

            reader.readAsDataURL(file);

    }

}

const draghandle = e => {
    
    e.currentTarget.classList.add("bg-info");
    e.preventDefault();
}
const dragleavehandle = e => {
    
    e.currentTarget.classList.remove("bg-info");
    e.preventDefault();
}

inputs.forEach(el => {

    el.addEventListener("drop", drophandle);
    el.addEventListener("dragover", draghandle);
    el.addEventListener("dragleave", dragleavehandle);

    el.addEventListener("click", () => {

        const type = el.dataset.id;
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";

        input.addEventListener("change", () => {
            const file = input.files[0];
            const reader = new FileReader();

            reader.onloadend = e => {
                const res = e.target.result;
                const img = new Image();
                
                img.onload = () => {
                    if (state.size === null) {
                        state.size = {w: img.width, h: img.height};
                        sizeText.innerHTML = `${state.size.w}x${state.size.h}`;
                    }

                    const c = new Canvas(img);
                    state.maps[type] = c;
                    el.querySelector('.avatar div').innerHTML = `<img src="${res}" alt="${type}">`;

                };
                img.src = res;
            }
            reader.readAsDataURL(file);
            
        });
        input.click();

    });

});

btnGenerate.addEventListener("click", () => {

    if (state.size === null) return console.error("No size set");

    const metalMap = state.maps.metallic === null ? BlackMap(state.size.w, state.size.h) : state.maps.metallic;
    const smoothMap = state.maps.smoothness === null ? BlackMap(state.size.w, state.size.h) : state.maps.smoothness;

    if (SIR.checked) localStorage.setItem("urpSIR", "true");
    else localStorage.removeItem("urpSIR");

    GenerateURPMap(state.size, metalMap, smoothMap, SIR.checked);

});

btnReload.addEventListener("click", () => window.location.reload());
btnHDRP.addEventListener("click", () => ipcRenderer.send("HDRP_WINDOW"));

ipcRenderer.on("RELOAD", ev => {
    window.location.reload();
});