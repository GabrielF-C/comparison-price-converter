class CP_ComparisonPriceParser {
  #maxParentRecursionLevel;
  #maxChildRecursionLevel;
  #cpStringRegExp;
  #cpNumbersRegExp;

  /**
   * @param {number} maxParentRecursionLevel
   * @param {number} maxChildRecursionLevel
   * @param {RegExp} cpStringRegExp
   * @param {RegExp} cpNumbersRegExp
   */
  constructor(
    maxParentRecursionLevel,
    maxChildRecursionLevel,
    cpStringRegExp,
    cpNumbersRegExp
  ) {
    this.#maxParentRecursionLevel = maxParentRecursionLevel;
    this.#maxChildRecursionLevel = maxChildRecursionLevel;
    this.#cpStringRegExp = cpStringRegExp;
    this.#cpNumbersRegExp = cpNumbersRegExp;
  }

  /**
   * @param {HTMLElement} elem
   * @param {number?} recursionLevel
   * @param {HTMLElement[]?} visitedElems
   * @returns { { price: number, quantity: number, quantityUnit: string, element: HTMLElement }[] | false } List of comparison prices or false if parsing failed
   */
  parseComparisonPriceFromElem(elem, recursionLevel = 1, visitedElems = []) {
    let comparisonPrice = false;

    if (elem && !visitedElems.includes(elem)) {
      visitedElems.push(elem);

      // Try to parse the string
      comparisonPrice = this.parseComparisonPriceFromString(elem.innerText);

      if (comparisonPrice) {
        for (let cp of comparisonPrice) {
          cp.element = elem;
        }
      } else {
        // If parsing failed, try checking parents and children
        if (recursionLevel <= this.#maxParentRecursionLevel) {
          // Check parents
          comparisonPrice = this.parseComparisonPriceFromElem(
            elem.parentElement,
            recursionLevel + 1
          );
        }

        if (
          !comparisonPrice &&
          recursionLevel <= this.#maxChildRecursionLevel
        ) {
          // Check children
          for (let child of elem.children) {
            comparisonPrice = this.parseComparisonPriceFromElem(
              child,
              recursionLevel + 1
            );
            if (comparisonPrice) {
              break;
            }
          }
        }
      }
    }

    return comparisonPrice;
  }

  /**
   * @param {string} str
   * @returns { { price: number, quantity: number, quantityUnit: string, element: HTMLElement }[] | false } List of comparison prices or false if parsing failed
   */
  parseComparisonPriceFromString(str) {
    let comparisonPrice = false;

    // Validate string
    if (str?.length && str.length <= 30) {
      let matches = str.match(this.#cpStringRegExp);

      if (matches?.length) {
        for (let m of matches) {
          // Normalize
          if (m.includes("¢")) {
            m = `0.${m}`;
          }
          m = m
            .replace(/-|¢|\$|\s+/g, "")
            .replace(/,/g, ".")
            .toLowerCase()
            .trim();

          // Parse
          let numbers = m.match(this.#cpNumbersRegExp);
          let quantityUnit = "";
          for (let i = m.length - 1; i >= 0; --i) {
            if (!isNaN(parseInt(m.charAt(i))) || m.charAt(i) === "/") {
              quantityUnit = m.substring(i + 1).trim();
              break;
            }
          }

          if (quantityUnit) {
            if (comparisonPrice === false) {
              comparisonPrice = [];
            }
            comparisonPrice.push({
              price: parseFloat(numbers[0]),
              quantity: parseFloat(numbers[1] ?? 1),
              quantityUnit,
            });
          }
        }
      }
    }

    return comparisonPrice;
  }
}
