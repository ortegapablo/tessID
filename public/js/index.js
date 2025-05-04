let pointer = { sx: 0, sy: 0, cx: 0, cy: 0, down: false, cssScaleX: 0, cssScaleY: 0 };
let video = document.createElement('video');
let canvas = document.getElementById('htmlCanvas');
let lienzo = document.createElement('canvas');
let tempCanvas = document.createElement('canvas');
let OCRarea = {};
let intervalID
let d
document.getElementById('takePitcure').addEventListener('click', takePicture)
document.getElementById('GetOCR').addEventListener('click', GetOCR)
document.getElementById('reDraw').addEventListener('click', reDraw)
document.getElementById('reTake').addEventListener('click', ReTake)
document.getElementById('loader').addEventListener('change', directInput)
const { createWorker, setLogging } = Tesseract;
setLogging(true);

const worker = await createWorker('mrzf', 1, {
    workerPath: 'tess/worker.min.js',
    langPath: 'tess',
    corePath: 'tess',
    cacheMethod: 'none',
    logger: progress,
    errorHandler: err => console.error(err),
});

(async () => {
    /*  await worker.load('testJob');
        await worker.loadLanguage('mrzf');
        await worker.initialize('mrzf'); */
    await worker.setParameters({
        // tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<',
        // tessedit_pageseg_mode: 'PSM_OSD_ONLY',
        tessedit_pageseg_mode: '11',
        //tessedit_ocr_engine_mode: '0',
        //tessjs_create_osd: '',

    });
    console.log('worker cargado')
})();

async function playVideoFromCamera() {
    try {
        const constraints = {
            'video': {
                width: { ideal: 4096 },
                height: { ideal: 2160 },
                facingMode: { ideal: "environment" }
            }
        };
        return await navigator.mediaDevices.getUserMedia(constraints);

    } catch (error) {

        let ctx = canvas.getContext('2d');
        ctx.font = "16px Arial";
        ctx.fillText("Error opening video camera.", 2, 50);
        ctx.fillText(error, 2, 100);
        console.error('Error opening video camera.', error);
    }
}

playVideoFromCamera().then((stream) => {
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    //  document.body.appendChild(video)
    //  video.style.visibility = 'hidden';
    intervalID = setInterval(() => {
        if (video.videoWidth === 0) {
        } else {
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            let ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
        };
    }, 33);
});

function ReTake() {
    video.captureStream().getVideoTracks()[0].enabled = true //saving resources??
    lienzo.replaceWith(canvas);
}
function reDraw() {
    lienzo.getContext('2d').putImageData(rasterSave.base, 0, 0);
};
function takePicture() {
    lienzo.width = video.videoWidth;
    lienzo.height = video.videoHeight;
    let ctx = lienzo.getContext('2d');
    ctx.drawImage(canvas, 0, 0);
    rasterSave.base = ctx.getImageData(0, 0, lienzo.width, lienzo.height)
    //getOCR(lienzo)
    canvas.replaceWith(lienzo);
    // mouse.sx = lienzo.getBoundingClientRect().left
    // mouse.sy = lienzo.getBoundingClientRect().top
    video.captureStream().getVideoTracks()[0].enabled = false //saving resources??
};

function GetOCR() {
    let img = document.createElement('img');
    let ctx = tempCanvas.getContext('2d');
    if (Object.entries(OCRarea).length === 0) {
        tempCanvas.width = lienzo.width;
        tempCanvas.height = lienzo.height;
        ctx.drawImage(lienzo, 0, 0)
        img.src = lienzo.toDataURL()
    } else {
        tempCanvas.width = OCRarea.ancho;
        tempCanvas.height = OCRarea.alto;
        //ctx.filter = "grayscale(100%)"
        //ctx.scale(1.5, 1.5)
        ctx.drawImage(lienzo, OCRarea.x, OCRarea.y, OCRarea.ancho, OCRarea.alto, 0, 0, OCRarea.ancho, OCRarea.alto)

        // let imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        // ctx.scale(1.5, 1.5)
        // thresholdFilter(imageData.data, 0.9);
        // ctx.putImageData(imageData, 0, 0);
        // //ctx.putImageData(thresholdFilter(ctx.getImageData(0, 0,  tempCanvas.width, tempCanvas.height).data),0,0)
        img.src = tempCanvas.toDataURL();

    };
    document.getElementById('ocrSource').appendChild(tempCanvas);
    getOCR(img);

};

async function getOCR(imgScr) {
    const outputOpts = {
        text: true,
        blocks: true,
        hocr: false,
        tsv: false,
        box: false,
        unlv: false,
        osd: false,
        pdf: false,
        imageColor: true,
        imageGrey: true,
        imageBinary: true,
        debug: false
    };
    console.log('Ocr iniciado');
    const { data } = await worker.recognize(imgScr, {}, outputOpts);
    OCRoutput(data);
    //document.getElementById('ocrOutput').innerHTML += data.text;
    //await worker.terminate();
};

function OCRoutput(r) {
    let ctx = tempCanvas.getContext('2d');
    let target = document.getElementById('ocrOutput');
    console.log(`Resultado: ${r.text}`, r);
    while (target.firstChild) {
        target.removeChild(target.firstChild)
    };
    r.blocks.forEach(w => {
        let ip = document.createElement('input');
        ip.size = 40
        ip.value = w.text
        document.getElementById('ocrOutput').appendChild(ip)
        //document.getElementById('ocrOutput').append(`<p>${w.text}</p>`)
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'red'
        ctx.strokeRect(w.bbox.x0, w.bbox.y0, w.bbox.x1 - w.bbox.x0, w.bbox.y1 - w.bbox.y0)
        /*         ctx.beginPath()
                ctx.moveTo(w.baseline.x0, w.baseline.y0)
                ctx.lineTo(w.baseline.x1, w.baseline.y1)
                ctx.strokeStyle = 'green'
                ctx.stroke() */
    });

};


lienzo.addEventListener('pointerup', () => { pointer.down = false; GetOCR() });
lienzo.addEventListener('pointerout', () => { pointer.down = false });
lienzo.addEventListener('pointerdown', e => {
    console.log(e)
    lienzo.style.touchAction = 'none';
    e.preventDefault();
    lienzo.getContext('2d').putImageData(rasterSave.base, 0, 0);
    pointer.cssScaleX = lienzo.width / lienzo.offsetWidth;
    pointer.cssScaleY = lienzo.height / lienzo.offsetHeight;
    pointer.sx = parseInt(e.clientX - lienzo.offsetLeft) * pointer.cssScaleX;
    pointer.sy = e.offsetY * pointer.cssScaleY; //change clienty to offsety in case of scroll
    pointer.down = true;
    rasterSave.current = lienzo.getContext('2d').getImageData(0, 0, lienzo.width, lienzo.height)
});
lienzo.addEventListener('pointermove', e => {
    e.preventDefault();
    lienzo.style.cursor = 'crosshair'
    let ctx = lienzo.getContext('2d');
    pointer.cx = parseInt(e.clientX - lienzo.offsetLeft) * pointer.cssScaleX;
    pointer.cy = e.offsetY * pointer.cssScaleY; //change clienty to offsety in case of scroll
    if (pointer.down) {
        ctx.putImageData(rasterSave.current, 0, 0);
        let ancho = pointer.cx - pointer.sx;
        let alto = pointer.cy - pointer.sy;
        ctx.beginPath();
        //ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.rect(pointer.sx, pointer.sy, ancho, alto);
        OCRarea = { x: pointer.sx, y: pointer.sy, ancho, alto };
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.stroke();
    }
});

let rasterSave = { base: lienzo.getContext('2d').getImageData(0, 0, lienzo.width, lienzo.height), current: lienzo.getContext('2d').getImageData(0, 0, lienzo.width, lienzo.height) }

function thresholdFilter(pixels, level) {
    if (level === undefined) {
        level = 0.5;
    }
    const thresh = Math.floor(level * 255);
    for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        let val;
        if (gray >= thresh) {
            val = 255;
        } else {
            val = 0;
        }
        pixels[i] = pixels[i + 1] = pixels[i + 2] = val;
    }
};

function progress(log) {
    console.log(`${log.status}: ${log.progress * 100} %`);
    let status = document.getElementById('status');
    status.firstChild.textContent = log.status + ': ';
    status.lastChild.setAttribute('value', log.progress);
    console.log(log.progress)
};

function directInput() {
    document.contains(canvas) ? canvas.replaceWith(lienzo) : null;
    let f = document.getElementById('loader')
    let reader = new FileReader();
    reader.addEventListener('load', function (e) {
        let ctx = lienzo.getContext('2d');
        let img = new Image();
        img.src = e.target.result;
        img.addEventListener('load', () => {
            lienzo.width = img.naturalWidth
            lienzo.height = img.naturalHeight
            ctx.drawImage(img, 0, 0);
            rasterSave.base = ctx.getImageData(0, 0, lienzo.width, lienzo.height)
        });


    });
    reader.readAsDataURL(f.files[0]);
    //getOCR(f.files[0])


};
// function drawVideo() {
//     canvas.width = video.videoWidth
//     canvas.height = video.videoHeight
//     let ctx = canvas.getContext('2d');
//     ctx.drawImage(video, 0, 0);
//     ctx.lineWidth = '3';
//     ctx.strokeStyle = "yellow";
//     ctx.moveTo(0, video.videoHeight * 0.60);
//     ctx.lineTo(video.videoWidth, video.videoHeight * 0.60);
//     ctx.stroke();
// };

// var p = navigator.mediaDevices.getUserMedia({ audio: true, video: true });

// p.then(function (mediaStream) {
//     var video = document.querySelector('video');
//     video.srcObject = mediaStream;
//     video.onloadedmetadata = function (e) {
//         // Do something with the video here.
//         console.log("hooooray")
//     };
// });

// p.catch(function (err) { console.log(err.name); }); // always check for errors at the end.

// import Tesseract from 'tesseract.js';

// Tesseract.recognize(
//     'https://tesseract.projectnaptha.com/img/eng_bw.png',
//     'eng',
//     { logger: m => console.log(m) }
// ).then(({ data: { text } }) => {
//     console.log(text);
// }) 