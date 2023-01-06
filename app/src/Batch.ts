import { readdir } from "original-fs";
import * as path from 'path';
import resizer from 'node-image-resizer'

export interface ResizeData {
    filters:string[],
    path:string,
    resolution:{x:number,y:number}
}

export function BatchResize(data:ResizeData, callback:(done:number, total:number) => void) {

    return new Promise((resolve, reject) => {

        readdir(data.path, (err, files) => {
            if (err) return reject(err);

            const modifyFiles:string[] = [];

            for (let i = 0; i < data.filters.length; i++) {
                const filter = data.filters[i];
                
                for (let j = 0; j < files.length; j++) {
                    const filename = files[j];
                    
                    if (filename.endsWith(`.${filter}`)) modifyFiles.push(path.resolve(data.path, filename));

                }

            }

            const setup = {
                all: {
                    path: data.path + "\\",
                    quality: 80
                },
                versions: [
                    {
                        prefix: '',
                        width: data.resolution.x,
                        height: data.resolution.y
                    }
                ]
            };

            console.log(setup.all.path);

            async function next() {
                let finished = 0;
                for (let i = 0; i < modifyFiles.length; i++) {
                    const filepath = modifyFiles[i];
                    await resizer(filepath, setup);
                    callback(++finished, modifyFiles.length);
                }

            }

            next()
                .then(resolve)
                .catch(reject);

        });

    });

}