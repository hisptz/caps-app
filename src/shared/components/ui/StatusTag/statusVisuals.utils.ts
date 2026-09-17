import {
    IconArrowRightMulti16,
    IconBlock16,
    IconCheckmark16,
    IconCheckmarkCircle16,
    IconClockHistory16,
    IconCross16,
    IconError16,
    IconLaunch16,
    IconQueue16,
    IconSync16,
    IconUser16,
} from '@dhis2/ui'
import type { IconProps } from '@dhis2/ui-icons'
import type React from 'react'

export type StatusAnimation = 'spin' | 'pulse' | 'wiggle' | null

export interface StatusVisual {
    Icon: React.FC<IconProps>
    animation: StatusAnimation
}

const STATUS_VISUALS: Record<string, StatusVisual> = {
    PENDING: { Icon: IconQueue16, animation: 'pulse' },
    RUNNING: { Icon: IconSync16, animation: 'spin' },
    AWAITING_STEP: { Icon: IconUser16, animation: 'wiggle' },
    PAUSED: { Icon: IconBlock16, animation: null },
    COMPLETED: { Icon: IconCheckmarkCircle16, animation: null },
    SUCCEEDED: { Icon: IconCheckmark16, animation: null },
    FAILED: { Icon: IconError16, animation: null },
    CANCELLED: { Icon: IconCross16, animation: null },
    TIMED_OUT: { Icon: IconClockHistory16, animation: null },
    SKIPPED: { Icon: IconArrowRightMulti16, animation: null },
    ACTIVE: { Icon: IconLaunch16, animation: null },
}

export function getStatusVisual(status: string): StatusVisual | null {
    return STATUS_VISUALS[status] ?? null
}
