import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorDetailsModal } from '@/pages/ExecutionDetailPage/components/ErrorDetailsModal'
import type { ExecutionError } from '@/shared/types/caps'

jest.mock('@dhis2/ui', () => {
    const passthrough =
        (Tag: 'div' | 'table' | 'thead' | 'tbody' | 'tr' | 'th' | 'td') =>
        ({ children }: { children?: React.ReactNode }) => <Tag>{children}</Tag>
    return {
        Modal: passthrough('div'),
        ModalTitle: passthrough('div'),
        ModalContent: passthrough('div'),
        ModalActions: passthrough('div'),
        ButtonStrip: passthrough('div'),
        Button: ({ children }: { children: React.ReactNode }) => (
            <button type="button">{children}</button>
        ),
        DataTable: passthrough('table'),
        DataTableHead: passthrough('thead'),
        DataTableBody: passthrough('tbody'),
        DataTableRow: passthrough('tr'),
        DataTableColumnHeader: passthrough('th'),
        DataTableCell: passthrough('td'),
    }
})

jest.mock('@dhis2/d2-i18n', () => ({
    __esModule: true,
    default: {
        t: (value: string, vars?: Record<string, string>) =>
            value.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
                String(vars?.[key] ?? '')
            ),
    },
}))

async function renderModal(error: ExecutionError): Promise<HTMLElement> {
    ;(
        globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    await act(async () => {
        root.render(
            <ErrorDetailsModal
                title="Step 3 — Upload"
                error={error}
                onClose={() => undefined}
            />
        )
    })
    return container
}

describe('ErrorDetailsModal', () => {
    it('shows the headline, upstream metadata and grouped conflicts', async () => {
        const container = await renderModal({
            errorMessage: 'DHIS2 rejected the data value import',
            errorStack: 'StepError: DHIS2 rejected the data value import',
            errorDetails: {
                source: 'dhis2',
                httpStatus: 409,
                totalConflicts: 9,
                conflicts: [
                    {
                        value: 'Org unit not found',
                        count: 8,
                        objects: ['ou0', 'ou1'],
                    },
                    {
                        value: 'Data element not found',
                        count: 1,
                        objects: ['de1'],
                    },
                ],
            },
        })

        const text = container.textContent ?? ''
        expect(text).toContain('DHIS2 rejected the data value import')
        expect(text).toContain('DHIS2')
        expect(text).toContain('409')
        expect(text).toContain('9 conflicts, 2 distinct')
        expect(text).toContain('Org unit not found')
        expect(text).toContain('ou0, ou1, …')
        expect(container.querySelectorAll('tbody tr')).toHaveLength(2)
        expect(text).toContain('Stack trace')
    })

    it('renders plain errors without detail sections', async () => {
        const container = await renderModal({
            errorMessage: 'boom',
            errorStack: null,
            errorDetails: null,
        })

        const text = container.textContent ?? ''
        expect(text).toContain('boom')
        expect(text).not.toContain('Stack trace')
        expect(container.querySelector('table')).toBeNull()
    })
})
