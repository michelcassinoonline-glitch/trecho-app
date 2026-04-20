'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { MapComponent } from '@/components/map-component'
import { VehicleProfileForm } from '@/components/vehicle-profile-form'
import { signOut } from '@/lib/auth-helpers'
import { Button } from '@/components/ui/button'
import { LogOut, Settings } from 'lucide-react'
import type { VehicleProfile } from '@/lib/types'

export default function AppPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [vehicleProfile, setVehicleProfile] = useState<VehicleProfile | null>(null)
  const [showVehicleForm, setShowVehicleForm] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          router.replace('/login')
          return
        }

        setUser(session.user)

        // Fetch vehicle profile
        const { data: profile, error } = await supabase
          .from('vehicle_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .maybeSingle()

        if (error && error.code !== 'PGRST116') {
          throw error
        }

        if (profile) {
          setVehicleProfile(profile)
        } else {
          setShowVehicleForm(true)
        }
      } catch (err) {
        console.error('Error initializing app:', err)
      } finally {
        setLoading(false)
      }
    }

    initializeApp()
  }, [])

  const handleLogout = async () => {
    try {
      await signOut()
      router.replace('/login')
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }

  const handleVehicleProfileSaved = (profile: VehicleProfile) => {
    setVehicleProfile(profile)
    setShowVehicleForm(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-400 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Carregando...</p>
        </div>
      </div>
    )
  }

  if (showVehicleForm) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Complete seu Perfil de Veiculo</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Precisamos conhecer seu veiculo para oferecer informacoes precisas sobre restricoes de altura e carga.
            </p>
          </div>
          <VehicleProfileForm userId={user?.id} onProfileSaved={handleVehicleProfileSaved} />
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <div className="absolute top-0 left-0 right-0 z-10 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">TrechoApp</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {vehicleProfile?.vehicle_type} - {vehicleProfile?.height_m}m
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVehicleForm(true)}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Veiculo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full h-full pt-16">
        {vehicleProfile && <MapComponent vehicleProfile={vehicleProfile} />}
      </div>
    </div>
  )
}
