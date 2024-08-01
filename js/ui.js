class CP_UserInterface {
  #initialState;
  #massUnits;
  #volumeUnits;
  #onQuantityChange;
  #onMassUnitChange;
  #onVolumeUnitChange;
  #onMinimize;

  displayElem;

  get itemTitleElem() {
    return this.displayElem.querySelector(".item-title");
  }
  get priceDiplayElem() {
    return this.displayElem.querySelector("span");
  }

  /**
   *
   * @param {{positionTop: number, positionLeft: number, isMinimized: boolean, pickedQuantity: number, pickedMassUnit: string, pickedVolumeUnit: string}} initialState
   * @param {(e: Event, input: HTMLElement) => void} onQuantityChange
   * @param {(e: Event, input: HTMLElement) => void} onMassUnitChange
   * @param {(e: Event, input: HTMLElement) => void} onVolumeUnitChange
   * @param {(e: Event) => void} onMinimize
   */
  constructor(
    initialState,
    massUnits,
    volumeUnits,
    onQuantityChange,
    onMassUnitChange,
    onVolumeUnitChange,
    onMinimize
  ) {
    this.#initialState = initialState;
    this.#massUnits = massUnits;
    this.#volumeUnits = volumeUnits;
    this.#onQuantityChange = onQuantityChange;
    this.#onMassUnitChange = onMassUnitChange;
    this.#onVolumeUnitChange = onVolumeUnitChange;
    this.#onMinimize = onMinimize;
  }

  init() {
    this.displayElem = this.#makeDisplayElem();
    this.displayElem.append(this.#makeItemTitleDisplayArea());
    this.displayElem.append(this.#makePriceDisplayArea());
    this.displayElem.append(this.#makeMinimizedIcon());
    this.displayElem.append(this.#makeUnitPicker());

    document.body.append(this.displayElem);
  }

  toggleUnitPicker() {
    this.displayElem.classList.toggle("drag-enabled");
    this.displayElem.classList.toggle("move-cursor");
    this.displayElem.querySelector(".unit-picker").classList.toggle("hidden");
    this.itemTitleElem.classList.toggle("hidden");
    this.priceDiplayElem.classList.toggle("hidden");
  }

  /**
   * @param {false | { price: number, quantity: number, quantityUnit: string, element: HTMLElement, itemTitle: string | false }[]} comparisonPrices
   */
  showComparisonPrices(comparisonPrices) {
    if (!comparisonPrices?.length) {
      return;
    }

    this.priceDiplayElem.innerText = "";
    if (comparisonPrices[0].itemTitle) {
      let cleanItemTitle = comparisonPrices[0].itemTitle.trim();
      if (cleanItemTitle.length > 50) {
        cleanItemTitle = cleanItemTitle.substring(0, 50) + "...";
      }
      this.itemTitleElem.innerText = cleanItemTitle;
    } else {
      this.itemTitleElem.innerText = "";
    }

    let shownPrices = [];
    for (let cp of comparisonPrices) {
      let priceStr = this.toDisplayString(cp);
      if (!shownPrices.includes(priceStr)) {
        shownPrices.push(priceStr);
        this.priceDiplayElem.innerText += `${priceStr}\n`;
      }
    }
  }

  /**
   * @param {{ price: number, quantity: number, quantityUnit: string }} comparisonPrice
   */
  toDisplayString(comparisonPrice) {
    if (!comparisonPrice) {
      return "???";
    }

    let p = comparisonPrice.price
      ? comparisonPrice.price.toPrecision(3)
      : "???";
    return `${p}$ / ${comparisonPrice.quantity}${comparisonPrice.quantityUnit}`;
  }

  removeAllHighlights() {
    for (let elem of document.querySelectorAll(".selected-for-conversion")) {
      elem.classList.remove("selected-for-conversion");
    }
  }

  highlightElem(elem) {
    elem?.classList.add("selected-for-conversion");
  }

  #makeDisplayElem() {
    let div = document.createElement("div");
    div.id = "converter-comparison-price-display";
    div.classList.add("move-cursor");
    div.title =
      "Survolez un prix pour convertir (ex: 4,56 $ / 1 lb)\n\nCliquez cette zone avec le bouton droit de la souris pour afficher les options\n\nVous pouvez drag&drop cette zone n'importe où sur la page";
    div.style.top = `${this.#initialState.positionTop}px`;
    div.style.left = `${this.#initialState.positionLeft}px`;
    return div;
  }

  #makeItemTitleDisplayArea() {
    let p = document.createElement("p");
    p.classList.add("item-title");
    if (this.#initialState.isMinimized) {
      p.classList.add("hidden");
    }
    return p;
  }

  #makePriceDisplayArea() {
    let span = document.createElement("span");
    if (this.#initialState.isMinimized) {
      span.classList.add("hidden");
    }
    span.innerText = this.displayElem.title;
    return span;
  }

  #makeMinimizedIcon() {
    let img = document.createElement("img");
    img.classList.add("icon-minimized");
    if (!this.#initialState.isMinimized) {
      img.classList.add("hidden");
    }
    img.src =
      "https://img.icons8.com/?size=100&id=47442&format=png&color=40C057";
    return img;
  }

  #makeUnitPicker() {
    let unitPickerElem = document.createElement("div");
    unitPickerElem.title =
      "Cliquez cette zone avec le bouton droit de la souris pour fermer les options et retourner au convertisseur";
    unitPickerElem.classList.add("unit-picker", "hidden");

    unitPickerElem.append(this.#makeQuantityInput());
    unitPickerElem.append(
      this.#makeUnitPickerCategory(
        "Masse",
        this.#massUnits,
        this.#onMassUnitChange,
        this.#initialState.pickedMassUnit
      )
    );
    unitPickerElem.append(document.createElement("hr"));
    unitPickerElem.append(
      this.#makeUnitPickerCategory(
        "Volume",
        this.#volumeUnits,
        this.#onVolumeUnitChange,
        this.#initialState.pickedVolumeUnit
      )
    );
    unitPickerElem.append(document.createElement("hr"));
    unitPickerElem.append(this.#makeMinimizeButton());

    return unitPickerElem;
  }

  #makeQuantityInput() {
    let div = document.createElement("div");

    let label = document.createElement("label");
    label.htmlFor = "quantity";
    label.innerText = "Quantité";
    div.append(label);

    let input = document.createElement("input");
    input.id = "quantity";
    input.type = "number";
    input.value = this.#initialState.pickedQuantity;
    input.min = 1;
    input.max = 1000;
    input.step = 10;
    input.addEventListener("change", (e) => this.#onQuantityChange(e, input));
    div.append(input);

    return div;
  }

  #makeUnitPickerCategory(
    title,
    units,
    inputOnChangeHandler,
    defaultUnitSymbol
  ) {
    let wrapperElem = document.createElement("div");

    let p = document.createElement("p");
    p.innerText = title;
    wrapperElem.append(p);

    let div = document.createElement("div");
    div.classList.add("unit-picker-category");
    wrapperElem.append(div);

    for (let unit of units) {
      let input = document.createElement("input");
      input.id = unit.symbol;
      input.type = "radio";
      input.name = title;
      input.checked = unit.symbol === defaultUnitSymbol;
      div.append(input);
      input.addEventListener("change", (e) => inputOnChangeHandler(e, input));

      let label = document.createElement("label");
      label.htmlFor = unit.symbol;
      label.innerText = `${unit.name} (${unit.symbol})`;
      div.append(label);
    }

    return wrapperElem;
  }

  #makeMinimizeButton() {
    let btn = document.createElement("button");
    btn.classList.add("minimize-btn");
    btn.type = "button";
    btn.innerText = "Minimiser";
    btn.addEventListener("click", this.#onMinimize);
    return btn;
  }
}
