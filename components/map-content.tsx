'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { createClient } from '@/lib/supabase-client'
import { haversineDistance } from '@/lib/utils'
import { PointDetailsSheet } from './point-details-sheet'
import { CreatePointModal } from './create-point-modal'
import { Button } from '@/components/ui/button'
import { Plus, MapPin } from 'lucide-react'
import type { VehicleProfile, Point } from '@/lib/types'

interface MapContentProps {
  vehicleProfile: VehicleProfile
}

export default function MapContent({ vehicleProfile }: MapContentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [points, setPoints] = useState<Point[]>([])
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const markersRef = useRef<L.Marker[]>([])

  const POINT_ICONS: Record<string, { emoji: string; color: string }> = {
    'balance': { emoji: '🔴', color: '#ef4444' },
    'prf': { emoji: '🔵', color: '#3b82f6' },
    'toll': { emoji: '🟡', color: '#eab308' },
    'gas_station': { emoji: '🟢', color: '#22c55e' },
  }

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map('map').setView([-15.8, -48.0], 10)

      L.tileLayer('https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/OSM%2C_entire_world_map_at_zoom_level_0_in_single_tile.svg/960px-OSM%2C_entire_world_map_at_zoom_level_0_in_single_tile.svg.png?_=20180117110624', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map
    }

    return () => {
      // Cleanup on unmount
    }
  }, [])

  // Get user location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lng: longitude })

          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 14)
          }
        },
        (error) => {
          console.error('Geolocation error:', error)
          setLoading(false)
        }
      )
    }
  }, [])

  // Add user marker
  useEffect(() => {
    if (!mapRef.current || !userLocation) return

    const userMarker = L.marker([userLocation.lat, userLocation.lng], {
      icon: L.icon({
        iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI4IiBmaWxsPSIjMDAwIi8+PC9zdmc+',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    })
      .addTo(mapRef.current!)
      .bindPopup('Sua posicao atual')

    return () => {
      mapRef.current?.removeLayer(userMarker)
    }
  }, [userLocation])

  // Fetch nearby points
  useEffect(() => {
    if (!userLocation) return

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

        setPoints(pointsWithDistance)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching points:', err)
        setLoading(false)
      }
    }

    fetchPoints()
    const interval = setInterval(fetchPoints, 10000)

    return () => clearInterval(interval)
  }, [userLocation, vehicleProfile])

  // Update markers
  useEffect(() => {
    if (!mapRef.current) return

    // Clear old markers
    markersRef.current.forEach((marker) => mapRef.current?.removeLayer(marker))
    markersRef.current = []

    // Add new markers
    points.forEach((point) => {
      const iconData = POINT_ICONS[point.point_type] || { emoji: '📍', color: '#666' }

      const markerElement = document.createElement('div')
      markerElement.className = 'flex items-center justify-center'
      markerElement.innerHTML = `
        <div style="background: ${iconData.color}; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-center; font-size: 20px; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          ${iconData.emoji}
        </div>
      `

      const customIcon = L.divIcon({
        html: markerElement.outerHTML,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
      })

      const marker = L.marker([point.latitude, point.longitude], {
        icon: customIcon,
      })
        .on('click', () => setSelectedPoint(point))
        .addTo(mapRef.current!)

      markersRef.current.push(marker)
    })
  }, [points])

  return (
    <div className="relative w-full h-full">
      <div id="map" className="w-full h-full" />

      {/* Floating Action Button */}
      <Button
        onClick={() => setShowCreateModal(true)}
        className="absolute bottom-6 right-6 rounded-full w-14 h-14 p-0 shadow-lg hover:shadow-xl"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Point Details Sheet */}
      {selectedPoint && (
        <PointDetailsSheet
          point={selectedPoint}
          userLocation={userLocation}
          onClose={() => setSelectedPoint(null)}
        />
      )}

      {/* Create Point Modal */}
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
