import React, { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { AddPipelinesPanel } from '@/modules/workflows/components/AddPipelinesPanel'
import type { Pipeline } from '@/shared/types/caps'

jest.mock('@dhis2/ui', () => ({
    Button: ({
        children,
        onClick,
        disabled,
        'aria-label': ariaLabel,
    }: {
        children?: React.ReactNode
        onClick?: () => void
        disabled?: boolean
        'aria-label'?: string
    }) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={ariaLabel}
        >
            {children}
        </button>
    ),
    Checkbox: ({
        label,
        checked,
        onChange,
    }: {
        label: React.ReactNode
        checked: boolean
        onChange: () => void
    }) => (
        <label>
            <input type="checkbox" checked={checked} onChange={onChange} />
            {label}
        </label>
    ),
    CircularLoader: () => <span>loading</span>,
    IconAdd16: () => null,
    IconCross16: () => null,
    IconSearch16: () => null,
    Input: ({
        value,
        onChange,
    }: {
        value: string
        onChange: (payload: { value: string }) => void
    }) => (
        <input
            type="search"
            value={value}
            onChange={(e) => onChange({ value: e.target.value })}
        />
    ),
    NoticeBox: ({
        children,
        title,
    }: {
        children?: React.ReactNode
        title?: string
    }) => (
        <div role="alert">
            {title}
            {children}
        </div>
    ),
}))

jest.mock('@dhis2/d2-i18n', () => ({
    __esModule: true,
    default: {
        t: (value: string, vars?: Record<string, unknown>) =>
            vars
                ? value.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
                      String(vars[key] ?? '')
                  )
                : value,
    },
}))

jest.mock('@dhis2/app-runtime', () => ({ useDataEngine: () => ({}) }))
jest.mock('react-router', () => ({ useNavigate: () => jest.fn() }))

const mockPipelines: { current: Pipeline[] } = { current: [] }
jest.mock('@/modules/pipelines/hooks/usePipelinesListQuery', () => ({
    usePipelinesListQuery: () => ({
        data: { pipelines: mockPipelines.current },
        isLoading: false,
        isError: false,
        error: null,
    }),
}))

const mockAdd = jest.fn()
jest.mock('@/modules/workflows/hooks/useWorkflows', () => ({
    useWorkflowMutations: () => ({
        addPipelineMutation: { mutateAsync: mockAdd },
    }),
}))

function pipeline(
    id: string,
    name: string,
    workflow: Pipeline['workflow'] = null
): Pipeline {
    return {
        id,
        name,
        description: null,
        isActive: true,
        concurrencyPolicy: 'ALLOW' as Pipeline['concurrencyPolicy'],
        createdAt: '',
        updatedAt: '',
        _count: { steps: 2, executions: 0, schedules: 0 },
        workflow,
    }
}

describe('AddPipelinesPanel', () => {
    let container: HTMLDivElement
    let root: Root

    beforeAll(() => {
        ;(
            globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
        ).IS_REACT_ACT_ENVIRONMENT = true
    })

    beforeEach(() => {
        container = document.createElement('div')
        document.body.appendChild(container)
        root = createRoot(container)
        mockAdd.mockReset()
        mockAdd.mockResolvedValue({})
    })

    afterEach(() => {
        act(() => root.unmount())
        container.remove()
    })

    const render = (onClose = jest.fn()) => {
        act(() => {
            root.render(<AddPipelinesPanel workflowId="w1" onClose={onClose} />)
        })
        return onClose
    }

    const button = (text: string) =>
        [...container.querySelectorAll('button')].find((b) =>
            b.textContent?.includes(text)
        )

    it('groups pipelines into addable, already here and in another workflow', () => {
        mockPipelines.current = [
            pipeline('p1', 'Rainfall'),
            pipeline('p2', 'Disease', { id: 'w1', name: 'This one' }),
            pipeline('p3', 'Population import', { id: 'w2', name: 'Other' }),
        ]
        render()
        expect(container.querySelectorAll('input[type=checkbox]')).toHaveLength(
            1
        )
        expect(container.textContent).toContain('Already in this workflow')
        expect(container.textContent).toContain('In another workflow')
        expect(container.textContent).toContain('In “Other”')
        expect(button('Add pipeline')?.disabled).toBe(true)
    })

    it('adds every ticked pipeline, then closes', async () => {
        mockPipelines.current = [pipeline('p1', 'A'), pipeline('p2', 'B')]
        const onClose = render()
        const boxes = container.querySelectorAll<HTMLInputElement>(
            'input[type=checkbox]'
        )
        act(() => boxes[0]!.click())
        act(() => boxes[1]!.click())
        const add = button('Add 2 pipelines')!
        expect(add.disabled).toBe(false)
        await act(async () => add.click())
        expect(mockAdd).toHaveBeenCalledTimes(2)
        expect(mockAdd).toHaveBeenCalledWith({ id: 'w1', pipelineId: 'p1' })
        expect(onClose).toHaveBeenCalled()
    })

    it('says so when the search matches nothing', () => {
        mockPipelines.current = [pipeline('p1', 'Rainfall')]
        render()
        const search =
            container.querySelector<HTMLInputElement>('input[type=search]')!
        act(() => {
            const setter = Object.getOwnPropertyDescriptor(
                HTMLInputElement.prototype,
                'value'
            )!.set!
            setter.call(search, 'no such pipeline')
            search.dispatchEvent(new Event('input', { bubbles: true }))
        })
        expect(container.textContent).toContain(
            'No pipeline matches “no such pipeline”'
        )
        act(() => button('Clear search')!.click())
        expect(container.querySelectorAll('input[type=checkbox]')).toHaveLength(
            1
        )
    })

    it('points to Pipelines when there is nothing to add', () => {
        mockPipelines.current = [
            pipeline('p2', 'Disease', { id: 'w1', name: 'This one' }),
        ]
        render()
        expect(container.textContent).toContain('No pipelines available yet')
        expect(button('Create a pipeline')).toBeDefined()
        expect(container.querySelector('input[type=search]')).toBeNull()
    })
})
