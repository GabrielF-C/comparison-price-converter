class CP_Item {
  /**
   * @param {string} displayName
   * @param {string[]} names
   * @param {number[]} sampleMasses Sample masses in kg
   */
  constructor(displayName, names, sampleMasses) {
    this.displayName = displayName;
    this.names = CP_Item.#cleanItemNames(names);
    this.sampleMasses = sampleMasses;
  }

  get minMass() {
    return Math.min(...this.sampleMasses);
  }
  get maxMass() {
    return Math.max(...this.sampleMasses);
  }
  get avgMass() {
    return (
      this.sampleMasses.reduce((previous, current) => previous + current, 0) /
      this.sampleMasses.length
    );
  }

  static get massUnit() {
    return "kg";
  }

  /**
   * @param {string} itemTitle
   * @returns false | CP_Item
   */
  static find(itemTitle) {
    if (!itemTitle) {
      return false;
    }
    let cleanItemTitle = CP_Item.#cleanItemNames([itemTitle])[0];
    return this.allItems.find((i) => {
      for (let name of i.names) {
        if (cleanItemTitle.includes(name)) {
          return true;
        }
      }
      return false;
    });
  }

  /**
   * @param {string[]} itemNames
   * @returns {string[]}
   */
  static #cleanItemNames(itemNames) {
    let result = [];
    for (const n of itemNames) {
      result.push(n.trim().toLowerCase().replace("s", ""));
    }
    return result;
  }

  static get allItems() {
    return [
      new CP_Item(
        "Couronne brocoli",
        ["couronne brocoli", "couronne de brocoli", "broccoli crown"],
        [0.25, 0.3]
      ),
      new CP_Item("Mangue rouge", ["mangue rouge"], [0.4, 0.2]),
      new CP_Item("Concombre anglais", ["concombre anglais"], [0.3, 0.35]),
      new CP_Item(
        "Concombre des champs",
        ["concombre des champs", "concombre"],
        [0.4, 0.2]
      ),
      new CP_Item("Courgette verte", ["courgette verte"], [0.35, 0.15]),
      new CP_Item(
        "Poivron doux",
        [
          "poivron rouge doux",
          "poivron doux",
          "sweet pepper",
          "sweet baby pepper",
        ],
        [0.15, 0.25, 0.13, 0.15]
      ),
      new CP_Item("Poireaux", ["poireaux"], [0.3, 0.32]),
      new CP_Item("Chou-fleur", ["chou-fleur", "cauliflower"], [0.75, 0.5]),
      new CP_Item("Pamplemousse rouge", ["pamplemousse rouge"], [0.4, 0.25]),
      new CP_Item("Avocat", ["avocat"], [0.2, 0.15]),
    ];
  }
}
