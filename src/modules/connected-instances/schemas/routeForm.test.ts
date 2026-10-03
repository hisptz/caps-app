import {
    baseUrlFromRouteUrl,
    buildSourceRouteCreatePayload,
    buildSourceRoutePatch,
    defaultSourceRouteFormValues,
    sourceRouteFormSchema,
    sourceRouteToFormValues,
    type SourceRouteFormValues,
    routeKeyFromName,
} from './routeForm'

function values(
    overrides: Partial<SourceRouteFormValues> = {}
): SourceRouteFormValues {
    return {
        ...defaultSourceRouteFormValues(),
        name: 'DHIS2 Play',
        key: 'play',
        baseUrl: 'https://play.im.dhis2.org/dev/',
        token: 'd2p_secret',
        authorities: 'F_CAPS_SOURCE, F_CAPS_SOURCE ,M_caps',
        ...overrides,
    }
}

describe('source route form', () => {
    it('builds a create payload with the caps-src- code, /api/** URL and token auth', () => {
        expect(buildSourceRouteCreatePayload(values())).toEqual({
            code: 'caps-src-play',
            name: 'DHIS2 Play',
            url: 'https://play.im.dhis2.org/dev/api/**',
            responseTimeoutSeconds: 60,
            authorities: ['F_CAPS_SOURCE', 'M_caps'],
            disabled: false,
            auth: { type: 'api-token', token: 'd2p_secret' },
        })
    })

    it('builds basic and header auth', () => {
        expect(
            buildSourceRouteCreatePayload(
                values({
                    authType: 'http-basic',
                    username: ' reader ',
                    password: 'pw',
                })
            ).auth
        ).toEqual({ type: 'http-basic', username: 'reader', password: 'pw' })
        expect(
            buildSourceRouteCreatePayload(
                values({
                    authType: 'api-headers',
                    headers: [
                        { name: 'X-API-Key', value: 'abc' },
                        { name: '', value: '' },
                    ],
                })
            ).auth
        ).toEqual({ type: 'api-headers', headers: { 'X-API-Key': 'abc' } })
    })

    it('patches without touching credentials unless they are being replaced', () => {
        const keep = buildSourceRoutePatch(
            values({ id: 'r1', changeCredentials: false })
        )
        expect(keep.map((op) => op.path)).toEqual([
            '/name',
            '/url',
            '/responseTimeoutSeconds',
            '/authorities',
        ])
        const replace = buildSourceRoutePatch(
            values({ id: 'r1', changeCredentials: true })
        )
        expect(replace[replace.length - 1]).toEqual({
            op: 'add',
            path: '/auth',
            value: { type: 'api-token', token: 'd2p_secret' },
        })
    })

    it('requires the chosen auth type’s credentials only when replacing them', () => {
        expect(
            sourceRouteFormSchema.safeParse(values({ token: '' })).success
        ).toBe(false)
        expect(
            sourceRouteFormSchema.safeParse(
                values({ token: '', changeCredentials: false })
            ).success
        ).toBe(true)
    })

    it('round-trips a stored route into form values', () => {
        const form = sourceRouteToFormValues({
            id: 'r1',
            code: 'caps-src-play',
            name: 'DHIS2 Play',
            url: 'https://play.im.dhis2.org/dev/api/**',
            authorities: ['F_CAPS_SOURCE'],
            responseTimeoutSeconds: 30,
        })
        expect(form).toMatchObject({
            id: 'r1',
            key: 'play',
            baseUrl: 'https://play.im.dhis2.org/dev',
            authorities: 'F_CAPS_SOURCE',
            responseTimeoutSeconds: 30,
            changeCredentials: false,
        })
        expect(baseUrlFromRouteUrl('https://x.org/dhis/api/**')).toBe(
            'https://x.org/dhis'
        )
    })
})

describe('routeKeyFromName', () => {
    it('slugifies a display name into a valid route key', () => {
        expect(routeKeyFromName('DHIS2 Play 2.42')).toBe('dhis2-play-2-42')
        expect(routeKeyFromName('  play-42-6  ')).toBe('play-42-6')
        expect(routeKeyFromName('Café / Ünit')).toBe('cafe-unit')
        expect(routeKeyFromName('***')).toBe('')
    })
})
