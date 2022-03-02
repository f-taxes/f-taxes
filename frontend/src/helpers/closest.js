export const closest = (node, selector, pierce) => {
  const matches = node.matches || node.msMatchesSelector || node.oMatchesSelector;
  while (node) {
    if (matches.call(node, selector)) {
      return node;
    }
    if (pierce && !node.parentElement) {
      node = node.getRootNode();
      if (node) {
        node = node.host;
      }
    } else {
      node = node.parentElement;
    }
  }
};