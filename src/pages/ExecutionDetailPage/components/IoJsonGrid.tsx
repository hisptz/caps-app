import i18n from '@dhis2/d2-i18n'
import React from 'react'
import classes from '../ExecutionDetailPage.module.css'

type Props = {
    input: unknown
    output: unknown
}

export function IoJsonGrid({ input, output }: Props): React.ReactElement {
    return (
        <div className={classes.ioGrid}>
            <div>
                <strong>{i18n.t('Input')}</strong>
                <pre className={classes.jsonPre}>
                    {JSON.stringify(input, null, 2) ?? 'null'}
                </pre>
            </div>
            <div>
                <strong>{i18n.t('Output')}</strong>
                <pre className={classes.jsonPre}>
                    {JSON.stringify(output, null, 2) ?? 'null'}
                </pre>
            </div>
        </div>
    )
}
