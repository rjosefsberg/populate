// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// jsdom doesn't implement layout, so ProseMirror (used by the rich-text editor) crashes
// when it tries to scroll the caret into view. Stub these out with harmless no-ops/zeros.
if (typeof window !== 'undefined') {
    window.HTMLElement.prototype.scrollIntoView = window.HTMLElement.prototype.scrollIntoView || function () {};
    // jsdom doesn't implement ResizeObserver; React Flow relies on it to size the canvas.
    window.ResizeObserver = window.ResizeObserver || class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
    Range.prototype.getBoundingClientRect = () => ({ top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 });
    Range.prototype.getClientRects = () => ({
        length: 0,
        item: () => null,
        [Symbol.iterator]: function* () {},
    });
}
