'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { createClient } from '@/lib/supabase-client'
import { haversineDistance } from '@/lib/utils'
import { PointDetailsSheet } from './point-details-sheet'
import { CreatePointModal } from './create-point-modal'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { VehicleProfile, Point } from '@/lib/types'

interface MapContentProps {
  vehicleProfile: VehicleProfile
}

export default function MapContent({ vehicleProfile }: MapContentProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const mounted = useRef(true)
  const watchIdRef = useRef<number | null>(null)
  const intervalRef = useRef<number | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [points, setPoints] = useState<Point[]>([])
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const markersRef = useRef<L.Marker[]>([])

  const POINT_ICONS: Record<string, { emoji: string; color: string }> = {
    balance: { emoji: '🔴', color: '#ef4444' },
    prf: { emoji: '🔵', color: '#3b82f6' },
    toll: { emoji: '🟡', color: '#eab308' },
    gas_station: { emoji: '🟢', color: '#22c55e' },
  }

  // Ajusta o tamanho do container para evitar width/height restritos por ancestrais
  const setContainerSize = () => {
    const el = containerRef.current
    if (!el) return
    // Força largura mínima para viewport e altura razoável
    el.style.width = "100%"
    el.style.minHeight = '300px'
    el.style.height = `${Math.max(400, window.innerHeight - 80)}px`
    try {
      mapRef.current?.invalidateSize()
    } catch (e) {}
  }

  useEffect(() => {
    mounted.current = true
    // garante tamanho do container antes de iniciar o mapa
    setContainerSize()

    if (!mapRef.current && containerRef.current) {
      try {
        const map = L.map(containerRef.current as HTMLDivElement, { preferCanvas: true, center: [-15.8, -48.0], zoom: 10 })
        // Usa OSM tiles (corrige o problema de "grade" causado pela imagem mundial do Wikimedia)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
          tileSize: 256,
          detectRetina: true,
        }).addTo(map)

        mapRef.current = map

        // recalcula tamanho alguns ms depois
        setTimeout(() => {
          try {
            map.invalidateSize()
            window.dispatchEvent(new Event('resize'))
          } catch (e) {}
        }, 250)

        // Observador de resize do container
        if ('ResizeObserver' in window) {
          resizeObserverRef.current = new ResizeObserver(() => {
            try {
              setContainerSize()
            } catch (e) {}
          })
          resizeObserverRef.current.observe(containerRef.current)
        } else {
          const onResize = () => {
            try {
              setContainerSize()
            } catch (e) {}
          }
          window.addEventListener('resize', onResize)
          resizeObserverRef.current = {
            // @ts-ignore
            disconnect: () => window.removeEventListener('resize', onResize),
          } as any
        }
      } catch (err) {
        console.error('Erro ao inicializar mapa:', err)
      }
    }

    // atualiza tamanho quando janela redimensiona
    const onWindowResize = () => {
      setContainerSize()
    }
    window.addEventListener('resize', onWindowResize)

    return () => {
      mounted.current = false

      try {
        window.removeEventListener('resize', onWindowResize)
      } catch (e) {}

      if (resizeObserverRef.current) {
        try {
          resizeObserverRef.current.disconnect()
        } catch (e) {}
        resizeObserverRef.current = null
      }

      if (mapRef.current) {
        try {
          mapRef.current.off()
          mapRef.current.remove()
        } catch (e) {
          console.warn('Erro ao remover mapa:', e)
        } finally {
          mapRef.current = null
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Geolocation (watchPosition) com cleanup
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLoading(false)
      return
    }

    try {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          if (!mounted.current) return
          setUserLocation({ lat: latitude, lng: longitude })
          if (mapRef.current) {
            try {
              mapRef.current.setView([latitude, longitude], 14)
              mapRef.current.invalidateSize()
            } catch (e) {}
          }
        },
        (error) => {
          console.error('Geolocation error:', error)
          if (mounted.current) setLoading(false)
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000,
        }
      )

      watchIdRef.current = id
    } catch (err) {
      console.error('Erro ao iniciar geolocation:', err)
      setLoading(false)
    }

    return () => {
      if (watchIdRef.current !== null) {
        try {
          navigator.geolocation.clearWatch(watchIdRef.current)
        } catch (e) {
          console.warn('Erro ao limpar watchPosition:', e)
        } finally {
          watchIdRef.current = null
        }
      }
    }
  }, [])

  // Fetch nearby points periodicamente quando houver userLocation
  useEffect(() => {
    if (!userLocation) return

    let cancelled = false

    const fetchPoints = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.rpc('get_nearby_points', {
          lat: userLocation.lat,
          lng: userLocation.lng,
          radius_km: 50,
          height_m: vehicleProfile.height_m,
          load_type: vehicleProfile.load_type,
        })

        if (error) throw error

        const pointsWithDistance = (data ?? []).map((point: any) => ({
          ...point,
          distance_km: haversineDistance(
            userLocation.lat,
            userLocation.lng,
            point.latitude,
            point.longitude
          ),
        }))

        if (!cancelled && mounted.current) {
          setPoints(pointsWithDistance)
          setLoading(false)
          setTimeout(() => {
            try {
              mapRef.current?.invalidateSize()
              window.dispatchEvent(new Event('resize'))
            } catch (e) {}
          }, 120)
        }
      } catch (err) {
        console.error('Error fetching points:', err)
        if (mounted.current) setLoading(false)
      }
    }

    fetchPoints()
    const intId = window.setInterval(fetchPoints, 10000)
    intervalRef.current = intId

    return () => {
      cancelled = true
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [userLocation, vehicleProfile])

  // Atualiza markers com limpeza adequada
  useEffect(() => {
    if (!mapRef.current) return

    try {
      markersRef.current.forEach((m) => {
        try {
          mapRef.current?.removeLayer(m)
        } catch (e) {}
      })
    } finally {
      markersRef.current = []
    }

    points.forEach((point) => {
      const iconData = POINT_ICONS[point.point_type] || { emoji: '📍', color: '#666' }

      const html = `
        <div style="
          background: ${iconData.color};
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">
          ${iconData.emoji}
        </div>
      `

      const customIcon = L.divIcon({
        html,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
      })

      const marker = L.marker([point.latitude, point.longitude], {
        icon: customIcon,
      })
        .on('click', () => {
          if (!mounted.current) return
          setSelectedPoint(point)
        })
        .addTo(mapRef.current!)

      markersRef.current.push(marker)
    })
  }, [points])

  return (
    <div className="relative w-full h-full">
      {/* container controlado por ref - seu tamanho será ajustado em runtime */}
      <div ref={containerRef} className="w-full h-full" />

      <Button
        onClick={() => setShowCreateModal(true)}
        className="absolute bottom-6 right-6 rounded-full w-14 h-14 p-0 shadow-lg hover:shadow-xl"
        size="icon"
        aria-label="Criar ponto"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {selectedPoint && (
        <PointDetailsSheet
          point={selectedPoint}
          userLocation={userLocation}
          onClose={() => setSelectedPoint(null)}
        />
      )}

      {showCreateModal && (
        <CreatePointModal
          userLocation={userLocation}
          onClose={() => setShowCreateModal(false)}
          vehicleProfile={vehicleProfile}
        />
      )}
    </div>
  )
}
