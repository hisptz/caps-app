import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
} from '@dhis2/ui'
import React from 'react'
import classes from '../ExecutionDetailPage.module.css'
import type { ExecutionError } from '@/shared/types/caps'

export type ErrorTarget = {
    title: string
    error: ExecutionError
}

type Props = ErrorTarget & {
    onClose: () => void
}

export function ErrorDetailsModal({
    title,
    error,
    onClose,
}: Props): React.ReactElement {
    const details = error.errorDetails ?? {}
    const conflicts = details.conflicts ?? []
    const meta = [
        details.source && {
            label: i18n.t('Source'),
            value: details.source.toUpperCase(),
        },
        details.httpStatus && {
            label: i18n.t('HTTP status'),
            value: String(details.httpStatus),
        },
        details.request && {
            label: i18n.t('Request'),
            value: details.request,
        },
    ].filter((m): m is { label: string; value: string } => Boolean(m))

    return (
        <Modal large onClose={onClose} position="middle">
            <ModalTitle>{title}</ModalTitle>
            <ModalContent>
                <p className={classes.errorHeadline}>{error.errorMessage}</p>

                {meta.length > 0 && (
                    <dl className={classes.errorMeta}>
                        {meta.map((m) => (
                            <div key={m.label}>
                                <dt>{m.label}</dt>
                                <dd>{m.value}</dd>
                            </div>
                        ))}
                    </dl>
                )}

                {details.description && (
                    <>
                        <p className={classes.modalErrorLabel}>
                            {i18n.t('Upstream response')}
                        </p>
                        <pre className={classes.modalErrorPre}>
                            {details.description}
                        </pre>
                    </>
                )}

                {conflicts.length > 0 && (
                    <>
                        <p className={classes.modalErrorLabel}>
                            {i18n.t(
                                '{{total}} conflicts, {{groups}} distinct',
                                {
                                    total: String(
                                        details.totalConflicts ??
                                            conflicts.reduce(
                                                (n, c) => n + c.count,
                                                0
                                            )
                                    ),
                                    groups: String(conflicts.length),
                                }
                            )}
                        </p>
                        <div className={classes.errorConflicts}>
                            <DataTable>
                                <DataTableHead>
                                    <DataTableRow>
                                        <DataTableColumnHeader>
                                            {i18n.t('Conflict')}
                                        </DataTableColumnHeader>
                                        <DataTableColumnHeader align="right">
                                            {i18n.t('Count')}
                                        </DataTableColumnHeader>
                                        <DataTableColumnHeader>
                                            {i18n.t('Examples')}
                                        </DataTableColumnHeader>
                                    </DataTableRow>
                                </DataTableHead>
                                <DataTableBody>
                                    {conflicts.map((c) => (
                                        <DataTableRow key={c.value}>
                                            <DataTableCell>
                                                {c.value}
                                            </DataTableCell>
                                            <DataTableCell align="right">
                                                {c.count}
                                            </DataTableCell>
                                            <DataTableCell>
                                                <code
                                                    className={
                                                        classes.errorObjects
                                                    }
                                                >
                                                    {c.objects.join(', ')}
                                                    {c.count > c.objects.length
                                                        ? ', …'
                                                        : ''}
                                                </code>
                                            </DataTableCell>
                                        </DataTableRow>
                                    ))}
                                </DataTableBody>
                            </DataTable>
                        </div>
                    </>
                )}

                {details.fullMessage && (
                    <details className={classes.errorDisclosure}>
                        <summary>{i18n.t('Full message')}</summary>
                        <pre className={classes.modalErrorPre}>
                            {details.fullMessage}
                        </pre>
                    </details>
                )}

                {error.errorStack && (
                    <details className={classes.errorDisclosure}>
                        <summary>{i18n.t('Stack trace')}</summary>
                        <pre className={classes.modalErrorPre}>
                            {error.errorStack}
                        </pre>
                    </details>
                )}
            </ModalContent>
            <ModalActions>
                <ButtonStrip end>
                    <Button onClick={onClose}>{i18n.t('Close')}</Button>
                </ButtonStrip>
            </ModalActions>
        </Modal>
    )
}
