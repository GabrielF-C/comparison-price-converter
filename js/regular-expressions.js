class CP_RegExps {
  /**
   * @param {string[]} supportedUnits Symbols of the supported units
   */
  constructor(supportedUnits) {
    let unitsMatchString = supportedUnits.join("|");

    this.comparisonPriceString =
      this.#makeComparisonPriceStringRegExp(unitsMatchString);
    this.comparisonPriceNumbers =
      this.#makeComparisonPriceNumbersRegExp(unitsMatchString);
    this.giantTigerQuantity =
      this.#makeGiantTigerQuantityRegExp(unitsMatchString);
    this.walmartQuantity = this.#makeWalmartQuantityRegExps(unitsMatchString);
  }

  #makeComparisonPriceStringRegExp(unitsMatchString) {
    return new RegExp(
      `\\d+?[,.]?\\d+?\\D*?/\\s*?\\d*?.*?(${unitsMatchString})`,
      "gi"
    );
  }

  #makeComparisonPriceNumbersRegExp() {
    return /\d*[.,]?\d+/gi;
  }

  #makeGiantTigerQuantityRegExp(unitsMatchString) {
    return new RegExp(`\\d+?.*?(${unitsMatchString})$`, "gi");
  }

  #makeWalmartQuantityRegExps(unitsMatchString) {
    return [
      new RegExp(`\\d+?[,.]?\\d+?.{0,1}(${unitsMatchString})$`, "gi"),
      new RegExp(`\\d+?.{0,1}(${unitsMatchString})$`, "gi"),
      new RegExp(`\\d+?.{0,1}(${unitsMatchString})`, "gi"),
    ];
  }
}
