import type { ClimateCollection, StacCollection } from '@/capsApi/types'

// Inverse of OCS's period_type → ISO step table (shared/time.py).
const ISO_STEP_PERIOD_TYPE: Record<string, string> = {
    PT1H: 'hourly',
    P1D: 'daily',
    P7D: 'weekly',
    P1W: 'weekly',
    P1M: 'monthly',
    P3M: 'quarterly',
    P1Y: 'yearly',
}

const toDate = (value: unknown): string | null =>
    typeof value === 'string' && value ? value.slice(0, 10) : null

function temporalDimension(collection: StacCollection) {
    return Object.values(collection['cube:dimensions'] ?? {}).find(
        (dimension) => dimension.type === 'temporal'
    )
}

function periodTypeOf(collection: StacCollection): string | undefined {
    const dimension = temporalDimension(collection)
    if (!dimension) {
        return undefined
    }
    if (typeof dimension.step === 'string') {
        return ISO_STEP_PERIOD_TYPE[dimension.step.toUpperCase()]
    }
    // OCS publishes no step for a variable-length cadence such as dekads.
    return 'irregular'
}

export function toClimateCollection(
    collection: StacCollection
): ClimateCollection {
    const variables = Object.entries(collection['cube:variables'] ?? {})
        .filter(([, variable]) => (variable.type ?? 'data') === 'data')
        .map(([name, variable]) => ({
            name,
            unit: variable.unit,
            standardName: variable['cf:standard_name'],
        }))
    const rendered =
        collection.renders?.default?.['open_climate_service:variable']
    const primary =
        variables.find((variable) => variable.name === rendered) ?? variables[0]

    const [start, end] = collection.extent?.temporal?.interval?.[0] ?? []
    const timeExtent = temporalDimension(collection)?.extent ?? []

    return {
        id: collection.id,
        title: collection.title ?? collection.id,
        description: collection.description,
        variable: primary?.name,
        units: primary?.unit,
        variables,
        periodType: periodTypeOf(collection),
        extent: {
            temporal: {
                start: toDate(start) ?? toDate(timeExtent[0]),
                end: toDate(end) ?? toDate(timeExtent[1]),
            },
            bbox: collection.extent?.spatial?.bbox?.[0],
        },
        providers: collection.providers ?? [],
        license: collection.license,
        assets: Object.entries(collection.assets ?? {}).map(([key, asset]) => ({
            key,
            href: asset.href,
            title: asset.title,
            type: asset.type,
        })),
    }
}
