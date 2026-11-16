import i18n from '@dhis2/d2-i18n'
import {
    IconSearch16,
    Input,
    SingleSelectField,
    SingleSelectOption,
} from '@dhis2/ui'
import React from 'react'
import type {
    WorkflowActiveFilter,
    WorkflowFilters,
    WorkflowLastRunFilter,
} from '@/modules/workflows/utils/workflowFilters'
import classes from '@/pages/WorkflowsPage/WorkflowsPage.module.css'

type Props = {
    filters: WorkflowFilters
    onChange: (filters: WorkflowFilters) => void
}

/** Search box plus status and last-execution filters above the workflows table. */
export function WorkflowsFilters({
    filters,
    onChange,
}: Props): React.ReactElement {
    return (
        <div className={classes.filters}>
            <label className={classes.searchField}>
                <span className={classes.visuallyHidden}>
                    {i18n.t('Search workflows')}
                </span>
                <Input
                    type="search"
                    name="workflow-search"
                    // @dhis2/ui types this as a DOM Element; it renders a React node
                    prefixIcon={(<IconSearch16 />) as unknown as Element}
                    placeholder={i18n.t('Search workflows')}
                    value={filters.search}
                    onChange={({ value }) =>
                        onChange({ ...filters, search: value ?? '' })
                    }
                />
            </label>
            <SingleSelectField
                label={i18n.t('Status')}
                selected={filters.active}
                onChange={({ selected }) =>
                    onChange({
                        ...filters,
                        active: selected as WorkflowActiveFilter,
                    })
                }
                className={classes.filterField}
            >
                <SingleSelectOption value="all" label={i18n.t('All')} />
                <SingleSelectOption value="active" label={i18n.t('Active')} />
                <SingleSelectOption
                    value="inactive"
                    label={i18n.t('Inactive')}
                />
            </SingleSelectField>
            <SingleSelectField
                label={i18n.t('Last execution')}
                selected={filters.lastRun}
                onChange={({ selected }) =>
                    onChange({
                        ...filters,
                        lastRun: selected as WorkflowLastRunFilter,
                    })
                }
                className={classes.filterField}
            >
                <SingleSelectOption value="any" label={i18n.t('Any result')} />
                <SingleSelectOption
                    value="COMPLETED"
                    label={i18n.t('Completed')}
                />
                <SingleSelectOption value="FAILED" label={i18n.t('Failed')} />
                <SingleSelectOption value="RUNNING" label={i18n.t('Running')} />
                <SingleSelectOption
                    value="CANCELLED"
                    label={i18n.t('Cancelled')}
                />
                <SingleSelectOption value="NEVER" label={i18n.t('Never run')} />
            </SingleSelectField>
        </div>
    )
}
