import { QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { HashRouter, Route, Routes } from 'react-router'
import classes from './App.module.css'
import { GlobalShellRouteSync } from './GlobalShellRouteSync'
import AnalyticsPage from '@/pages/AnalyticsPage'
import ClimateDataPage from '@/pages/ClimateDataPage/ClimateDataPage'
import DashboardPage from '@/pages/DashboardPage'
import DeadLettersPage from '@/pages/DeadLettersPage'
import ExecutionDetailPage from '@/pages/ExecutionDetailPage'
import ExecutionsPage from '@/pages/ExecutionsPage'
import PipelineDetailPage from '@/pages/PipelineDetailPage'
import PipelinesPage from '@/pages/PipelinesPage'
import SettingsPage from '@/pages/SettingsPage'
import { queryClient } from '@/queryClient'
import AboutPage from '@/shared/components/About'
import AppMenu from '@/shared/components/AppMenu'
import CapsSetupGate from '@/shared/components/CapsSetupGate'
import '../locales'

const mainContentId = 'main-content'

const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <CapsSetupGate mainContentId={mainContentId}>
                <div className={classes.appWrapper}>
                    <HashRouter>
                        <GlobalShellRouteSync />
                        <div className={classes.sidebar}>
                            <AppMenu />
                        </div>
                        <main
                            id={mainContentId}
                            className={classes.main}
                            tabIndex={-1}
                        >
                            <Routes>
                                <Route path="/" element={<DashboardPage />} />
                                <Route
                                    path="/pipelines"
                                    element={<PipelinesPage />}
                                />
                                <Route
                                    path="/pipelines/:id"
                                    element={<PipelineDetailPage />}
                                />
                                <Route
                                    path="/executions"
                                    element={<ExecutionsPage />}
                                />
                                <Route
                                    path="/executions/:id"
                                    element={<ExecutionDetailPage />}
                                />
                                <Route
                                    path="/analytics"
                                    element={<AnalyticsPage />}
                                />
                                <Route
                                    path="/dead-letters"
                                    element={<DeadLettersPage />}
                                />
                                <Route path="/about" element={<AboutPage />} />
                                <Route
                                    path="/climate-data"
                                    element={<ClimateDataPage />}
                                />
                                <Route
                                    path="/settings"
                                    element={<SettingsPage />}
                                />
                            </Routes>
                        </main>
                    </HashRouter>
                </div>
            </CapsSetupGate>
        </QueryClientProvider>
    )
}

export default App
