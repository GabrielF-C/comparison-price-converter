class CP_Item {
  /**
   * @param {string} displayName
   * @param {string[]} names
   * @param {number[]} sampleMasses Sample masses in kg
   */
  constructor(displayName, names, sampleMasses) {
    this.displayName = displayName;
    this.names = names;
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

  static get allItems() {
    return [
      new CP_Item("Couronne brocoli", ["couronne brocoli"], [0.25, 0.3]),
      new CP_Item("Mangue rouge", ["mangue rouge"], [0.4, 0.2]),
      new CP_Item("Concombre anglais", ["concombre anglais"], [0.3, 0.35]),
      new CP_Item("Courgette verte", ["courgette verte"], [0.35, 0.15]),
      new CP_Item("Concombre des champs", ["concombre des champs"], [0.4, 0.2]),
      new CP_Item(
        "Poivron doux",
        ["poivron rouge doux", "poivron doux"],
        [0.15, 0.25, 0.13, 0.15]
      ),
      new CP_Item("Poireaux", ["poireaux"], [0.3, 0.32]),
      new CP_Item("Chou-fleur", ["chou-fleur"], [0.75, 0.5]),
      new CP_Item("Pamplemousse rouge", ["pamplemousse rouge"], [0.4, 0.25]),
      new CP_Item("Avocat", ["avocat"], [0.2, 0.15]),
    ];
  }
}
