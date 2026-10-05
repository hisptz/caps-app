import { useAlert } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import {
    Button,
    ButtonStrip,
    CircularLoader,
    IconAdd16,
    Modal,
    ModalActions,
    ModalContent,
    ModalTitle,
    NoticeBox,
    Tag,
} from '@dhis2/ui'
import React, { useState } from 'react'
import classes from './ConnectedInstances.module.css'
import { SourceRouteModal } from './SourceRouteModal'
import type { SourceRouteTestResponse } from '@/capsApi/types'
import {
    useDeleteSourceRoute,
    useSourceRoutesQuery,
    useTestSourceRoute,
} from '@/modules/connected-instances/hooks/useSourceRoutes'
import {
    baseUrlFromRouteUrl,
    type SourceRoute,
} from '@/modules/connected-instances/schemas/routeForm'
import { dhis2ErrorMessage } from '@/modules/connected-instances/utils/dhis2ErrorMessage'
import settingsClasses from '@/modules/settings/SettingsPage.module.css'

type AlertShowProps = { text: string; error?: boolean; success?: boolean }

type ModalState =
    | { mode: 'closed' }
    | { mode: 'add' }
    | { mode: 'edit'; route: SourceRoute }

function TestResult({ result }: { result: SourceRouteTestResponse }) {
    if (!result.reachable) {
        return (
            <NoticeBox error title={i18n.t('Connection failed')}>
                {result.error ?? i18n.t('The route could not be run.')}
            </NoticeBox>
        )
    }
    const user = result.user?.displayName ?? result.user?.username
    return (
        <NoticeBox valid title={i18n.t('Connected')}>
            <dl className={classes.testFacts}>
                <dt>{i18n.t('Signed in as')}</dt>
                <dd>
                    {user ?? '—'}
                    {result.user?.username && user !== result.user.username
                        ? ` (${result.user.username})`
                        : ''}
                </dd>
                <dt>{i18n.t('DHIS2 version')}</dt>
                <dd>{result.system?.version ?? '—'}</dd>
                <dt>{i18n.t('Analytics last run')}</dt>
                <dd>
                    {result.system?.analyticsUpTo
                        ? new Date(result.system.analyticsUpTo).toLocaleString()
                        : i18n.t('Not reported')}
                </dd>
            </dl>
        </NoticeBox>
    )
}

export function ConnectedInstancesSection(): React.ReactElement {
    const { show } = useAlert(
        ({ text }: AlertShowProps) => text,
        ({ error, success }: AlertShowProps) => ({
            error: Boolean(error),
            success: Boolean(success),
        })
    )
    const routesQuery = useSourceRoutesQuery()
    const testMutation = useTestSourceRoute()
    const deleteMutation = useDeleteSourceRoute()
    const [modal, setModal] = useState<ModalState>({ mode: 'closed' })
    const [deleting, setDeleting] = useState<SourceRoute | null>(null)
    const [results, setResults] = useState<
        Record<string, SourceRouteTestResponse>
    >({})
    const [testingCode, setTestingCode] = useState<string | null>(null)

    const routes = routesQuery.data ?? []

    function runTest(route: SourceRoute) {
        setTestingCode(route.code)
        testMutation.mutate(route.code, {
            onSuccess: (result) =>
                setResults((prev) => ({ ...prev, [route.code]: result })),
            onError: (err) =>
                setResults((prev) => ({
                    ...prev,
                    [route.code]: {
                        routeCode: route.code,
                        reachable: false,
                        error:
                            err instanceof Error
                                ? err.message
                                : i18n.t(
                                      'The CAPS service could not be reached.'
                                  ),
                    },
                })),
            onSettled: () => setTestingCode(null),
        })
    }

    function confirmDelete() {
        if (!deleting) {
            return
        }
        const target = deleting
        deleteMutation.mutate(target.id, {
            onSuccess: () => {
                show({
                    text: i18n.t('{{name}} disconnected.', {
                        name: target.name,
                    }),
                    success: true,
                })
                setDeleting(null)
            },
            onError: (err) => {
                show({
                    text: dhis2ErrorMessage(
                        err,
                        i18n.t('Could not delete the connected instance.')
                    ),
                    error: true,
                })
            },
        })
    }

    return (
        <section className={settingsClasses.card}>
            <header className={settingsClasses.cardHeader}>
                <div className={settingsClasses.cardHeaderText}>
                    <h2 className={settingsClasses.cardTitle}>
                        {i18n.t('Connected instances')}
                    </h2>
                    <p className={settingsClasses.cardSub}>
                        {i18n.t(
                            'Other DHIS2 instances that pipelines can pull data from.'
                        )}
                    </p>
                </div>
                <Button
                    small
                    icon={<IconAdd16 />}
                    onClick={() => setModal({ mode: 'add' })}
                >
                    {i18n.t('Connect instance')}
                </Button>
            </header>
            <div className={settingsClasses.cardBody}>
                {routesQuery.isLoading && <CircularLoader small />}
                {routesQuery.isError && (
                    <NoticeBox
                        error
                        title={i18n.t('Could not load connected instances')}
                    >
                        {dhis2ErrorMessage(
                            routesQuery.error,
                            i18n.t('The DHIS2 routes could not be read.')
                        )}
                    </NoticeBox>
                )}
                {routesQuery.isSuccess && routes.length === 0 && (
                    <p className={classes.empty}>
                        {i18n.t(
                            'No instances connected yet. Connect one to add a DHIS2 Instance Pull step to a pipeline.'
                        )}
                    </p>
                )}
                {routes.length > 0 && (
                    <ul className={classes.list}>
                        {routes.map((route) => {
                            const result = results[route.code]
                            return (
                                <li key={route.id} className={classes.item}>
                                    <div className={classes.itemText}>
                                        <span className={classes.itemName}>
                                            {route.name}
                                        </span>
                                        <span className={classes.itemMeta}>
                                            {baseUrlFromRouteUrl(route.url)}
                                        </span>
                                        <span className={classes.itemMeta}>
                                            {route.code}
                                        </span>
                                        <div className={classes.itemTags}>
                                            {route.disabled && (
                                                <Tag negative>
                                                    {i18n.t('Disabled')}
                                                </Tag>
                                            )}
                                            {(route.authorities ?? [])
                                                .length === 0 && (
                                                <Tag neutral>
                                                    {i18n.t(
                                                        'No authorities: anyone with access can run it'
                                                    )}
                                                </Tag>
                                            )}
                                            <Tag neutral>
                                                {i18n.t(
                                                    'Timeout {{seconds}} s',
                                                    {
                                                        seconds:
                                                            route.responseTimeoutSeconds ??
                                                            '—',
                                                    }
                                                )}
                                            </Tag>
                                        </div>
                                    </div>
                                    <div className={classes.itemActions}>
                                        <Button
                                            small
                                            secondary
                                            loading={testingCode === route.code}
                                            disabled={testingCode !== null}
                                            onClick={() => runTest(route)}
                                        >
                                            {i18n.t('Test')}
                                        </Button>
                                        <Button
                                            small
                                            secondary
                                            onClick={() =>
                                                setModal({
                                                    mode: 'edit',
                                                    route,
                                                })
                                            }
                                        >
                                            {i18n.t('Edit')}
                                        </Button>
                                        <Button
                                            small
                                            destructive
                                            secondary
                                            onClick={() => setDeleting(route)}
                                        >
                                            {i18n.t('Delete')}
                                        </Button>
                                    </div>
                                    {result && (
                                        <div className={classes.testResult}>
                                            <TestResult result={result} />
                                        </div>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>

            <SourceRouteModal
                open={modal.mode !== 'closed'}
                route={modal.mode === 'edit' ? modal.route : undefined}
                onClose={() => setModal({ mode: 'closed' })}
                onSaved={(name) => {
                    show({
                        text: i18n.t('{{name}} saved.', { name }),
                        success: true,
                    })
                    setResults({})
                }}
            />

            {deleting && (
                <Modal
                    small
                    onClose={() => setDeleting(null)}
                    position="middle"
                >
                    <ModalTitle>{i18n.t('Disconnect instance?')}</ModalTitle>
                    <ModalContent>
                        {i18n.t(
                            'This deletes the route {{code}} and its stored credentials from staging. Pipeline steps that pull from {{name}} will fail until another instance is picked.',
                            { code: deleting.code, name: deleting.name }
                        )}
                    </ModalContent>
                    <ModalActions>
                        <ButtonStrip end>
                            <Button onClick={() => setDeleting(null)}>
                                {i18n.t('Cancel')}
                            </Button>
                            <Button
                                destructive
                                loading={deleteMutation.isPending}
                                onClick={confirmDelete}
                            >
                                {i18n.t('Disconnect')}
                            </Button>
                        </ButtonStrip>
                    </ModalActions>
                </Modal>
            )}
        </section>
    )
}
