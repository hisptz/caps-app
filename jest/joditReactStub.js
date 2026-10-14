// jodit-react 5.3.x points `main` at a file it does not ship, which Jest 27
// (no `exports` support) cannot resolve. CAPS never renders the rich text
// editor that @hisptz/dhis2-ui pulls it in for, so tests get a no-op.
module.exports = { __esModule: true, default: () => null }
