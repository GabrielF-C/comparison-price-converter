class CP_SiteSpecificParams {
  /**
   * @param {number} maxParentRecursionLevel
   * @param {number} maxChildRecursionLevel
   * @param {string} itemTitleCommonAncestorSelector
   * @param {number} itemTitleCommonAncestorDistance
   * @param {string} itemTitleSelector
   * @param {null | () => void} applyUIImprovements
   */
  constructor(
    maxParentRecursionLevel,
    maxChildRecursionLevel,
    itemTitleCommonAncestorSelector,
    itemTitleCommonAncestorDistance,
    itemTitleSelector,
    applyUIImprovements = null
  ) {
    this.maxParentRecursionLevel = maxParentRecursionLevel;
    this.maxChildRecursionLevel = maxChildRecursionLevel;
    this.itemTitleCommonAncestorSelector = itemTitleCommonAncestorSelector;
    this.itemTitleCommonAncestorDistance = itemTitleCommonAncestorDistance;
    this.itemTitleSelector = itemTitleSelector;
    this.applyUIImprovements = applyUIImprovements;
  }
}
