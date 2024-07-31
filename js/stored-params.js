class CP_StoredParams {
  #setCookie(cname, cvalue, exdays = 400) {
    const d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
  }

  #getCookie(cname) {
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
    if (!setOnlyIfEmpty || this.#getter(paramName) === "")
      this.#setCookie(this.#getCookieName(paramName), val);
  }

  constructor(
    isMinimized,
    positionTop,
    positionLeft,
    pickedQuantity,
    pickedMassUnit,
    pickedVolumeUnit
  ) {
    this.isMinimizedLazy = isMinimized;
    this.positionTopLazy = positionTop;
    this.positionLeftLazy = positionLeft;
    this.pickedQuantityLazy = pickedQuantity;
    this.pickedMassUnitLazy = pickedMassUnit;
    this.pickedVolumeUnitLazy = pickedVolumeUnit;
  }

  get isMinimized() {
    return this.#getter("isMinimized") === "true";
  }
  set isMinimized(val) {
    this.#setter("isMinimized", val);
  }
  set isMinimizedLazy(val) {
    this.#setter("isMinimized", val, true);
  }

  get positionTop() {
    return this.#getter("positionTop");
  }
  set positionTop(val) {
    this.#setter("positionTop", val);
  }
  set positionTopLazy(val) {
    this.#setter("positionTop", val, true);
  }

  get positionLeft() {
    return this.#getter("positionLeft");
  }
  set positionLeft(val) {
    this.#setter("positionLeft", val);
  }
  set positionLeftLazy(val) {
    this.#setter("positionLeft", val, true);
  }

  get pickedQuantity() {
    return this.#getter("pickedQuantity");
  }
  set pickedQuantity(val) {
    this.#setter("pickedQuantity", val);
  }
  set pickedQuantityLazy(val) {
    this.#setter("pickedQuantity", val, true);
  }

  get pickedMassUnit() {
    return this.#getter("pickedMassUnit");
  }
  set pickedMassUnit(val) {
    this.#setter("pickedMassUnit", val);
  }
  set pickedMassUnitLazy(val) {
    this.#setter("pickedMassUnit", val, true);
  }

  get pickedVolumeUnit() {
    return this.#getter("pickedVolumeUnit");
  }
  set pickedVolumeUnit(val) {
    this.#setter("pickedVolumeUnit", val);
  }
  set pickedVolumeUnitLazy(val) {
    this.#setter("pickedVolumeUnit", val, true);
  }
}
