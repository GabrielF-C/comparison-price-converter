(function () {
  const CSS_STYLES = `
    #converter-comparison-price-display {
      background-color: rgb(28 27 27 / 50%);
      text-align: center;
      word-wrap: break-word;
      border-radius: 8px;
      max-width: 205px;
      padding: 10px;
      position: fixed;
      z-index: 1000000000;
      color: white !important;
      font-size: 14px !important;
    }

    #converter-comparison-price-display .icon-minimized {
      width: 35px;
    }

    .hidden {
      display: none !important;
    }

    .move-cursor {
      cursor: move;
    }

    .unit-picker #quantity {
      color: black;
      border-radius: 0.6rem;
      margin-bottom: 20px;
      padding: 10px;
      width: 100%;
    }

    .unit-picker label {
      margin: 0;
      color: white;
    }

    .unit-picker p {
      color: white;
      font-weight: 700;
    }

    .unit-picker-category {
      display: grid;
      grid-template-columns: 10% 90%;
      column-gap: 10px;
      text-align: left;
    }

    .injected-comparison-price {
      color: grey;
      font-size: small;
    }

    .selected-for-conversion {
      background-color: #beffbe !important;
    }
  `.replace(/(\r\n|\n|\r)/gm, "");

  let style = document.createElement("style");
  style.innerText = CSS_STYLES;
  document.head.append(style);
})();
