// ==UserScript==
// @name         Comparison Price Converter
// @description  TamperMonkey script to convert comparison prices on the fly. Useful for groceries online !
// @author       Gabriel Fournier-Cloutier
// @icon         https://img.icons8.com/?size=100&id=47442&format=png&color=40C057

// @version      1.0.0
// @namespace    https://github.com/GabrielF-C/comparison-price-converter

// @resource     https://raw.githubusercontent.com/GabrielF-C/comparison-price-converter/main/css/styles.css

// @require      https://raw.githubusercontent.com/GabrielF-C/comparison-price-converter/main/js/drag-and-drop.js
// @require      https://raw.githubusercontent.com/GabrielF-C/comparison-price-converter/main/js/parser.js
// @require      https://raw.githubusercontent.com/GabrielF-C/comparison-price-converter/main/js/regular-expressions.js
// @require      https://raw.githubusercontent.com/GabrielF-C/comparison-price-converter/main/js/site-specific-params.js
// @require      https://raw.githubusercontent.com/GabrielF-C/comparison-price-converter/main/js/stored-params.js
// @require      https://raw.githubusercontent.com/GabrielF-C/comparison-price-converter/main/js/ui.js
// @require      https://raw.githubusercontent.com/GabrielF-C/comparison-price-converter/main/js/units.js

// @match        https://www.maxi.ca/*
// @match        https://www.iga.net/*
// @match        https://www.superc.ca/*
// @match        https://www.metro.ca/*
// @match        https://www.walmart.ca/*
// @match        https://www.gianttiger.com/*

// @grant        GM_addStyle
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
    siteSpecificParams.maxParentRecursionLevel,
    siteSpecificParams.maxChildRecursionLevel,
    regExps.comparisonPriceString,
    regExps.comparisonPriceNumbers
  );

  main();

  function main() {
    // Init styles
    GM_addStyle(GM_getResourceText("styles.css"));

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

      let comparisonPrice = cpParser.parseComparisonPriceFromElem(e.target);
      if (comparisonPrice) {
        for (let i = 0; i < comparisonPrice.length; ++i) {
          comparisonPrice[i] = convertComparisonPrice(comparisonPrice[i]);
        }
        ui.showComparisonPrice(comparisonPrice);
        ui.removeAllHighlights();
        for (let cp of comparisonPrice) {
          ui.highlightElem(cp.element);
        }
      }
    });

    ui.displayElem.addEventListener(
      "contextmenu",
      (e) => {
        e.preventDefault();

        if (storedParams.isMinimized) {
          ui.displayElem.querySelector("span").classList.remove("hidden");
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
    if (input.value < input.min || input.value > input.max) {
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
    ui.displayElem.querySelector("span").classList.add("hidden");
    ui.displayElem.querySelector("img").classList.remove("hidden");
  }

  function convertComparisonPrice(cp) {
    let pickedUnit =
      CP_Unit.getCategory(cp.quantityUnit) === "mass"
        ? CP_Unit.fromSymbol(storedParams.pickedMassUnit)
        : CP_Unit.fromSymbol(storedParams.pickedVolumeUnit);

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
      quantityUnit: pickedUnit.symbol,
    };
  }

  function getSiteSpecificParams() {
    switch (window.location.hostname) {
      case "www.walmart.ca":
        return makeParamsForWalmart();
      case "www.gianttiger.com":
        return makeParamsForGiantTiger();

      default:
        return new CP_SiteSpecificParams(2, 3);
    }

    function makeParamsForWalmart() {
      return new CP_SiteSpecificParams(2, 10, () => {
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
          let comparisonPrice = cpParser.parseComparisonPriceFromString(
            `${priceElem.innerText} / ${quantityMatches[0]}`
          );

          if (!comparisonPrice) {
            continue;
          }

          div.innerText = ui.toDisplayString(
            convertComparisonPrice(comparisonPrice[0])
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
      });
    }

    function makeParamsForGiantTiger() {
      return new CP_SiteSpecificParams(2, 10, () => {
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
            let comparisonPrice = cpParser.parseComparisonPriceFromString(
              `${priceElem.innerText} / ${quantityMatches[0]}`
            );
            if (comparisonPrice) {
              div.innerText = ui.toDisplayString(
                convertComparisonPrice(comparisonPrice[0])
              );
              priceElem.after(div);
            }
          }
        }
      });
    }
  }
})();
