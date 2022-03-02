/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0
*/

/**
 * Helps to position elements relative to each other.
 */
export const Position = function(superClass) {
  return class extends superClass {

    _posFixed(anchor, el, options) {
      options = Object.assign({
        valign: 'top',
        halign: 'middle',
        spacing: 0
      }, options);

      let top, left, fixLeft = 0, fixTop = 0, compLeft = 0, compTop = 0;
      el.style.position = 'fixed';
      el.style.zIndex = 1001;

      // Test if the target is in a different stacking context.
      el.style.left = '0px';
      el.style.top = '0px';
      const elRect = el.getBoundingClientRect();

      if (elRect.left > 0 || elRect.top > 0) {
        fixLeft = elRect.left;
        fixTop = elRect.top;
      }

      const anchorRect = anchor.getBoundingClientRect();
      if (options.valign === 'top') {
        top = anchorRect.top - elRect.height - options.spacing;

        // Move popup down a little bit if there issn't enough room over the anchor.
        if (top < 0) {
          compTop = Math.abs(top);
          top = 0;
        }
      }

      if (options.valign === 'bottom') {
        top = anchorRect.top + anchorRect.height + options.spacing;

        // Move popup up a little bit if there issn't enough room under the anchor.
        if (top + elRect.height > window.innerHeight) {
          compTop = top + elRect.height - window.innerHeight;
          top -= compTop;
        }
      }

      if (options.halign === 'left') {
        left = anchorRect.left;
      }

      if (options.halign === 'middle') {
        left = anchorRect.left - elRect.width / 2 + anchorRect.width / 2;
      }

      if (options.halign === 'right') {
        left = anchorRect.left + anchorRect.width - elRect.width;
      }

      if (left + elRect.width > window.innerWidth) {
        compLeft = left + elRect.width - window.innerWidth;
        left -= compLeft;
      }

      if (left < 0) {
        compLeft = Math.abs(left);
        left = 0;
      }

      el.style.top = (top - fixTop) + 'px';
      el.style.left = (left - fixLeft) + 'px';

      // Return info object about how much the position had to compensate to fit on the page.
      return {
        compLeft: compLeft,
        compTop: compTop
      };
    }
  };
}
