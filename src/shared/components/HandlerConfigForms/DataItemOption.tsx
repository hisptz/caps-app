import i18n from '@dhis2/d2-i18n'
import {
    IconDimensionData16,
    IconDimensionIndicator16,
    IconDimensionProgramIndicator16,
} from '@dhis2/ui'
import React from 'react'
import classes from './DataItemOption.module.css'

export type DataItemType = 'DATA_ELEMENT' | 'INDICATOR' | 'PROGRAM_INDICATOR'

type OptionComponentProps = {
    value: string
    label: string
    index: number
    disabled: boolean
    highlighted: boolean
}

type OptionComponent = (props: OptionComponentProps) => React.JSX.Element

const ICONS: Record<DataItemType, React.FC<{ ariaLabel?: string }>> = {
    DATA_ELEMENT: IconDimensionData16,
    INDICATOR: IconDimensionIndicator16,
    PROGRAM_INDICATOR: IconDimensionProgramIndicator16,
}

function typeLabel(type: DataItemType): string {
    switch (type) {
        case 'DATA_ELEMENT':
            return i18n.t('Data element')
        case 'INDICATOR':
            return i18n.t('Indicator')
        case 'PROGRAM_INDICATOR':
            return i18n.t('Program indicator')
    }
}

function makeOption(type: DataItemType): OptionComponent {
    const Icon = ICONS[type]
    const title = typeLabel(type)
    function DataItemOption({
        label,
        disabled,
        highlighted,
    }: OptionComponentProps) {
        return (
            <span
                className={[
                    classes.option,
                    highlighted && classes.highlighted,
                    disabled && classes.disabled,
                ]
                    .filter(Boolean)
                    .join(' ')}
            >
                <span className={classes.icon} title={title}>
                    <Icon ariaLabel={title} />
                </span>
                <span className={classes.label}>{label}</span>
            </span>
        )
    }
    return DataItemOption
}

const OPTION_COMPONENTS: Record<DataItemType, OptionComponent> = {
    DATA_ELEMENT: makeOption('DATA_ELEMENT'),
    INDICATOR: makeOption('INDICATOR'),
    PROGRAM_INDICATOR: makeOption('PROGRAM_INDICATOR'),
}

export function dataItemOptionComponent(
    type: DataItemType | undefined
): OptionComponent | undefined {
    return type ? OPTION_COMPONENTS[type] : undefined
}
