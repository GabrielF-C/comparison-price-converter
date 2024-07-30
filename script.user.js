// ==UserScript==
// @name         Comparison Price Converter
// @description  TamperMonkey script to convert comparison prices on the fly. Useful for groceries online !
// @author       Gabriel Fournier-Cloutier
// @version      1.0.0
// @namespace    https://github.com/GabrielF-C/comparison-price-converter
// @icon         https://img.icons8.com/?size=100&id=47442&format=png&color=40C057
// @match        https://www.maxi.ca/*
// @match        https://www.iga.net/*
// @match        https://www.superc.ca/*
// @match        https://www.metro.ca/*
// @match        https://www.walmart.ca/*
// @match        https://www.gianttiger.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const SUPPORTED_MASS_UNITS = [
        {
            name: "Gramme",
            symbol: "g",
            conversionTable: {
                g: 1,
                kg: 0.001,
                lb: 0.0022046226218487757,
                oz: 0.03527396194958041
            }
        },
        {
            name: "Kilogramme",
            symbol: "kg",
            conversionTable: {
                g: 1000,
                kg: 1,
                lb: 2.2046226218487757,
                oz: 35.27396194958041
            }
        },
        {
            name: "Livre",
            symbol: "lb",
            conversionTable: {
                g: 453.59237,
                kg: 0.45359237,
                lb: 1,
                oz: 16
            }
        },
        {
            name: "Once",
            symbol: "oz",
            conversionTable: {
                g: 28.349523125,
                kg: 0.028349523125,
                lb: 0.0625,
                oz: 1
            }
        },
    ];
    const SUPPORTED_VOLUME_UNITS = [
        {
            name: "Millilitre",
            symbol: "ml",
            conversionTable: {
                ml: 1,
                l: 0.001
            }
        },
        {
            name: "Litre",
            symbol: "l",
            conversionTable: {
                ml: 1000,
                l: 1
            }
        },
    ];
    const MIN_QUANTITY = 1;
    const MAX_QUANTITY = 1000;

    const MAX_PARENT_RECURSION_LEVEL = 2;
    const MAX_STRING_LENGTH = 30;
    const COMPARISON_PRICE_REGEX = new RegExp(`\\d+?[,.]?\\d+?\\D*?\/\\s*?\\d*?.*?(${getSupportedUnitSymbols().join("|")})`, "gi");

    const DISPLAY_ELEM_ID = "converter-comparison-price-display";
    const DISPLAY_HINT_MSG = "Survolez un prix pour convertir (ex: 4,56 $ / 1 lb)\n\nCliquez cette zone avec le bouton droit de la souris pour afficher les options\n\nVous pouvez drag&drop cette zone n'importe où sur la page";
    const UNIT_PICKER_HINT_MSG = "Cliquez cette zone avec le bouton droit de la souris pour fermer les options et retourner au convertisseur";

    const UI_IMPROVEMENT_INJECT_DELAY_MS = 2000;

    const COOKIE_PREFIX = "comparison_price_converter_";
    let storedParams = {
        getCookieName(paramName) { return `${COOKIE_PREFIX}${paramName}`; },
        getter(paramName) { return getCookie(this.getCookieName(paramName)); },
        setter(paramName, val, setOnlyIfEmpty = false) { if (!setOnlyIfEmpty || this.getter(paramName) === "") setCookie(this.getCookieName(paramName), val); },

        get isMinimized() { return this.getter("isMinimized") === "true"; },
        set isMinimized(val) { this.setter("isMinimized", val); },
        set isMinimizedLazy(val) { this.setter("isMinimized", val, true); },

        get positionTop() { return this.getter("positionTop"); },
        set positionTop(val) { this.setter("positionTop", val); },
        set positionTopLazy(val) { this.setter("positionTop", val, true); },

        get positionLeft() { return this.getter("positionLeft"); },
        set positionLeft(val) { this.setter("positionLeft", val); },
        set positionLeftLazy(val) { this.setter("positionLeft", val, true); },

        get pickedQuantity() { return this.getter("pickedQuantity"); },
        set pickedQuantity(val) { this.setter("pickedQuantity", val); },
        set pickedQuantityLazy(val) { this.setter("pickedQuantity", val, true); },

        get pickedMassUnit() { return this.getter("pickedMassUnit"); },
        set pickedMassUnit(val) { this.setter("pickedMassUnit", val); },
        set pickedMassUnitLazy(val) { this.setter("pickedMassUnit", val, true); },

        get pickedVolumeUnit() { return this.getter("pickedVolumeUnit"); },
        set pickedVolumeUnit(val) { this.setter("pickedVolumeUnit", val); },
        set pickedVolumeUnitLazy(val) { this.setter("pickedVolumeUnit", val, true); },
    };
    let unitPickerIsVisible = false;

    initStoredParams();
    injectStyles();
    injectUI();
    injectUIImprovements();
    initListeners();

    function getDisplayElem() {
        return document.getElementById(DISPLAY_ELEM_ID);
    }

    function initStoredParams() {
        storedParams.isMinimizedLazy = false;
        storedParams.positionTopLazy = 100;
        storedParams.positionLeftLazy = 60;
        storedParams.pickedQuantityLazy = 100;
        storedParams.pickedMassUnitLazy = SUPPORTED_MASS_UNITS[0].symbol;
        storedParams.pickedVolumeUnitLazy = SUPPORTED_VOLUME_UNITS[0].symbol;
    }

    function initListeners() {
        let displayElem = getDisplayElem();

        document.addEventListener("mouseover", (e) => {
            if (displayElem.contains(e.target)) {
                return;
            }

            let comparisonPrice = parseComparisonPriceFromElem(e.target);
            if (comparisonPrice) {
                comparisonPrice = convertComparisonPrice(comparisonPrice);
                showComparisonPrice(comparisonPrice);
                removeAllHighlights();
                for (let cp of comparisonPrice) {
                    highlightElem(cp.element);
                }
            }
        });

        displayElem.addEventListener("contextmenu", (e) => {
            e.preventDefault();

            if (storedParams.isMinimized) {
                getDisplayElem().querySelector("span").classList.remove("hidden");
                getDisplayElem().querySelector("img").classList.add("hidden");
                storedParams.isMinimized = false;
            } else {
                toggleUnitPicker();
            }

            return false;
        }, false);
    }

    function toggleUnitPicker() {
        let displayElem = getDisplayElem();
        unitPickerIsVisible = !unitPickerIsVisible;
        displayElem.classList.toggle("move-cursor");
        displayElem.querySelector(".unit-picker").classList.toggle("hidden");
        displayElem.querySelector("span").classList.toggle("hidden");
    }

    function injectStyles() {
        let style = document.createElement('style');
        style.innerText = `
            #${DISPLAY_ELEM_ID} {
                background-color: rgb(28 27 27 / 50%);
                text-align: center;
                word-wrap: break-word;
                border-radius: 8px;
                max-width: 205px;
                padding: 10px;
                position: fixed;
                z-index: 1000000000;
                color: white !important;
                font-size: 14px !important;
            }

            #${DISPLAY_ELEM_ID} .icon-minimized {
                width: 35px;
            }

            .hidden {
                display: none !important;
            }

            .move-cursor {
                cursor: move;
            }

            .unit-picker #quantity {
                color: black;
                border-radius: 0.6rem;
                margin-bottom: 20px;
                padding: 10px;
                width: 100%;
            }

            .unit-picker label {
                margin: 0;
                color: white;
            }

            .unit-picker p {
                color: white;
                font-weight: 700;
            }

            .unit-picker-category {
                display: grid;
                grid-template-columns: 10% 90%;
                column-gap: 10px;
                text-align: left;
            }

            .injected-comparison-price {
                color: grey;
                font-size: small;
            }

            .selected-for-conversion {
                background-color: #beffbe !important;
            }
        `.replace(/(\r\n|\n|\r)/gm, '');
        document.head.append(style);
    }

    function injectUI() {
        // Display elem
        let displayElem = document.createElement('div');
        displayElem.id = DISPLAY_ELEM_ID;
        displayElem.classList.add("move-cursor");
        displayElem.title = DISPLAY_HINT_MSG;
        displayElem.style.top = `${storedParams.positionTop}px`;
        displayElem.style.left = `${storedParams.positionLeft}px`;

        // Display elem text area
        let span = document.createElement('span');
        if (storedParams.isMinimized) {
            span.classList.add("hidden");
        }
        span.innerText = DISPLAY_HINT_MSG;
        displayElem.append(span);

        // Image to show when minimized
        let img = document.createElement('img');
        img.classList.add("hidden", "icon-minimized");
        if (storedParams.isMinimized) {
            img.classList.remove("hidden");
        }
        img.src = "https://img.icons8.com/?size=100&id=47442&format=png&color=40C057";
        displayElem.append(img);

        // Unit picker
        let unitPickerElem = document.createElement('div');
        unitPickerElem.title = UNIT_PICKER_HINT_MSG;
        unitPickerElem.classList.add("unit-picker", "hidden");
        displayElem.append(unitPickerElem);

        // --- Quantity input
        let quantityInputWrapperElem = document.createElement('div');

        let label = document.createElement('label');
        label.htmlFor = "quantity";
        label.innerText = "Quantité";
        quantityInputWrapperElem.append(label);

        let input = document.createElement('input');
        input.id = "quantity";
        input.type = "number";
        input.value = storedParams.pickedQuantity;
        input.min = MIN_QUANTITY;
        input.max = MAX_QUANTITY;
        input.step = 10;
        input.addEventListener("change", (e) => {
            if (input.value < MIN_QUANTITY || input.value > MAX_QUANTITY) {
                input.value = storedParams.pickedQuantity;
            } else {
                storedParams.pickedQuantity = input.value;
            }
        });
        quantityInputWrapperElem.append(input);

        unitPickerElem.append(quantityInputWrapperElem);

        // --- Mass units
        unitPickerElem.append(makeUnitPickerCategory("Masse", SUPPORTED_MASS_UNITS, (e, input) => { storedParams.pickedMassUnit = input.id }, storedParams.pickedMassUnit));

        // --- Divider
        unitPickerElem.append(document.createElement('hr'));

        // --- Volume units
        unitPickerElem.append(makeUnitPickerCategory("Volume", SUPPORTED_VOLUME_UNITS, (e, input) => { storedParams.pickedVolumeUnit = input.id }, storedParams.pickedVolumeUnit));

        // --- Divider
        unitPickerElem.append(document.createElement('hr'));

        // --- Minimize button
        let btn = document.createElement('button');
        btn.type = "button";
        btn.innerText = "Minimiser";
        btn.addEventListener("click", (e) => {
            storedParams.isMinimized = true;
            toggleUnitPicker();
            getDisplayElem().querySelector("span").classList.add("hidden");
            getDisplayElem().querySelector("img").classList.remove("hidden");
        });
        unitPickerElem.append(btn);

        // Init UI
        makeDraggable(displayElem);
        document.body.append(displayElem);
    }

    function makeUnitPickerCategory(title, units, inputOnChangeHandler, defaultUnitSymbol) {
        let wrapperElem = document.createElement('div');

        let p = document.createElement('p');
        p.innerText = title;
        wrapperElem.append(p);

        let div = document.createElement('div');
        div.classList.add("unit-picker-category");
        wrapperElem.append(div);

        for (let unit of units) {
            let input = document.createElement('input');
            input.id = unit.symbol;
            input.type = "radio";
            input.name = title;
            input.checked = unit.symbol === defaultUnitSymbol;
            div.append(input);
            input.addEventListener("change", (e) => inputOnChangeHandler(e, input));

            let label = document.createElement('label');
            label.htmlFor = unit.symbol;
            label.innerText = `${unit.name} (${unit.symbol})`;
            div.append(label);
        }

        return wrapperElem;
    }

    function injectUIImprovements() {
        switch (window.location.hostname) {
            case "www.gianttiger.com":
                setInterval(() => {
                    injectGiantTigerImprovements();
                }, UI_IMPROVEMENT_INJECT_DELAY_MS);
                break;

            case "www.walmart.ca":
                setInterval(() => {
                    injectWalmartImprovements();
                }, UI_IMPROVEMENT_INJECT_DELAY_MS);
                break;
        }

        function injectGiantTigerImprovements() {
            for (let productTitleElem of document.querySelectorAll(".product-tile__title")) {
                if (!productTitleElem.parentElement?.querySelector(".injected-comparison-price")) {
                    let pricingValueElem = productTitleElem.parentElement?.querySelector("span.price__value");
                    if (pricingValueElem) {
                        let div = document.createElement("div");
                        div.classList.add("injected-comparison-price");

                        // Get quantity from title
                        let quantityMatches = productTitleElem.innerText.match(new RegExp(`\\d+?.*?(${getSupportedUnitSymbols().join("|")})$`, "gi"));
                        if (quantityMatches?.length) {
                            let comparisonPrice = parseComparisonPriceFromString(`${pricingValueElem.innerText} / ${quantityMatches[0]}`);
                            if (comparisonPrice) {
                                div.innerText = toDisplayString(convertComparisonPrice(comparisonPrice)[0]);
                                pricingValueElem.after(div);
                            }
                        }
                    }
                }
            }
        }

        function injectWalmartImprovements() {
            for (let productInfoElem of document.querySelectorAll(`[data-item-id] [data-testid="list-view"] > div > div:nth-child(2)`)) {
                if (!productInfoElem.querySelector(".injected-comparison-price")) {
                    let priceElem = productInfoElem.querySelector(`[data-automation-id="product-price"] > div:nth-child(1)`);
                    let titleElem = productInfoElem.querySelector(`[data-automation-id="product-title"]`);

                    let div = document.createElement("div");
                    div.classList.add("injected-comparison-price");
                    div.style.flex = "1";

                    // Get quantity from title, try each regex until we get a match
                    let quantityRegExps = [
                        new RegExp(`\\d+?[,.]?\\d+?.{0,1}(${getSupportedUnitSymbols().join("|")})$`, "gi"),
                        new RegExp(`\\d+?.{0,1}(${getSupportedUnitSymbols().join("|")})$`, "gi"),
                        new RegExp(`\\d+?.{0,1}(${getSupportedUnitSymbols().join("|")})`, "gi")
                    ];
                    let quantityMatches = [];
                    for (let reg of quantityRegExps) {
                        quantityMatches = titleElem.innerText.match(reg);
                        if (quantityMatches?.length) {
                            break;
                        }
                    }

                    // Check if we found a quantity in the title
                    if (quantityMatches?.length) {
                        // Parse, convert and display comparison price
                        let comparisonPrice = parseComparisonPriceFromString(`${priceElem.innerText} / ${quantityMatches[0]}`);
                        if (comparisonPrice) {
                            div.innerText = toDisplayString(convertComparisonPrice(comparisonPrice)[0]);

                            // Remove some UI elems
                            for (let elem = priceElem.nextSibling; elem; elem = elem.nextSibling) {
                                if (elem.nodeName === '#text') {
                                    continue;
                                }

                                let removeElem = true;
                                let stringsToKeep = [
                                    "prix moyen",
                                    "coût final au poids",
                                    "avg price",
                                    "final cost by weight"
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
                            for (let elem of document.querySelectorAll(".marked-for-deletion-by-converter")) {
                                elem.remove();
                            }

                            // Insert comparison price
                            priceElem.after(div);
                        }
                    }
                }
            }
        }
    }

    function getMaxChildrenRecursionLevel() {
        switch (window.location.hostname) {
            case "www.walmart.ca":
            case "www.gianttiger.com":
                return 10;
                break;

            default:
                return 3;
                break;
        }
    }

    // valid format: "price / quantity unit"
    // returns: [{ price: number, quantity: number, quantityUnit: string, element: HTMLElement }...] or false if the parsing failed
    function parseComparisonPriceFromElem(elem, recursionLevel = 1, visitedElems = []) {
        let comparisonPrice = false;

        if (elem && !visitedElems.includes(elem)) {
            visitedElems.push(elem);

            // Try to parse the string
            comparisonPrice = parseComparisonPriceFromString(elem.innerText);

            if (comparisonPrice) {
                for (let cp of comparisonPrice) {
                    cp.element = elem;
                }
            } else {
                // If parsing failed, try checking parents and children
                if (recursionLevel <= MAX_PARENT_RECURSION_LEVEL) {
                    // Check parents
                    comparisonPrice = parseComparisonPriceFromElem(elem.parentElement, recursionLevel + 1);
                }

                if (!comparisonPrice && recursionLevel <= getMaxChildrenRecursionLevel()) {
                    // Check children
                    for (let child of elem.children) {
                        comparisonPrice = parseComparisonPriceFromElem(child, recursionLevel + 1);
                        if (comparisonPrice) {
                            break;
                        }
                    }
                }
            }
        }

        return comparisonPrice;
    }

    // returns: [{ price: float, quantity: float, quantityUnit: string }...] or false if the parsing failed
    function parseComparisonPriceFromString(str) {
        let comparisonPrice = false;

        // Validate string
        if (str?.length && str.length <= MAX_STRING_LENGTH) {
            let matches = str.match(COMPARISON_PRICE_REGEX);

            if (matches?.length) {
                for (let m of matches) {
                    // Normalize
                    if (m.includes('¢')) {
                        m = `0.${m}`;
                    }
                    m = m.replace(/\-|\¢|\$|\s+/g, '')
                        .replace(/\,/g, '.')
                        .toLowerCase()
                        .trim();

                    // Parse
                    let numbers = m.match(/\d*[\.\,]?\d+/gi);
                    let quantityUnit = "";
                    for (let i = m.length - 1; i >= 0; --i) {
                        if (!isNaN(parseInt(m.charAt(i))) || m.charAt(i) === "/") {
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
                            quantityUnit
                        });
                    }
                }
            }
        }

        return comparisonPrice;
    }

    function convertComparisonPrice(comparisonPrice) {
        // FIXME: Check that the unit is supported

        let pickedQuantity = getPickedQuantity();
        for (let cp of comparisonPrice) {
            let pickedUnit = getPickedUnitForCategory(getUnitSymbolCategory(cp.quantityUnit));
            if (cp.quantityUnit !== pickedUnit.symbol || cp.quantity != pickedQuantity) {
                let x = 1 / pickedUnit.conversionTable[cp.quantityUnit];
                let y = pickedQuantity / (cp.quantity * x);

                cp.price = y * cp.price;
                cp.quantityUnit = pickedUnit.symbol;
                cp.quantity = pickedQuantity;
            }
        }
        return comparisonPrice;
    }



    function getPickedUnitForCategory(c) {
        switch (c) {
            case "mass":
                return getPickedMassUnit();
            case "volume":
                return getPickedVolumeUnit();
        }
        return false;
    }

    function getUnitSymbolCategory(s) {
        for (let u of SUPPORTED_MASS_UNITS) {
            if (u.symbol === s) {
                return "mass";
            }
        }
        for (let u of SUPPORTED_VOLUME_UNITS) {
            if (u.symbol === s) {
                return "volume";
            }
        }
        return "not supported";
    }

    function getPickedMassUnit() {
        let pickedUnitSymbol = getDisplayElem().querySelectorAll("input:checked")[0].id;
        for (let u of SUPPORTED_MASS_UNITS) {
            if (u.symbol === pickedUnitSymbol) {
                return u;
            }
        }
    }

    function getPickedVolumeUnit() {
        let pickedUnitSymbol = getDisplayElem().querySelectorAll("input:checked")[1].id;
        for (let u of SUPPORTED_VOLUME_UNITS) {
            if (u.symbol === pickedUnitSymbol) {
                return u;
            }
        }
    }

    function getPickedQuantity() {
        return getDisplayElem().querySelector('input[id="quantity"]').value;
    }

    function showComparisonPrice(comparisonPrice) {
        let displayElem = getDisplayElem();
        displayElem.querySelector('span').innerText = "";

        let shownPrices = [];
        for (let cp of comparisonPrice) {
            let priceStr = toDisplayString(cp);
            if (!shownPrices.includes(priceStr)) {
                shownPrices.push(priceStr);
                displayElem.querySelector('span').innerText += `${priceStr}\n`;
            }
        }
    }

    function toDisplayString(comparisonPrice) {
        return `${comparisonPrice.price.toPrecision(3)}$ / ${comparisonPrice.quantity}${comparisonPrice.quantityUnit}`;
    }

    function removeAllHighlights() {
        for (let elem of document.querySelectorAll(".selected-for-conversion")) {
            elem.classList.remove("selected-for-conversion");
        }
    }

    function highlightElem(elem) {
        elem.classList.add("selected-for-conversion");
    }

    function getSupportedUnitSymbols() {
        let symbols = [];
        for (let s of SUPPORTED_MASS_UNITS) {
            symbols.push(s.symbol);
        }
        for (let s of SUPPORTED_VOLUME_UNITS) {
            symbols.push(s.symbol);
        }
        return symbols;
    }

    function makeDraggable(elmnt) {
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        setInterval(() => {
            moveInbounds();
        }, 3000);

        elmnt.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            if (unitPickerIsVisible) {
                return;
            }

            e = e || window.event;
            e.preventDefault();
            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // call a function whenever the cursor moves:
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // set the element's new position:
            let top = elmnt.offsetTop - pos2;
            if (top < 0) {
                top = 0;
            }
            if (top + elmnt.offsetHeight > window.innerHeight) {
                top = window.innerHeight - elmnt.offsetHeight;
            }

            let left = elmnt.offsetLeft - pos1;
            if (left < 0) {
                left = 0;
            }
            if (left + elmnt.offsetWidth > window.innerWidth) {
                left = window.innerWidth - elmnt.offsetWidth;
            }

            elmnt.style.top = top + "px";
            elmnt.style.left = left + "px";

            storedParams.positionTop = top;
            storedParams.positionLeft = left;
        }

        function closeDragElement() {
            /* stop moving when mouse button is released:*/
            document.onmouseup = null;
            document.onmousemove = null;
        }

        function moveInbounds() {
            let top = elmnt.offsetTop;
            if (top < 0) {
                top = 0;
            }
            if (top + elmnt.offsetHeight > window.innerHeight) {
                top = window.innerHeight - elmnt.offsetHeight;
            }

            let left = elmnt.offsetLeft;
            if (left < 0) {
                left = 0;
            }
            if (left + elmnt.offsetWidth > window.innerWidth) {
                left = window.innerWidth - elmnt.offsetWidth;
            }

            elmnt.style.top = top + "px";
            elmnt.style.left = left + "px";

            storedParams.positionTop = top;
            storedParams.positionLeft = left;
        }
    }

    function setCookie(cname, cvalue, exdays = 400) {
        const d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        let expires = "expires="+d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }

    function getCookie(cname) {
        let name = cname + "=";
        let ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }
})();
