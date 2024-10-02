// ==UserScript==
// @name         Comparison Price Converter
// @description  TamperMonkey script to convert comparison prices on the fly. Useful for groceries online !
// @author       Gabriel Fournier-Cloutier
// @icon         https://img.icons8.com/?size=100&id=47442&format=png&color=40C057
// @namespace    https://github.com/GabrielF-C/comparison-price-converter

// @version      20241001_1017
// @downloadURL  https://github.com/GabrielF-C/comparison-price-converter/raw/main/script.user.js
// @updateURL    https://github.com/GabrielF-C/comparison-price-converter/raw/main/script.user.js

// @resource     styles https://raw.githubusercontent.com/GabrielF-C/comparison-price-converter/main/css/styles.css

// @require      https://raw.githubusercontent.com/GabrielF-C/comparison-price-converter/main/js/logger.js
// @require      https://raw.githubusercontent.com/GabrielF-C/comparison-price-converter/main/js/drag-and-drop.js
// @require      https://raw.githubusercontent.com/GabrielF-C/comparison-price-converter/main/js/parser.js
// @require      https://raw.githubusercontent.com/GabrielF-C/comparison-price-converter/main/js/regular-expressions.js
// @require      https://raw.githubusercontent.com/GabrielF-C/comparison-price-converter/main/js/site-specific-params.js
// @require      https://raw.githubusercontent.com/GabrielF-C/comparison-price-converter/main/js/stored-params.js
// @require      https://raw.githubusercontent.com/GabrielF-C/comparison-price-converter/main/js/ui.js
// @require      https://raw.githubusercontent.com/GabrielF-C/comparison-price-converter/main/js/units.js
// @require      https://raw.githubusercontent.com/GabrielF-C/comparison-price-converter/main/js/items.js

// @match        https://www.maxi.ca/*
// @match        https://www.iga.net/*
// @match        https://www.superc.ca/*
// @match        https://www.metro.ca/*
// @match        https://www.walmart.ca/*
// @match        https://www.gianttiger.com/*

// @grant        GM_addStyle
// @grant        GM_getResourceText
// ==/UserScript==

(function () {
  "use strict";

  const logger = new CP_Logger("[CONVERTER]", isDebugModeEnabled);
  const storedParams = new CP_StoredParams(
    logger,
    {
      version: GM_info?.version,
      isMinimized: true,
      positionTop: 100,
      positionLeft: 60,
      pickedQuantity: 100,
      pickedMassUnit: CP_Unit.massUnits[0].symbol,
      pickedVolumeUnit: CP_Unit.volumeUnits[0].symbol
    }
  );
  const ui = new CP_UserInterface(
    storedParams,
    CP_Unit.massUnits,
    CP_Unit.volumeUnits,
    onQuantityChange,
    onMassUnitChange,
    onVolumeUnitChange,
    onMinimize
  );
  const siteSpecificParams = getSiteSpecificParams(
    isDebugModeEnabled() ? "test" : window.location.hostname
  );
  const regExps = new CP_RegExps(CP_Unit.allUnits.map((u) => u.symbol));
  const cpParser = new CP_ComparisonPriceParser(
    regExps.comparisonPriceString,
    regExps.comparisonPriceNumbers,
    siteSpecificParams.maxParentRecursionLevel,
    siteSpecificParams.maxChildRecursionLevel,
    siteSpecificParams.itemTitleCommonAncestorSelector,
    siteSpecificParams.itemTitleCommonAncestorDistance,
    siteSpecificParams.itemTitleSelector
  );

  main();

  function main() {
    // Init styles
    GM_addStyle(GM_getResourceText("styles"));

    // Init UI
    ui.init();
    makeDraggable(ui.displayElem, (top, left) => {
      storedParams.positionTop = top;
      storedParams.positionLeft = left;
    });

    // Init UI improvements
    if (siteSpecificParams.applyUIImprovements) {
      setInterval(() => {
        siteSpecificParams.applyUIImprovements();
      }, 2000);
    }

    // Init listeners
    document.addEventListener("mouseover", (e) => {
      if (ui.displayElem.contains(e.target) || storedParams.isMinimized) {
        return;
      }

      let comparisonPrices = cpParser.parseComparisonPricesFromElem(e.target);
      if (comparisonPrices) {
        for (let i = 0; i < comparisonPrices.length; ++i) {
          comparisonPrices[i] = convertComparisonPrice(comparisonPrices[i]);
        }

        ui.showComparisonPrices(comparisonPrices);
        ui.removeAllHighlights();
        for (let cp of comparisonPrices) {
          ui.highlightElem(cp.element);
        }
      }
    });

    ui.displayElem.addEventListener(
      "contextmenu",
      (e) => {
        e.preventDefault();

        if (storedParams.isMinimized) {
          ui.displayElem
            .querySelector(".item-title")
            .classList.remove("hidden");
          ui.priceDiplayElem.classList.remove("hidden");
          ui.displayElem.querySelector("img").classList.add("hidden");
          storedParams.isMinimized = false;
        } else {
          ui.toggleUnitPicker();
        }

        return false;
      },
      false
    );
  }

  function onQuantityChange(e, input) {
    if (
      parseFloat(input.value) < parseFloat(input.min) ||
      parseFloat(input.value) > parseFloat(input.max)
    ) {
      input.value = storedParams.pickedQuantity;
    } else {
      storedParams.pickedQuantity = input.value;
    }
  }

  function onMassUnitChange(e, input) {
    storedParams.pickedMassUnit = input.id;
  }

  function onVolumeUnitChange(e, input) {
    storedParams.pickedVolumeUnit = input.id;
  }

  function onMinimize(e) {
    storedParams.isMinimized = true;
    ui.removeAllHighlights();
    ui.toggleUnitPicker();
    ui.displayElem.querySelector(".item-title").classList.add("hidden");
    ui.priceDiplayElem.classList.add("hidden");
    ui.displayElem.querySelector("img").classList.remove("hidden");
  }

  function isDebugModeEnabled() {
    return typeof CONVERTER_TEST !== "undefined";
  }

  function convertComparisonPrice(cp) {
    let cpUnitCategory = CP_Unit.getCategory(cp.quantityUnit);
    let pickedUnit = null;

    switch (cpUnitCategory) {
      case "mass":
        pickedUnit = CP_Unit.fromSymbol(storedParams.pickedMassUnit);
        break;

      case "volume":
        pickedUnit = CP_Unit.fromSymbol(storedParams.pickedVolumeUnit);
        break;

      case "item": {
        // Always use picked mass unit as target for item conversion
        let item = CP_Item.find(cp.itemTitle);

        if (item) {
          cp.itemTitle =
            `(${item.avgMass.toPrecision(3)}${CP_Item.massUnit} / item)\n` +
            cp.itemTitle;
          cp.quantity = item.avgMass;
        } else {
          cp.price = false;
        }

        cp.quantityUnit = CP_Item.massUnit;
        pickedUnit = CP_Unit.fromSymbol(storedParams.pickedMassUnit);
        break;
      }
    }

    let newPrice;
    if (cp.price) {
      newPrice = CP_Unit.computeNewPrice(
        cp.price,
        cp.quantity,
        cp.quantityUnit,
        storedParams.pickedQuantity,
        pickedUnit
      );
    }

    return {
      price: newPrice,
      quantity: storedParams.pickedQuantity,
      quantityUnit: pickedUnit?.symbol,
      element: cp.element,
      itemTitle: cp.itemTitle,
    };
  }

  function getSiteSpecificParams(hostName) {
    switch (hostName) {
      case "www.maxi.ca":
        return new CP_SiteSpecificParams(
          2,
          3,
          `.chakra-linkbox:has([data-testid="product-image"])`,
          7,
          `[data-testid="product-title"]`
        );

      case "www.iga.net":
        return new CP_SiteSpecificParams(
          2,
          3,
          `.item-product__content`,
          7,
          `.js-ga-productname`
        );

      case "www.superc.ca":
      case "www.metro.ca":
        return new CP_SiteSpecificParams(
          2,
          3,
          `.pt__content--wrap`,
          7,
          `.head__title`
        );

      case "www.walmart.ca":
        return makeParamsForWalmart();

      case "www.gianttiger.com":
        return makeParamsForGiantTiger();

      case "test":
        return CONVERTER_TEST.siteSpecificParams;

      default:
        throw new Error(
          `Converter: No site specific params are defined for '${hostName}'`
        );
    }

    function makeParamsForWalmart() {
      return new CP_SiteSpecificParams(
        2,
        10,
        `[data-testid="list-view"]`,
        7,
        `[data-automation-id="product-title"]`,
        () => {
          for (let productElem of document.querySelectorAll(
            `[data-item-id] [data-testid="list-view"] > div > div:nth-child(2)`
          )) {
            if (productElem.querySelector(".injected-comparison-price")) {
              continue;
            }

            let priceElem = productElem.querySelector(
              `[data-automation-id="product-price"] > div:nth-child(1)`
            );
            let titleElem = productElem.querySelector(
              `[data-automation-id="product-title"]`
            );

            let div = document.createElement("div");
            div.classList.add("injected-comparison-price");
            div.style.flex = "1";

            // Get quantity from title, try each regex until we get a match
            let quantityRegExps = regExps.walmartQuantity;
            let quantityMatches = [];
            for (let reg of quantityRegExps) {
              quantityMatches = titleElem.innerText.match(reg);
              if (quantityMatches?.length) {
                break;
              }
            }

            // Check if we found a quantity in the title
            if (!quantityMatches?.length) {
              continue;
            }

            // Parse, convert and display comparison price
            let comparisonPrices = cpParser.parseComparisonPricesFromString(
              `${priceElem.innerText} / ${quantityMatches[0]}`
            );

            if (!comparisonPrices) {
              continue;
            }

            div.innerText = ui.toDisplayString(
              convertComparisonPrice(comparisonPrices[0])
            );

            // Remove some UI elems
            for (
              let elem = priceElem.nextSibling;
              elem;
              elem = elem.nextSibling
            ) {
              if (elem.nodeName === "#text") {
                continue;
              }

              let removeElem = true;
              let stringsToKeep = [
                "prix moyen",
                "coût final au poids",
                "avg price",
                "final cost by weight",
              ];
              for (let str of stringsToKeep) {
                if (elem.innerText?.toLowerCase().trim().includes(str)) {
                  removeElem = false;
                  break;
                }
              }

              if (removeElem) {
                elem.classList.add("marked-for-deletion-by-converter");
              }
            }
            for (let elem of document.querySelectorAll(
              ".marked-for-deletion-by-converter"
            )) {
              elem.remove();
            }

            // Insert comparison price
            priceElem?.parentElement?.after(div);
          }
        }
      );
    }

    function makeParamsForGiantTiger() {
      return new CP_SiteSpecificParams(
        2,
        10,
        `.product-tile__content`,
        7,
        `h2.product-tile__title body-bold-sm`,
        () => {
          for (let titleElem of document.querySelectorAll(
            ".product-tile__title"
          )) {
            let parent = titleElem.parentElement;
            let priceElem = parent?.querySelector("span.price__value");

            if (
              parent?.querySelector(".injected-comparison-price") ||
              !priceElem
            ) {
              continue;
            }

            let div = document.createElement("div");
            div.classList.add("injected-comparison-price");

            // Get quantity from title
            let quantityMatches = titleElem.innerText.match(
              regExps.giantTigerQuantity
            );
            if (quantityMatches?.length) {
              let comparisonPrices = cpParser.parseComparisonPricesFromString(
                `${priceElem.innerText} / ${quantityMatches[0]}`
              );
              if (comparisonPrices) {
                div.innerText = ui.toDisplayString(
                  convertComparisonPrice(comparisonPrices[0])
                );
                priceElem.after(div);
              }
            }
          }
        }
      );
    }
  }
})();
