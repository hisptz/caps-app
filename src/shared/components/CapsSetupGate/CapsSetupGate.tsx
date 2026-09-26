import { useDataQuery } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { Button, ButtonStrip, NoticeBox } from '@dhis2/ui'
import React from 'react'
import classes from '@/app/App.module.css'
import {
    routeListQuery,
    type RoutesListResponse,
} from '@/capsApi/dhis2CapsRoute'
import WelcomePage from '@/pages/WelcomePage'
import { PageLoader } from '@/shared/components/ui/PageLoader'
import shellClasses from '@/shared/components/ui/PageShell/PageShell.module.css'

export type CapsSetupGateProps = {
    children: React.ReactNode
    mainContentId: string
}

const CapsSetupGate: React.FC<CapsSetupGateProps> = ({
    children,
    mainContentId,
}) => {
    const { loading, error, data, refetch } = useDataQuery<{
        routeList: RoutesListResponse
    }>(routeListQuery)

    if (loading && !data) {
        return (
            <div
                className={`${classes.appWrapper} ${classes.appWrapperWelcome}`}
            >
                <main
                    id={mainContentId}
                    className={classes.mainWelcome}
                    tabIndex={-1}
                >
                    <PageLoader />
                </main>
            </div>
        )
    }

    if (error) {
        return (
            <div
                className={`${classes.appWrapper} ${classes.appWrapperWelcome}`}
            >
                <main
                    id={mainContentId}
                    className={classes.mainWelcome}
                    tabIndex={-1}
                >
                    <div className={shellClasses.pageRoot}>
                        <NoticeBox
                            error
                            title={i18n.t('Could not load route configuration')}
                        >
                            {error.message}
                        </NoticeBox>
                        <div className={classes.welcomeRetryStrip}>
                            <ButtonStrip>
                                <Button onClick={() => void refetch()}>
                                    {i18n.t('Retry')}
                                </Button>
                            </ButtonStrip>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    if (!data?.routeList?.routes?.length) {
        return (
            <div
                className={`${classes.appWrapper} ${classes.appWrapperWelcome}`}
            >
                <main
                    id={mainContentId}
                    className={classes.mainWelcome}
                    tabIndex={-1}
                >
                    <WelcomePage onRouteCreated={() => void refetch()} />
                </main>
            </div>
        )
    }

    return <>{children}</>
}

export default CapsSetupGate
