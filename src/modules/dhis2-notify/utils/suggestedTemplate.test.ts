import {
    previousStepHandlerKey,
    suggestedNotifyTemplate,
} from '@/modules/dhis2-notify/utils/suggestedTemplate'

describe('suggestedNotifyTemplate', () => {
    it('tailors the text to the step it follows and keeps placeholders intact', () => {
        const { subject, message } = suggestedNotifyTemplate({
            previousHandlerKey: 'dhis2-data-upload',
        })
        expect(subject).toBe('{{pipelineName}}: new data in DHIS2')
        expect(message).toContain(
            'The pipeline "{{pipelineName}}" has imported new values into DHIS2.'
        )
        expect(message).toContain('Sent automatically by CAPS on {{date}}.')
        for (const token of [
            '{{input.imported}}',
            '{{input.updated}}',
            '{{pipelineName}}',
            '{{runUrl}}',
            '{{date}}',
        ]) {
            expect(message).toContain(token)
        }
    })

    it('uses the prediction text after a poll step', () => {
        const { subject, message } = suggestedNotifyTemplate({
            previousHandlerKey: 'prediction-poll',
        })
        expect(subject).toBe('{{pipelineName}}: new prediction ready')
        expect(message).not.toContain('@@')
    })

    it('keeps count placeholders inside translated sentences', () => {
        expect(
            suggestedNotifyTemplate({ previousHandlerKey: 'alert-generation' })
                .message
        ).toContain('generated {{input.count}} alerts')
    })

    it('falls back to a generic text for other steps', () => {
        expect(suggestedNotifyTemplate({}).subject).toBe(
            '{{pipelineName}}: run update'
        )
    })
})

describe('previousStepHandlerKey', () => {
    const steps = [
        { stepOrder: 0, handlerKey: 'prediction-trigger' },
        { stepOrder: 1, handlerKey: 'prediction-poll' },
        { stepOrder: 2, handlerKey: 'dhis2-notify' },
    ]

    it('returns the step right before the given position', () => {
        expect(previousStepHandlerKey(steps, 2)).toBe('prediction-poll')
        expect(previousStepHandlerKey(steps, 3)).toBe('dhis2-notify')
    })

    it('returns undefined for the first position', () => {
        expect(previousStepHandlerKey(steps, 0)).toBeUndefined()
    })
})
