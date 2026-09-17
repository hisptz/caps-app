import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { RetryStepModal } from '@/pages/ExecutionDetailPage/components/RetryStepModal'

jest.mock('@dhis2/ui', () => ({
    Modal: ({ children }: { children: React.ReactNode }) => (
        <div role="dialog">{children}</div>
    ),
    ModalTitle: ({ children }: { children: React.ReactNode }) => (
        <h2>{children}</h2>
    ),
    ModalContent: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    ModalActions: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    ButtonStrip: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    Button: ({
        children,
        onClick,
        disabled,
    }: {
        children: React.ReactNode
        onClick?: () => void
        disabled?: boolean
    }) => (
        <button type="button" onClick={onClick} disabled={disabled}>
            {children}
        </button>
    ),
    NoticeBox: ({
        children,
        title,
    }: {
        children: React.ReactNode
        title?: string
    }) => (
        <div>
            {title}
            {children}
        </div>
    ),
}))

jest.mock('@dhis2/d2-i18n', () => ({
    __esModule: true,
    default: {
        t: (value: string, vars?: Record<string, string>) => {
            if (!vars) {
                return value
            }
            return value.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
                String(vars[key] ?? '')
            )
        },
    },
}))

describe('RetryStepModal', () => {
    it('renders confirmation copy for the target step', async () => {
        ;(
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true

        const container = document.createElement('div')
        document.body.appendChild(container)
        const root = createRoot(container)

        await act(async () => {
            root.render(
                <RetryStepModal
                    open
                    stepName="Import climate"
                    attemptNumber={2}
                    isPending={false}
                    errorMessage={null}
                    onClose={() => undefined}
                    onConfirm={() => undefined}
                />
            )
        })

        expect(container.textContent).toContain('Retry step?')
        expect(container.textContent).toContain('Import climate')
        expect(container.textContent).toContain('2')

        await act(async () => {
            root.unmount()
        })
        container.remove()
    })

    it('shows inline error when provided', async () => {
        ;(
            globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true

        const container = document.createElement('div')
        document.body.appendChild(container)
        const root = createRoot(container)

        await act(async () => {
            root.render(
                <RetryStepModal
                    open
                    stepName="Import climate"
                    attemptNumber={1}
                    isPending
                    errorMessage="Conflict"
                    onClose={() => undefined}
                    onConfirm={() => undefined}
                />
            )
        })

        expect(container.textContent).toContain('Conflict')

        await act(async () => {
            root.unmount()
        })
        container.remove()
    })
})
