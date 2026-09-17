import i18n from '@dhis2/d2-i18n'
import {
    IconClockHistory24,
    IconDashboardWindow24,
    IconEditItems24,
    IconFolderOpen24,
    IconList24,
    IconMessages24,
    Menu,
    MenuItem,
} from '@dhis2/ui'
import * as React from 'react'
import { useLocation, useNavigate } from 'react-router'
import menuClasses from './AppMenu.module.css'

const AppMenu = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const isActive = (path: string) => {
        if (path === '/') {
            return location.pathname === '/'
        }
        return location.pathname.startsWith(path)
    }

    return (
        <div className={menuClasses.root}>
            <h1 className={menuClasses.appTitle}>{i18n.t('CAPS')}</h1>
            <nav aria-label={i18n.t('Main navigation')}>
                <Menu className={menuClasses.menuList}>
                    <MenuItem
                        active={isActive('/')}
                        icon={<IconDashboardWindow24 />}
                        onClick={() => navigate('/')}
                        label={i18n.t('Dashboard')}
                    />
                    <MenuItem
                        active={isActive('/pipelines')}
                        icon={<IconList24 />}
                        onClick={() => navigate('/pipelines')}
                        label={i18n.t('Pipelines')}
                    />
                    <MenuItem
                        active={isActive('/executions')}
                        icon={<IconClockHistory24 />}
                        onClick={() => navigate('/executions')}
                        label={i18n.t('Executions')}
                    />
                    <MenuItem
                        active={isActive('/climate-data')}
                        icon={<IconFolderOpen24 />}
                        onClick={() => navigate('/climate-data')}
                        label={i18n.t('Climate data')}
                    />
                    <MenuItem
                        active={isActive('/settings')}
                        icon={<IconEditItems24 />}
                        onClick={() => navigate('/settings')}
                        label={i18n.t('Settings')}
                    />
                    <MenuItem
                        active={isActive('/about')}
                        icon={<IconMessages24 />}
                        onClick={() => navigate('/about')}
                        label={i18n.t('About')}
                    />
                </Menu>
            </nav>
        </div>
    )
}

export default AppMenu
