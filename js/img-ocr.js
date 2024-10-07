class CP_ImageOCR {
  #UPSCALING = 10;

  #dataCache = new Map();
  #ocrResultsCache = new Map();
  #scheduler;
  #initDone = false;

  constructor() {
    this.#init();
  }

  async #init() {
    this.#scheduler = Tesseract.createScheduler();

    const N = 2;
    for (let i = 0; i < N; ++i)
      this.#scheduler.addWorker(await this.#makeWorker());

    this.#initDone = true;
  }

  async #makeWorker() {
    const worker = await Tesseract.createWorker("fra");
    worker.setParameters({ tessedit_pageseg_mode: 12 });
    return worker;
  }

  imgToTextAsync(imgElem) {
    if (!(imgElem instanceof HTMLImageElement) || !this.#initDone) return false;

    return new Promise(async (resolve, reject) => {
      let text = "";
      try {
        let imgDataURL = this.#imgToDataURL(imgElem);
        let OCRCacheKey = this.#toOCRCacheKey(imgDataURL);

        if (this.#ocrResultsCache.has(OCRCacheKey)) {
          text = this.#ocrResultsCache.get(OCRCacheKey);
        } else {
          let result = await this.#scheduler.addJob("recognize", imgDataURL);
          let ocrText = result.data.text;

          if (ocrText) {
            this.#ocrResultsCache.set(OCRCacheKey, ocrText);
          }
          text = ocrText;
        }
      } catch (e) {
        reject(e);
      }
      resolve(text);
    });
  }

  #imgToDataURL(imgElem) {
    if (this.#dataCache.has(imgElem)) {
      return this.#dataCache.get(imgElem);
    } else {
      imgElem.crossOrigin = "Anonymous";

      const canvas = document.createElement("canvas");

      const testingContainer = document.querySelector(".fake-canvas-container");
      if (testingContainer) {
        testingContainer.appendChild(canvas);
        setTimeout(() => {
          testingContainer.removeChild(canvas);
        }, 2000);
      }

      const context = canvas.getContext("2d");

      canvas.width = imgElem.width * this.#UPSCALING;
      canvas.height = imgElem.height * this.#UPSCALING;

      context.drawImage(imgElem, 0, 0, canvas.width, canvas.height);

      data = canvas.toDataURL();
      if (data) {
        this.#dataCache.set(imgElem, data);
      }
      return data;
    }
  }

  #toOCRCacheKey(imgData) {
    let start = Math.min(30, imgData.length / 2);
    return imgData.substring(start, start + 20);
  }
}
