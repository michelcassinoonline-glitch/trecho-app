'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import type { VehicleProfile } from '@/lib/types'

const MapContent = dynamic(() => import('./map-content'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-400 border-t-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando mapa...</p>
      </div>
    </div>
  ),
})

interface MapComponentProps {
  vehicleProfile: VehicleProfile
}

export function MapComponent({ vehicleProfile }: MapComponentProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-400 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando...</p>
        </div>
      </div>
    )
  }

  return (
    <MapContent
      key={`${vehicleProfile.vehicle_type}-${vehicleProfile.height_m}-${vehicleProfile.axles}-${vehicleProfile.total_weight_kg}-${vehicleProfile.load_type}`}
      vehicleProfile={vehicleProfile}
    />
  )
}
