import React from 'react'

const svgProps = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    'aria-hidden': true,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
} as const

export type TemplateIconKind =
    | 'instance-pull'
    | 'climate-analytics'
    | 'prediction'
    | 'full'
    | 'template'
    | 'empty'

/** Line icons for the ways to start a workflow. */
export function TemplateIcon({
    kind,
    size = 20,
}: {
    kind: TemplateIconKind
    size?: number
}): React.ReactElement {
    const props = { ...svgProps, width: size, height: size }
    switch (kind) {
        case 'instance-pull':
            return (
                <svg {...props}>
                    <ellipse cx="7" cy="6" rx="4" ry="2" />
                    <path d="M3 6v5c0 1.1 1.8 2 4 2s4-.9 4-2V6" />
                    <path d="M13 12h5m0 0l-2.5-2.5M18 12l-2.5 2.5" />
                    <rect x="17" y="16" width="5" height="5" rx="1" />
                </svg>
            )
        case 'climate-analytics':
            return (
                <svg {...props}>
                    <path d="M5.5 10.5a3.5 3.5 0 011-6.86A4.5 4.5 0 0115.9 5.5h.1a3.5 3.5 0 010 7H5.5z" />
                    <path d="M9 16.5v4M12 15.5v5M15 17.5v3" />
                </svg>
            )
        case 'prediction':
            return (
                <svg {...props}>
                    <path d="M3.5 17.5l5-6 4 3.5 7.5-9" />
                    <path d="M16 6h4.5v4.5" />
                </svg>
            )
        case 'full':
            return (
                <svg {...props}>
                    <rect x="2.5" y="4" width="6" height="5" rx="1" />
                    <rect x="2.5" y="15" width="6" height="5" rx="1" />
                    <rect x="15.5" y="9.5" width="6" height="5" rx="1" />
                    <path d="M8.5 6.5h2.5c.8 0 1.5.7 1.5 1.5v3c0 .6.4 1 1 1h2" />
                    <path d="M8.5 17.5h2.5c.8 0 1.5-.7 1.5-1.5v-3c0-.6.4-1 1-1h2" />
                </svg>
            )
        case 'template':
            return (
                <svg {...props}>
                    <rect x="3" y="3.5" width="18" height="6" rx="1.2" />
                    <rect x="3" y="13.5" width="8" height="7" rx="1.2" />
                    <rect x="14" y="13.5" width="7" height="7" rx="1.2" />
                </svg>
            )
        case 'empty':
            return (
                <svg {...props}>
                    <rect
                        x="3.5"
                        y="3.5"
                        width="17"
                        height="17"
                        rx="1.6"
                        strokeDasharray="3 3"
                    />
                    <path d="M12 8.5v7M8.5 12h7" />
                </svg>
            )
    }
}
