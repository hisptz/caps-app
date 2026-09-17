import React from 'react'
import styles from './StatusTag.module.css'
import { getStatusVisual } from './statusVisuals.utils'
import type { StatusAnimation } from './statusVisuals.utils'

function animationClassName(animation: StatusAnimation): string | undefined {
    if (animation === 'spin') {
        return styles.spin
    }
    if (animation === 'pulse') {
        return styles.pulse
    }
    if (animation === 'wiggle') {
        return styles.wiggle
    }
    return undefined
}

/** Decorative icon for a CAPS status string (pipelines, steps, tasks, schedules). */
export const StatusGlyph: React.FC<{ status: string }> = ({ status }) => {
    const visual = getStatusVisual(status)
    if (!visual) {
        return null
    }
    const { Icon, animation } = visual
    const anim = animationClassName(animation)
    return (
        <span className={styles.glyph} aria-hidden>
            <span className={anim}>
                <Icon />
            </span>
        </span>
    )
}
