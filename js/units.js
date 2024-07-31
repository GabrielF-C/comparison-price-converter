class CP_MassConversionTable {
  /**
   * @param {{g: number, kg: number, lb: number, oz: number}} table
   */
  constructor(table) {
    this.g = table.g;
    this.kg = table.kg;
    this.lb = table.lb;
    this.oz = table.oz;
  }
}

class CP_VolumeConversionTable {
  /**
   * @param {{ml: number, l: number}} table
   */
  constructor(table) {
    this.ml = table.ml;
    this.l = table.l;
  }
}

class CP_Unit {
  /**
   * @param {string} name
   * @param {string} symbol
   * @param {CP_MassConversionTable | CP_VolumeConversionTable} conversionTable
   */
  constructor(name, symbol, conversionTable) {
    this.name = name;
    this.symbol = symbol;
    this.conversionTable = conversionTable;
  }

  static fromSymbol(symbol) {
    return this.allUnits.find((u) => u.symbol === symbol);
  }

  static getCategory(symbol) {
    let u = CP_Unit.massUnits.find((u) => u.symbol === symbol);
    if (u) {
      return "mass";
    }

    u = CP_Unit.volumeUnits.find((u) => u.symbol === symbol);
    if (u) {
      return "volume";
    }

    return "not supported";
  }

  /**
   * @param {number} price
   * @param {number} quantity
   * @param {string} unitSymbol
   * @param {number} newQuantity
   * @param {CP_Unit} newUnit
   * @returns {false | number}
   */
  static computeNewPrice(price, quantity, unitSymbol, newQuantity, newUnit) {
    if (!newUnit.conversionTable.hasOwnProperty(unitSymbol)) {
      return false;
    }

    let newPrice = price;

    // If units are different or quantities are different
    if (unitSymbol !== newUnit.symbol || quantity != newQuantity) {
      let x = 1 / newUnit.conversionTable[unitSymbol];
      let y = newQuantity / (quantity * x);

      newPrice = y * price;
    }

    return newPrice;
  }

  static get allUnits() {
    return CP_Unit.massUnits.concat(CP_Unit.volumeUnits);
  }

  static get massUnits() {
    return [
      new CP_Unit(
        "Gramme",
        "g",
        new CP_MassConversionTable({
          g: 1,
          kg: 0.001,
          lb: 0.00220462262184878,
          oz: 0.03527396194958041,
        })
      ),
      new CP_Unit(
        "Kilogramme",
        "kg",
        new CP_MassConversionTable({
          g: 1000,
          kg: 1,
          lb: 2.2046226218487757,
          oz: 35.27396194958041,
        })
      ),
      new CP_Unit(
        "Livre",
        "lb",
        new CP_MassConversionTable({
          g: 453.59237,
          kg: 0.45359237,
          lb: 1,
          oz: 16,
        })
      ),
      new CP_Unit(
        "Once",
        "oz",
        new CP_MassConversionTable({
          g: 28.349523125,
          kg: 0.028349523125,
          lb: 0.0625,
          oz: 1,
        })
      ),
    ];
  }

  static get volumeUnits() {
    return [
      new CP_Unit(
        "Millilitre",
        "ml",
        new CP_VolumeConversionTable({
          ml: 1,
          l: 0.001,
        })
      ),
      new CP_Unit(
        "Litre",
        "l",
        new CP_VolumeConversionTable({
          ml: 1000,
          l: 1,
        })
      ),
    ];
  }
}
