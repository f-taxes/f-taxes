/**
@license
Copyright (c) 2022 trading_peter
This program is available under Apache License Version 2.0

Spinner css code by the awesome:

The MIT License (MIT)

Copyright (c) 2014 Luke Haas

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

https://github.com/lukehaas/css-loaders
*/

import { LitElement, html, css } from 'lit';

/*
--tp-spinner-border-width | var | 4px | Thickness of the spinners border.
--tp-spinner-color1 | var | #81D4FA | Ring background.
--tp-spinner-color2 | var | #039BE5 | Darker ring segment.
--tp-spinner-width | var | 30px | Width of the spinner ring.
--tp-spinner-height | var | 30px | Height of the spinner ring.
*/
class TpSpinner extends LitElement {
  static get styles() {
    return [
      css`
        :host {
          display: inline-block;
        }

        .spinner {
          font-size: 10px;
          position: relative;
          text-indent: -9999em;
          border-top: var(--tp-spinner-border-width, 4px) solid var(--tp-spinner-color1, #81D4FA);
          border-right: var(--tp-spinner-border-width, 4px) solid var(--tp-spinner-color1, #81D4FA);
          border-bottom: var(--tp-spinner-border-width, 4px) solid var(--tp-spinner-color1, #81D4FA);
          border-left: var(--tp-spinner-border-width, 4px) solid var(--tp-spinner-color2, #039BE5);
          -webkit-transform: translateZ(0);
          -ms-transform: translateZ(0);
          transform: translateZ(0);
          -webkit-animation: spinnerAnimation 1.1s infinite linear;
          animation: spinnerAnimation 1.1s infinite linear;
          overflow: hidden;
        }

        .spinner,
        .spinner:after {
          border-radius: 50%;
          width: var(--tp-spinner-width, 30px);
          height: var(--tp-spinner-height, 30px);
        }

        @-webkit-keyframes spinnerAnimation {
          0% {
            -webkit-transform: rotate(0deg);
            transform: rotate(0deg);
          }
          100% {
            -webkit-transform: rotate(360deg);
            transform: rotate(360deg);
          }
        }

        @keyframes spinnerAnimation {
          0% {
            -webkit-transform: rotate(0deg);
            transform: rotate(0deg);
          }
          100% {
            -webkit-transform: rotate(360deg);
            transform: rotate(360deg);
          }
        }
      `
    ];
  }

  render() {
    return html`
      <div class="spinner"></div>
    `;
  }
}

window.customElements.define('tp-spinner', TpSpinner);
