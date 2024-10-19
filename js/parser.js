class CP_ComparisonPriceParser {
  #cpStringRegExp;
  #cpNumbersRegExp;
  #maxParentRecursionLevel;
  #maxChildRecursionLevel;
  #itemTitleCommonAncestorSelector;
  #itemTitleCommonAncestorDistance;
  #itemTitleSelector;
  #excludedElements;
  #imgToTextAsync;

  /**
   * @param {RegExp} cpStringRegExp
   * @param {RegExp} cpNumbersRegExp
   * @param {number} maxParentRecursionLevel
   * @param {number} maxChildRecursionLevel
   * @param {string} itemTitleCommonAncestorSelector
   * @param {number} itemTitleCommonAncestorDistance
   * @param {string} itemTitleSelector
   * @param {Function} imgToTextAsync
   */
  constructor(
    cpStringRegExp,
    cpNumbersRegExp,
    maxParentRecursionLevel,
    maxChildRecursionLevel,
    itemTitleCommonAncestorSelector,
    itemTitleCommonAncestorDistance,
    itemTitleSelector,
    excludedElements,
    imgToTextAsync
  ) {
    this.#cpStringRegExp = cpStringRegExp;
    this.#cpNumbersRegExp = cpNumbersRegExp;
    this.#maxParentRecursionLevel = maxParentRecursionLevel;
    this.#maxChildRecursionLevel = maxChildRecursionLevel;
    this.#itemTitleCommonAncestorSelector = itemTitleCommonAncestorSelector;
    this.#itemTitleCommonAncestorDistance = itemTitleCommonAncestorDistance;
    this.#itemTitleSelector = itemTitleSelector;
    this.#excludedElements = excludedElements;
    this.#imgToTextAsync = imgToTextAsync;
  }

  /**
   * @param {HTMLElement} elem
   * @param {number?} recursionLevel
   * @param {HTMLElement[]?} visitedElems
   * @returns { { price: number, quantity: number, quantityUnit: string, element: HTMLElement, itemTitle: string|false }[] | false } List of comparison prices or false if parsing failed
   */
  async parseComparisonPricesFromElem(
    elem,
    recursionLevel = 1,
    visitedElems = []
  ) {
    let comparisonPrices = false;

    if (
      elem &&
      !visitedElems.includes(elem) &&
      !this.#excludedElements.includes(elem)
    ) {
      visitedElems.push(elem);

      // TODO: Reactivate img parsing
      if (false && elem instanceof HTMLImageElement) {
        // Try to parse the text in the image
        comparisonPrices = await this.parseComparisonPricesFromImg(elem);
      } else {
        // Try to parse the string
        comparisonPrices = this.parseComparisonPricesFromString(elem.innerText);
      }

      if (comparisonPrices) {
        let itemTitle = this.#findItemTitleForCP(elem);
        for (const cp of comparisonPrices) {
          cp.element = elem;
          cp.itemTitle = itemTitle;
        }
      } else {
        // If parsing failed, try checking parents and children
        if (recursionLevel <= this.#maxParentRecursionLevel) {
          // Check parents
          comparisonPrices = await this.parseComparisonPricesFromElem(
            elem.parentElement,
            recursionLevel + 1
          );
        }

        if (
          !comparisonPrices &&
          recursionLevel <= this.#maxChildRecursionLevel
        ) {
          // Check children
          for (let child of elem.children) {
            comparisonPrices = await this.parseComparisonPricesFromElem(
              child,
              recursionLevel + 1
            );
            if (comparisonPrices) {
              break;
            }
          }
        }
      }
    }

    return comparisonPrices;
  }

  async parseComparisonPricesFromImg(imgElem) {
    return this.parseComparisonPricesFromString(
      await this.#imgToTextAsync(imgElem)
    );
  }

  /**
   * @param {string} str
   * @returns { { price: number, quantity: number, quantityUnit: string }[] | false } List of comparison prices or false if parsing failed
   */
  parseComparisonPricesFromString(str) {
    let comparisonPrices = false;

    // Validate string
    if (str?.length && str.length <= 200) {
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
            if (comparisonPrices === false) {
              comparisonPrices = [];
            }
            comparisonPrices.push({
              price: parseFloat(numbers[0]),
              quantity: parseFloat(numbers[1] ?? 1),
              quantityUnit,
            });
          }
        }
      }
    }
    return comparisonPrices;
  }

  /**
   * @param {HTMLElement} elem
   * @param {number} recursionLevel
   * @returns {string}
   */
  #findItemTitleForCP(elem, recursionLevel = 1) {
    let title = false;

    if (elem?.matches(this.#itemTitleCommonAncestorSelector)) {
      let itemTitleElem = elem.querySelector(this.#itemTitleSelector);
      title = itemTitleElem?.innerText;
    } else if (
      recursionLevel < this.#itemTitleCommonAncestorDistance &&
      elem?.parentElement
    ) {
      title = this.#findItemTitleForCP(elem.parentElement, recursionLevel + 1);
    }

    return title;
  }
}
