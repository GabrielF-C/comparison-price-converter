class CP_Logger {
  #msgHeader;
  #isDebugEnabled;

  /**
   * @param {string} msgHeader
   * @param {() => boolean} isDebugEnabled
   */
  constructor(msgHeader, isDebugEnabled) {
    this.#msgHeader = msgHeader;
    this.#isDebugEnabled = isDebugEnabled;
  }

  info(m, debugOnly = false) {
    if (!debugOnly || this.#isDebugEnabled()) {
      console.log(this.#msgHeader, m);
    }
  }
  warn(m, debugOnly = false) {
    if (!debugOnly || this.#isDebugEnabled()) {
      console.warn(this.#msgHeader, m);
    }
  }
  error(m, debugOnly = false) {
    if (!debugOnly || this.#isDebugEnabled()) {
      console.error(this.#msgHeader, m);
    }
  }
}
