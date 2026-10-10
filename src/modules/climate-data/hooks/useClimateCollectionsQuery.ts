import { useQuery } from '@tanstack/react-query'
import type { CapsDataEngine } from '@/capsApi/client'
import {
    getClimateCollection,
    listClimateCollections,
} from '@/capsApi/endpoints'
import { capsKeys } from '@/capsApi/queryKeys'
import {
    isRasterCollection,
    toClimateCollection,
} from '@/modules/climate-data/utils/stacCollection'

export function useClimateCollectionsQuery(engine: CapsDataEngine) {
    return useQuery({
        queryKey: capsKeys.climateCollections.list(),
        queryFn: async () =>
            (await listClimateCollections(engine)).collections
                .filter(isRasterCollection)
                .map(toClimateCollection),
    })
}

export function useClimateCollectionQuery(
    engine: CapsDataEngine,
    collectionId: string | undefined
) {
    return useQuery({
        queryKey: capsKeys.climateCollections.detail(collectionId),
        queryFn: async () =>
            toClimateCollection(
                await getClimateCollection(engine, collectionId!)
            ),
        enabled: Boolean(collectionId),
    })
}
