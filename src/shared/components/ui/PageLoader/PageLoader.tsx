import { CircularLoader } from '@dhis2/ui'
import React from 'react'
import classes from './PageLoader.module.css'

type PageLoaderProps = {
    variant?: 'page' | 'content' | 'section'
}

export const PageLoader: React.FC<PageLoaderProps> = ({ variant = 'page' }) => (
    <div className={classes[variant]} role="status" aria-busy="true">
        <CircularLoader />
    </div>
)
