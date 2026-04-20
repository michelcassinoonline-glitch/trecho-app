'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import type { VehicleProfile } from '@/lib/types'

const VEHICLE_TYPES = [
  { id: 'toco', label: 'Toco' },
  { id: 'cavalo', label: 'Cavalo Mecanico' },
  { id: 'carreta', label: 'Carreta' },
  { id: 'rodotrem', label: 'Rodotrem' },
  { id: 'bitrem', label: 'Bitrem' },
  { id: 'outro', label: 'Outro' },
]

const AXLE_OPTIONS = [2, 3, 4, 5, 6, 7, 8]

interface VehicleProfileFormProps {
  userId: string
  onProfileSaved?: (profile: VehicleProfile) => void
}

export function VehicleProfileForm({ userId, onProfileSaved }: VehicleProfileFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    vehicle_type: '',
    height_m: '',
    axles: '',
    total_weight_kg: '',
    load_type: 'general' as 'general' | 'mopp',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.vehicle_type || !formData.height_m || !formData.axles || !formData.total_weight_kg) {
      setError('Por favor, preencha todos os campos')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()

      await supabase
        .from('vehicle_profiles')
        .update({ is_active: false })
        .eq('user_id', userId)

      const { data, error: insertError } = await supabase
        .from('vehicle_profiles')
        .insert([
          {
            user_id: userId,
            vehicle_type: formData.vehicle_type,
            height_m: parseFloat(formData.height_m),
            axles: parseInt(formData.axles),
            total_weight_kg: parseFloat(formData.total_weight_kg),
            load_type: formData.load_type,
            is_active: true,
          },
        ])
        .select()
        .single()

      if (insertError) throw insertError

      if (onProfileSaved && data) {
        onProfileSaved(data as VehicleProfile)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar perfil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="vehicle-type">Tipo de Veiculo</Label>
          <Select value={formData.vehicle_type} onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}>
            <SelectTrigger id="vehicle-type">
              <SelectValue placeholder="Selecione o tipo de veiculo" />
            </SelectTrigger>
            <SelectContent>
              {VEHICLE_TYPES.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="height">Altura do Veiculo (metros)</Label>
          <Input
            id="height"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ex: 4.2"
            value={formData.height_m}
            onChange={(e) => setFormData({ ...formData, height_m: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="axles">Numero de Eixos</Label>
          <Select value={formData.axles} onValueChange={(value) => setFormData({ ...formData, axles: value })}>
            <SelectTrigger id="axles">
              <SelectValue placeholder="Selecione o numero de eixos" />
            </SelectTrigger>
            <SelectContent>
              {AXLE_OPTIONS.map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} eixo{num > 1 ? 's' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">Peso Total (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="100"
            min="0"
            placeholder="Ex: 28000"
            value={formData.total_weight_kg}
            onChange={(e) => setFormData({ ...formData, total_weight_kg: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Tipo de Carga</Label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="load_type"
                value="general"
                checked={formData.load_type === 'general'}
                onChange={(e) => setFormData({ ...formData, load_type: 'general' })}
                className="w-4 h-4"
              />
              <span className="text-sm">Geral</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="load_type"
                value="mopp"
                checked={formData.load_type === 'mopp'}
                onChange={(e) => setFormData({ ...formData, load_type: 'mopp' })}
                className="w-4 h-4"
              />
              <span className="text-sm">MOPP (Produtos Perigosos)</span>
            </label>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading ? 'Salvando...' : 'Salvar Perfil'}
        </Button>
      </form>
    </Card>
  )
}
