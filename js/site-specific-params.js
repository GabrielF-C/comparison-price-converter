class CP_SiteSpecificParams {
  maxParentRecursionLevel;
  maxChildRecursionLevel;
  applyUIImprovements;

  /**
   *
   * @param {number} maxParentRecursionLevel
   * @param {number} maxChildRecursionLevel
   * @param {null | () => void} applyUIImprovements
   */
  constructor(
    maxParentRecursionLevel,
    maxChildRecursionLevel,
    applyUIImprovements = null
  ) {
    this.maxParentRecursionLevel = maxParentRecursionLevel;
    this.maxChildRecursionLevel = maxChildRecursionLevel;
    this.applyUIImprovements = applyUIImprovements;
  }
}
