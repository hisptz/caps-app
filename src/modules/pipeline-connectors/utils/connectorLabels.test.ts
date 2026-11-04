import {
    describeConnectorRunTime,
    describeConnectorTrigger,
} from './connectorLabels'

describe('describeConnectorRunTime', () => {
    it('shows a waiting run’s check time without HTML-escaping the date', () => {
        const label = describeConnectorRunTime({
            status: 'WAITING',
            checkAt: '2026-10-29T15:15:17Z',
            evaluatedAt: null,
        })
        expect(label).toMatch(/^Checks at /)
        expect(label).not.toContain('&#x2F;')
        expect(label).toContain(
            new Date('2026-10-29T15:15:17Z').toLocaleString()
        )
    })

    it('shows when a decided run was checked', () => {
        expect(
            describeConnectorRunTime({
                status: 'FIRED',
                checkAt: '2026-10-29T15:00:00Z',
                evaluatedAt: '2026-10-29T15:00:02Z',
            })
        ).toBe(new Date('2026-10-29T15:00:02Z').toLocaleString())
    })
})

describe('describeConnectorTrigger', () => {
    it('describes when the connector reacts and any wait', () => {
        expect(
            describeConnectorTrigger({ on: 'COMPLETED', delayMinutes: 0 })
        ).toBe('When it succeeds')
        expect(
            describeConnectorTrigger({ on: 'FAILED', delayMinutes: 120 })
        ).toBe('When it fails, wait 2 hour(s)')
    })
})
