import React from 'react'
import classes from './HandlerTag.module.css'
import { getHandlerTagTone } from '@/modules/handlers/utils/handlerTags'

export interface HandlerTagProps {
    label: string
}

export function HandlerTag({ label }: HandlerTagProps): React.ReactElement {
    return (
        <span className={`${classes.tag} ${classes[getHandlerTagTone(label)]}`}>
            {label}
        </span>
    )
}
