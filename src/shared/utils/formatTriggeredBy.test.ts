import { formatTriggeredBy } from './label.utils'

describe('formatTriggeredBy', () => {
    it('shows runs started by a connector as such', () => {
        expect(formatTriggeredBy('connector')).toBe('connector')
    })

    it('leaves other triggers as they are', () => {
        expect(formatTriggeredBy('scheduler')).toBe('scheduler')
        expect(formatTriggeredBy(null)).toBe('—')
    })
})
