'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { VehicleProfile, PointType } from '@/lib/types'

interface CreatePointModalProps {
  userLocation: { lat: number; lng: number } | null
  onClose: () => void
  vehicleProfile: VehicleProfile
}

export function CreatePointModal({
  userLocation,
  onClose,
  vehicleProfile,
}: CreatePointModalProps) {
  const [loading, setLoading] = useState(false)
  const [pointTypes, setPointTypes] = useState<PointType[]>([])
  const [formData, setFormData] = useState({
    name: '',
    point_type: '',
    notes: '',
  })

  useEffect(() => {
    const fetchPointTypes = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.from('point_types').select('*')
        if (error) throw error
        setPointTypes(data ?? [])
      } catch (err) {
        console.error('Error fetching point types:', err)
      }
    }

    fetchPointTypes()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.point_type || !userLocation) {
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      await supabase.from('points').insert([
        {
          name: formData.name,
          point_type: formData.point_type,
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          notes: formData.notes || null,
          status: 'pending',
          created_by: user.id,
        },
      ])

      setLoading(false)
      onClose()
    } catch (err) {
      console.error('Error creating point:', err)
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md rounded-t-xl md:rounded-lg fixed bottom-0 md:bottom-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Ponto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Ponto</Label>
            <Input
              id="name"
              placeholder="Ex: Balanca Rodovia BR-040"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Ponto</Label>
            <select
              id="type"
              value={formData.point_type}
              onChange={(e) => setFormData({ ...formData, point_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
              required
            >
              <option value="">Selecione o tipo</option>
              {pointTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observacoes (opcional)</Label>
            <textarea
              id="notes"
              placeholder="Detalhes adicionais..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
            />
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Localizacao: {userLocation?.lat.toFixed(4)}, {userLocation?.lng.toFixed(4)}
          </div>

          <div className="space-y-2 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {loading ? 'Criando...' : 'Criar Ponto'}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
