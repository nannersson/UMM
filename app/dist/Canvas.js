const {ipcRenderer} = window.require("electron");

export class Canvas {

    /**
     * 
     * @param {HTMLImageElement} img 
     */
    constructor(img=undefined) {

        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext('2d');


        if (img !== undefined) {
            this.canvas.width = img.width;
            this.canvas.height = img.height;
            this.ctx.drawImage(img, 0, 0);
        }

    }

    Desaturate() {

        const c = new Canvas();
        c.canvas.width = this.canvas.width;
        c.canvas.height = this.canvas.height;
        c.ctx.filter = 'grayscale(100%)';

        c.ctx.drawImage(this.canvas, 0, 0);

        this.ctx.drawImage(c.canvas, 0, 0);

    }

    /**
     * 
     * @param {ImageData} data 
     */
    DrawImageData(data) {
        this.canvas.width = data.width;
        this.canvas.height = data.height;
        this.ctx.clearRect(0, 0, data.width, data.height);
        this.ctx.putImageData(data, 0, 0);
    }

    GetImageData() {
        return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

}

/**
 * 
 * @param {number} width 
 * @param {number} height 
 * @returns {Canvas} image data
 */
export function BlackMap(width, height) {
    const imdat = new ImageData(width, height);
    
    const c = new Canvas();
    c.DrawImageData(imdat);

    return c;

}

/**
 * 
 * @param {number} width 
 * @param {number} height 
 * @returns {Canvas} image data
 */
export function WhiteMap(width, height) {
    const imdat = new ImageData(width, height);

    for (let i = 0; i < imdat.data.length; i++) {
        imdat.data[i] = 255;
    }

    const c = new Canvas();
    c.DrawImageData(imdat);

    return c;

}

/**
 * Inverts the map and returns the Image Data
 * @param {Canvas} canvas 
 */
function Invert(canvas) {
    const d = canvas.GetImageData();
    for (let i = 0; i < d.data.length; i += 4) {
        d.data[i] = 255 - d.data[i];
        d.data[i+1] = 255 - d.data[i+1];
        d.data[i+2] = 255 - d.data[i+2];
    }

    return d;
}

/**
 * 
 * @param {{w:number,h:number}} size 
 * @param {Canvas} albedo 
 * @param {Canvas} normal 
 * @param {Canvas} smoothness 
 * @param {boolean} sir 
 */
export function GenerateDetailMap(size, albedo, normal, smoothness, sir) {

    albedo.Desaturate();

    const dAlbedo = albedo.GetImageData();
    const dNormal = normal.GetImageData();
    const dSmooth = sir ? Invert(smoothness) : smoothness.GetImageData();

    const newData = new ImageData(size.w, size.h);

    /**
     * Desaturated albedo goes in the R channel
     * Normals G channel goes in the G channel
     * smoothness goes in the B channel
     * Normals R channel goes in the A channel
     */

    for (let i = 0; i < newData.width * newData.height; i++) {

        const index = i * 4;

        newData.data[index] = dAlbedo.data[index];
        newData.data[index+1] = dNormal.data[index+1];
        newData.data[index+2] = dSmooth.data[index];
        newData.data[index+3] = dNormal.data[index];

    }

    const newCanvas = new Canvas();

    newCanvas.DrawImageData(newData);

    newCanvas.canvas.toBlob(blob => {

        blob.arrayBuffer()
            .then(ab => {
                const data = new Uint8Array(ab);
                ipcRenderer.send("SAVE_IMAGE", data);
            })
            .catch(console.error);

    });

}

/**
 * 
 * @param {{w:number,h:number}} size
 * @param {Canvas} metallic 
 * @param {Canvas} occlusion 
 * @param {Canvas} detail 
 * @param {Canvas} smoothness 
 * @param {boolean} sir
 */
export function GenerateMaskMap(size, metallic, occlusion, detail, smoothness, sir) {

    //if smoothness is roughness, need to invert the smoothness value (smoothness = 255 - roughness)

    const smooth = sir ? Invert(smoothness) : smoothness.GetImageData();
    const metal = metallic.GetImageData();
    const occlude = occlusion.GetImageData();
    const _detail = detail.GetImageData();

    const newData = new ImageData(size.w, size.h);

    for (let i = 0; i < size.w * size.h; i++) {

        const index = i * 4;

        newData.data[index] = metal.data[index];
        newData.data[index+1] = occlude.data[index];
        newData.data[index+2] = _detail.data[index];
        newData.data[index+3] = smooth.data[index];

    }

    const newCanvas = new Canvas();

    newCanvas.DrawImageData(newData);

    newCanvas.canvas.toBlob((blob) => {

        blob.arrayBuffer()
            .then(ab => {
                const data = new Uint8Array(ab);
                ipcRenderer.send("SAVE_IMAGE", data);
            })
            .catch(console.error);

    });

}