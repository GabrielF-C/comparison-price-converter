// ==UserScript==
// @name         Comparison Price Converter
// @description  TamperMonkey script to convert comparison prices on the fly. Useful for groceries online !
// @author       Gabriel Fournier-Cloutier
// @icon         https://img.icons8.com/?size=100&id=47442&format=png&color=40C057
// @namespace    https://github.com/GabrielF-C/comparison-price-converter

// @version      1.0.0
// @downloadURL  https://github.com/GabrielF-C/comparison-price-converter/raw/main/script.user.js
// @updateURL    https://github.com/GabrielF-C/comparison-price-converter/raw/main/script.user.js

// @resource     styles https://raw.githubusercontent.com/GabrielF-C/comparison-price-converter/main/css/styles.css

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

  const storedParams = new CP_StoredParams(
    false,
    100,
    60,
    100,
    CP_Unit.massUnits[0].symbol,
    CP_Unit.volumeUnits[0].symbol
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
  const siteSpecificParams = getSiteSpecificParams();
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
          ui.displayElem.querySelector(".item-title").classList.remove("hidden");
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

      case "item":
        // TODO: convert cp from item to mass
        pickedUnit = CP_Unit.fromSymbol(storedParams.pickedMassUnit);
        break;
    }

    let newPrice = CP_Unit.computeNewPrice(
      cp.price,
      cp.quantity,
      cp.quantityUnit,
      storedParams.pickedQuantity,
      pickedUnit
    );

    return {
      price: newPrice,
      quantity: storedParams.pickedQuantity,
      quantityUnit: pickedUnit?.symbol,
      element: cp.element,
    };
  }

  function getSiteSpecificParams() {
    switch (window.location.hostname) {
      case "www.maxi.ca":
        return new CP_SiteSpecificParams(
          2,
          3,
          `.product-tile__details__info`,
          7,
          `.product-tile__details__info__name__link`
        );

      case "www.iga.net":
        return new CP_SiteSpecificParams(
          2,
          3,
          `.item-product__content`,
          7,
          `.item-product__brand`
        );

      case "www.superc.ca":
      case "www.metro.ca":
        return new CP_SiteSpecificParams(
          2,
          3,
          `.pt__content--wrap`,
          7,
          `.content__head`
        );

      case "www.walmart.ca":
        return makeParamsForWalmart();

      case "www.gianttiger.com":
        return makeParamsForGiantTiger();

      default:
        throw new Error(
          `Converter: No site specific params are defined for '${window.location.hostname}'`
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
          priceElem.after(div);
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
