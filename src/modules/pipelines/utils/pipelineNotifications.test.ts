import type { HandlerDescriptor } from '@/capsApi/types'
import { createPipelineStepFormSchema } from '@/modules/pipeline-detail/schemas/stepFormSchema'
import {
    readFailureRecipients,
    withFailureRecipients,
} from '@/modules/pipelines/utils/pipelineNotifications'

describe('pipeline failure notifications config', () => {
    it('reads failure recipients and tolerates missing or invalid config', () => {
        expect(
            readFailureRecipients({
                notifications: { onFailure: { userGroups: ['g1'] } },
            })
        ).toEqual({ users: [], userGroups: ['g1'] })
        expect(readFailureRecipients(undefined)).toEqual({
            users: [],
            userGroups: [],
        })
        expect(
            readFailureRecipients({ notifications: { onFailure: 'x' } })
        ).toEqual({ users: [], userGroups: [] })
    })

    it('replaces recipients while keeping other config keys', () => {
        const next = withFailureRecipients(
            {
                other: 1,
                notifications: {
                    onFailure: { users: ['u1'], userGroups: ['old'] },
                },
            },
            { users: ['u2'], userGroups: [] }
        )
        expect(next).toEqual({
            other: 1,
            notifications: { onFailure: { users: ['u2'], userGroups: [] } },
        })
    })

    it('drops onFailure when no recipients remain', () => {
        expect(
            withFailureRecipients(
                { notifications: { onFailure: { userGroups: ['g1'] } } },
                { users: [], userGroups: [] }
            )
        ).toEqual({ notifications: {} })
    })
})

describe('dhis2-notify step validation', () => {
    const handlers: HandlerDescriptor[] = [
        {
            key: 'dhis2-notify',
            displayName: 'DHIS2 Notify',
            description: '',
            tags: [],
            queueName: 'step.dhis2-notify',
            schemas: { config: { type: 'object' } },
        },
    ]
    const schema = createPipelineStepFormSchema(handlers)
    const base = { stepOrder: 0, name: 'Notify', handlerKey: 'dhis2-notify' }

    it('requires at least one recipient', () => {
        const result = schema.safeParse({
            ...base,
            handlerConfig: { recipients: { userGroups: [] } },
        })
        expect(result.success).toBe(false)
        expect(result.error?.issues[0]?.path).toEqual([
            'handlerConfig',
            'recipients',
            'userGroups',
        ])
    })

    it('accepts a config with only a user or only a user group', () => {
        for (const recipients of [{ userGroups: ['g1'] }, { users: ['u1'] }]) {
            expect(
                schema.safeParse({ ...base, handlerConfig: { recipients } })
                    .success
            ).toBe(true)
        }
    })
})
