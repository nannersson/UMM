const {ipcRenderer} = window.require("electron");

import {BlackMap, Canvas, GenerateDetailMap, GenerateMaskMap, WhiteMap} from './Canvas.js';

const inputs = document.querySelectorAll('.map-input');
const maskSIR = document.querySelector("#maskSIR");
const detailSIR = document.querySelector("#detailSIR");
const btnGenerateMask = document.querySelector("#btnGenerateMask");
const btnGenerateDetail = document.querySelector("#btnGenerateDetail");
const btnReload = document.querySelector('#btnReload');
const btnURP = document.querySelector('#btnURP');

maskSIR.checked = localStorage.getItem("maskSIR") ? true : false;
detailSIR.checked = localStorage.getItem("detailSIR") ? true : false;

const state = {
    size: null,
    maps: {
        mask: {
            metallic: null,
            occlusion: null,
            detail: null,
            smoothness: null
        },
        detail: {
            albedo: null,
            normal: null,
            smoothness: null
        }
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
                    state.maps[map][id] = c;
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
    
    el.addEventListener('click', () => {

        const map = el.dataset.map;
        const id = el.dataset.id;

        const input = document.createElement("input");
        input.type = 'file';
        input.accept = "image/*";
        input.multiple = false;

        input.addEventListener('change', () => {

            const file = input.files[0];
            
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
                    state.maps[map][id] = c;
                    el.querySelector('.avatar div').innerHTML = `<img src="${res}" alt="${id}">`;
                }
                img.src = res;
            }

            reader.readAsDataURL(file);

        });

        input.click();

    });

});

btnGenerateMask.addEventListener('click', () => {
    
    if (state.size === null) return console.error("No size set");

    const metalMap = state.maps.mask.metallic === null ? BlackMap(state.size.w, state.size.h) : state.maps.mask.metallic;
    const occlusionMap = state.maps.mask.occlusion === null ? WhiteMap(state.size.w, state.size.h) : state.maps.mask.occlusion;
    const detailMap = state.maps.mask.detail === null ? BlackMap(state.size.w, state.size.h) : state.maps.mask.detail;
    const smoothMap = state.maps.mask.smoothness === null ? BlackMap(state.size.w, state.size.h) : state.maps.mask.smoothness;

    if (maskSIR.checked) localStorage.setItem("maskSIR", "true");
    else localStorage.removeItem("maskSIR");

    GenerateMaskMap(state.size, metalMap, occlusionMap, detailMap, smoothMap, maskSIR.checked);

});

btnGenerateDetail.addEventListener('click', () => {

    if (state.size === null) return console.error("No size set");

    const albedoMap = state.maps.detail.albedo === null ? BlackMap(state.size.w, state.size.h) : state.maps.detail.albedo;
    const normalMap = state.maps.detail.normal === null ? BlackMap(state.size.w, state.size.h) : state.maps.detail.normal;
    const smoothMap = state.maps.detail.smoothness === null ? BlackMap(state.size.w, state.size.h) : state.maps.detail.smoothness;

    if (detailSIR.checked) localStorage.setItem("detailSIR", "true");
    else localStorage.removeItem("detailSIR");

    GenerateDetailMap(state.size, albedoMap, normalMap, smoothMap, detailSIR.checked);

});

btnReload.addEventListener("click", () => window.location.reload());

btnURP.addEventListener("click", () => {

    ipcRenderer.send("URP_WINDOW");

});

ipcRenderer.on("RELOAD", ev => {
    window.location.reload();
});