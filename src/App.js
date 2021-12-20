import React, { Component } from 'react';
import './App.css';

export default class App extends Component {

  canvas = React.createRef();
  mapIds = ['metalMap', 'aoMap', 'detailMap', 'roughnessMap'];

  constructor(props) {
    super(props)
  
    this.state = {
      metalMap: null,
      aoMap: null,
      detailMap: null,
      roughnessMap: null
    }
  }

  componentDidMount() {
    /**@type {CanvasRenderingContext2D} */
    this.ctx = this.canvas.current.getContext('2d');
  }

  GenerateMap = () => {

    const canvas = this.ctx.canvas;

    canvas.width = this.state.roughnessMap.width;
    canvas.height = this.state.roughnessMap.height;

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    const metalCanvas = document.createElement("canvas");
    metalCanvas.width = canvas.width;
    metalCanvas.height = canvas.height;
    const metalCtx = metalCanvas.getContext('2d');

    const aoCanvas = document.createElement("canvas");
    aoCanvas.width = canvas.width;
    aoCanvas.height = canvas.height;
    const aoCtx = aoCanvas.getContext('2d');
    
    const detailCanvas = document.createElement("canvas");
    detailCanvas.width = canvas.width;
    detailCanvas.height = canvas.height;
    const detailCtx = detailCanvas.getContext('2d');
    
    const roughCanvas = document.createElement("canvas");
    roughCanvas.width = canvas.width;
    roughCanvas.height = canvas.height;
    const roughCtx = roughCanvas.getContext('2d');
    roughCtx.filter = 'invert(1)';

    if (this.state.metalMap) {
      metalCtx.drawImage(this.state.metalMap, 0, 0);
    } else metalCtx.fillRect(0, 0, canvas.width, canvas.height);
    if (this.state.aoMap) {
      aoCtx.drawImage(this.state.aoMap, 0, 0);
    } else aoCtx.fillRect(0, 0, canvas.width, canvas.height);
    if (this.state.detailMap) {
      detailCtx.drawImage(this.state.detailMap, 0, 0);
    } else detailCtx.fillRect(0, 0, canvas.width, canvas.height);
    if (this.state.roughnessMap) {
      roughCtx.drawImage(this.state.roughnessMap, 0, 0);
    } else roughCtx.fillRect(0, 0, canvas.width, canvas.height);

    const metalData = metalCtx.getImageData(0, 0, canvas.width, canvas.height);
    const aoData = aoCtx.getImageData(0, 0, canvas.width, canvas.height);
    const detailData = detailCtx.getImageData(0, 0, canvas.width, canvas.height);
    const roughnessData = roughCtx.getImageData(0, 0, canvas.width, canvas.height);
    const compositeData = new ImageData(canvas.width, canvas.height);

    for (let i = 0; i < compositeData.data.length; i += 4) {
      
      const metalValue = metalData.data[i];
      const aoValue = aoData.data[i+1];
      const detailValue = detailData.data[i+2];
      const roughValue = roughnessData.data[i];

      compositeData.data[i] = metalValue;
      compositeData.data[i+1] = aoValue;
      compositeData.data[i+2] = detailValue;
      compositeData.data[i+3] = roughValue;
      
    }

    this.ctx.putImageData(compositeData, 0, 0);

  };

  DirectUploadMap(id, file) {

    const obj = {};
    const reader = new FileReader();

    reader.onloadend = e => {
      const res = e.target.result.toString();
      const im = new Image();
      im.src = res;
      im.onload = () => {
        obj[id] = im;
        this.setState(obj);
      };
    };

    reader.readAsDataURL(file);

  }

  UploadMap = (id) => {

    const obj = {};
    const input = document.createElement("input");
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;

    input.onchange = e => {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onloadend = re => {
        const res = re.target.result.toString();
        const im = new Image();
        im.src = res;
        im.onload = () => {
          obj[id] = im;
          this.setState(obj);
        }
      }

      reader.readAsDataURL(file);
    };

    input.click();

  }
  

  render() {
    return (
      <div className='App'>
        <h1 style={{fontSize: '1em', background: '#ffffff20', marginBottom: '0.5em'}}>Unity HDRP Mask Map Maker (3M)</h1>
        <p>Small utility to generate Unity HDRP mask maps from typical PBR textures used in Blender.</p>

        <div className="grid">
          <div className="left">

            <div className="components">
              {/* <div className="component">
                <div className="image"></div>
                <p>Test</p>
              </div> */}

            {this.mapIds.map((v, i) => {
              return (
                <div className="component" key={`_comp_${v}`}>
                  <div onDragOver={e => {
                    e.preventDefault();
                  }} onDrop={e => {
                    e.preventDefault();

                    const file = e.dataTransfer.items[0].getAsFile();

                    this.DirectUploadMap(v, file);

                  }} className="image" onClick={e => this.UploadMap(v)}>
                    {this.state[v] ? <img src={this.state[v].src}></img> : ''}
                  </div>
                  <p onClick={e => this.UploadMap(v)}>{v}</p>
                </div>
              )
            })}

            </div>

              <button style={{margin: '1em'}} id="generateBtn" onClick={e => {
              console.log(this.state);
              this.GenerateMap();
              }}>Generate</button>

          </div>

          <div className="right">
            <div>
              <canvas ref={this.canvas}></canvas>
            </div>
          </div>
        </div>

        

      </div>
    )
  }
}
