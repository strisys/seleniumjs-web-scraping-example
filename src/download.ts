// Dependencies
import fs from 'fs';
import url from 'url';
import https from 'https';
import { exec, spawn } from 'child_process';

import upheldData from './results/results-upheld.json';
import notupheldData from './results/results-notupheld.json';

// console.log(upheldData);
// console.log(notupheldData);

let DOWNLOAD_DIR = './downloads/';


if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR);
}

// Function for downloading file using HTTP.get
let downloadFile = (file_url: string, isUpheld: boolean) => {
  const suffix = ((isUpheld) ? 'is-upheld' : 'is-not-upheld') ;
  const dir = `${DOWNLOAD_DIR}/${suffix}`

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  // let options = {
  //   host: url.parse(file_url).host,
  //   port: 80,
  //   path: url.parse(file_url).pathname
  // };

  let file_name = url.parse(file_url).pathname.split('/').pop();
  let target = `${dir}/${file_name}`;

  if (fs.existsSync(target)) {
    console.log(`File '${target}' already written.`);
    return;
  }

  https.get(file_url, (res) => {
    console.log(`downloading '${file_url}' to '${target}' ...`);

    if (fs.existsSync(target)) {
      fs.unlinkSync(target);
    }

    // Open file in local filesystem
    const file = fs.createWriteStream(target);
    res.pipe(file);

    file.on('finish', () => {
      file.close();

      fs.stat(target, (err, stats) => {
        if (err) {
          console.log(`Failed to get stats for '${target}'`);
          return;
        }

        console.log(`File '${target}' written (bytes:=${stats.size})`);
      });
    });
  }).on("error", (err) => {
      console.log("Error: ", err.message);
  });

};

upheldData.forEach((obj: any) => {
  downloadFile(obj['ref-url'], true);
});


// notupheldData.forEach((obj: any) => {
//   downloadFile(obj['ref-url'], false);
// });

