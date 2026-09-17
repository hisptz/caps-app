import { useDataEngine } from '@dhis2/app-runtime'
import { useMemo } from 'react'
import { useWatch } from 'react-hook-form'
import { useModelsQuery } from '@/shared/hooks/useModelsQuery'

export function useSelectedModel() {
    const engine = useDataEngine()
    const modelId = useWatch({
        name: `handlerConfig.modelId`,
    })
    const { data: modelsResponse } = useModelsQuery(engine)
    return useMemo(() => {
        return modelsResponse?.models.find((model) => model.name === modelId)
    }, [modelsResponse?.models, modelId])
}
