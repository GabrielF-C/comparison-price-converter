class CP_BaseStoredParams {
  /** @type {string} */
  version;
  /** @type {boolean} */
  isMinimized;
  /** @type {number} */
  positionTop;
  /** @type {number} */
  positionLeft;
  /** @type {number} */
  pickedQuantity;
  /** @type {string} */
  pickedMassUnit;
  /** @type {string} */
  pickedVolumeUnit;
}

class CP_StoredParams extends CP_BaseStoredParams {
  /** @type {boolean} */
  #failedToSetCookies = false;
  /** @type {CP_Logger} */
  #logger;
  /** @type {CP_BaseStoredParams} */
  #defaultValues;

  #setCookie(cname, cvalue, exdays = 400) {
    const d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    let expires = "expires=" + d.toUTCString();

    if (this.#failedToSetCookies) {
      this[`_${cname}`] = cvalue;
    } else {
      document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }

    if (!this.#failedToSetCookies && !document.cookie?.length) {
      this.#logger.warn(
        "Could not set stored parameters in cookies. Params will not be stored between page reloads."
      );
      this.#failedToSetCookies = true;
      this[`_${cname}`] = cvalue;
    }
  }

  #getCookie(cname) {
    if (this.#failedToSetCookies) {
      return this[`_${cname}`] ?? "";
    }

    let name = cname + "=";
    let ca = document.cookie.split(";");
    for (const element of ca) {
      let c = element;
      while (c.startsWith(" ")) {
        c = c.substring(1);
      }
      if (c.startsWith(name)) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

  #getCookieName(paramName) {
    return `comparison_price_converter_${paramName}`;
  }
  #getter(paramName) {
    return this.#getCookie(this.#getCookieName(paramName));
  }
  #setter(paramName, val, setOnlyIfEmpty = false) {
    if (!setOnlyIfEmpty || this.#getter(paramName) === "") {
      this.#setCookie(this.#getCookieName(paramName), val);
      if (this.#failedToSetCookies)
        this.#logger.warn(`Stored param: ${paramName}=${val}`);
    }
  }

  #setAll(values, setOnlyIfEmpty) {
    for (let p of Object.getOwnPropertyNames(values)) {
      this.#setter(p, values[p], setOnlyIfEmpty);
    }
  }

  /**
   * @param {CP_Logger} logger
   * @param {CP_BaseStoredParams} defaultValues
   */
  constructor(logger, defaultValues) {
    super();

    this.#logger = logger;
    this.#defaultValues = defaultValues;
    this.#setAll(defaultValues, true);

    for (let p of Object.getOwnPropertyNames(defaultValues)) {
      delete this[p];

      let g;
      if (typeof defaultValues[p] === "boolean") {
        g = () => this.#getter(p) === "true";
      } else {
        g = () => this.#getter(p);
      }

      Object.defineProperty(this, p, {
        get() {
          return g(p);
        },
        set(value) {
          this.#setter(p, value);
        },
      });
    }
  }

  reset() {
    this.#setAll(this.#defaultValues, false);
  }
}
