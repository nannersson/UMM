import { Canvas } from "./Canvas.js";

const {ipcRenderer} = window.require("electron");

const bChooseFiles = document.querySelector('#bChooseFiles');
const lFilesSelected = document.querySelector("#lFilesSelected");
/**@type {HTMLDivElement} */
const progressBar = document.querySelector('#progressBar .resize-progress');
const state = {
    count: 0
};

/**
 * 
 * @param {Canvas} canvas 
 */
const FlipGreenChannel = (canvas) => {

    const imdat = canvas.GetImageData();

    for (let i = 0; i < imdat.data.length; i += 4) {

        imdat.data[i+1] = 255 - imdat.data[i+1];

    }

    canvas.DrawImageData(imdat);

}

bChooseFiles.addEventListener("click", e => {

    const input = document.createElement("input");
    input.type = 'file';
    input.accept = "image/*";
    input.multiple = true;

    input.addEventListener("change", () => {

        bChooseFiles.disabled = true;
        bChooseFiles.innerHTML = '<i class="fas fa-spinner animate-spin"></i>';

        const files = input.files;
        state.count = files.length;

        const datas = [];

        lFilesSelected.innerHTML = `${files.length.toLocaleString()} file${files.length === 1 ? '' : 's'} selected`;

        const SendData = () => {

            //console.log(datas);

            ipcRenderer.send("SAVE_FIMAGES", datas);

        }

        //recursive
        const Query = (i) => {

            if (i >= files.length) {
                SendData();
                return;
            }

            const file = files[i];
            const reader = new FileReader();
            reader.onloadend = re => {
                const src = re.target.result;
                const img = new Image();
                img.onload = () => {
                    const canvas = new Canvas(img);
                    FlipGreenChannel(canvas);
                    canvas.canvas.toBlob(blob => {
                        blob.arrayBuffer()
                            .then(ab => {
                                const d = new Uint8Array(ab);
                                datas.push({
                                    path: file.path.replace(/\.[a-z0-9]{3,4}$/i, `_flip.png`),
                                    buffer: d
                                });

                                //set progress
                                const t = (i+1) / files.length;
                                const pc = Math.floor(t * 10000) / 100;
                                progressBar.style.setProperty("--w", `${pc}%`);

                                Query(++i);
                            })
                            .catch(console.error);
                    });

                }
                img.src = src;
            }
            reader.readAsDataURL(file);

        };

        Query(0);


    });

    input.click();

});

ipcRenderer.on("UPDATE_PROGRESS", (ev, i) => {

    const t = i / state.count;
    const pc = Math.floor(t * 10000) / 100;
    progressBar.style.setProperty("--w", `${pc}%`);

});