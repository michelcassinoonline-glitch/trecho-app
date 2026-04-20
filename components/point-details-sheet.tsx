'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { AlertCircle, Flag, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Point } from '@/lib/types'

interface PointDetailsSheetProps {
  point: Point
  userLocation: { lat: number; lng: number } | null
  onClose: () => void
}

type ReportReason = 'does_not_exist' | 'outdated' | 'wrong_location' | 'other'

export function PointDetailsSheet({
  point,
  userLocation,
  onClose,
}: PointDetailsSheetProps) {
  const [loading, setLoading] = useState(false)
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportReason, setReportReason] = useState<ReportReason>('other')
  const [reportDetails, setReportDetails] = useState('')

  const handleConfirm = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      await supabase.from('contributions').insert([
        {
          point_id: point.id,
          user_id: user.id,
          contribution_type: 'confirmation',
          details: { timestamp: new Date().toISOString() },
        },
      ])

      setLoading(false)
      onClose()
    } catch (err) {
      console.error('Error confirming point:', err)
      setLoading(false)
    }
  }

  const handleReport = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      await supabase.from('contributions').insert([
        {
          point_id: point.id,
          user_id: user.id,
          contribution_type: 'error_report',
          details: {
            reason: reportReason,
            details: reportDetails,
            timestamp: new Date().toISOString(),
          },
        },
      ])

      setLoading(false)
      setShowReportForm(false)
      onClose()
    } catch (err) {
      console.error('Error reporting point:', err)
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={!showReportForm} onOpenChange={onClose}>
        <DialogContent className="w-full max-w-md rounded-t-xl md:rounded-lg fixed bottom-0 md:bottom-auto">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{point.name}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{point.point_type}</p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Distancia:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {point.distance_km?.toFixed(2) || 'N/A'} km
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Confianca:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {point.confidence_score}/100
                </span>
              </div>
            </div>

            {point.notes && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-200">{point.notes}</p>
              </div>
            )}

            <div className="space-y-2 pt-4">
              <Button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                <Check className="w-4 h-4 mr-2" />
                {loading ? 'Confirmando...' : 'Confirmar'}
              </Button>
              <Button
                onClick={() => setShowReportForm(true)}
                variant="outline"
                className="w-full"
              >
                <Flag className="w-4 h-4 mr-2" />
                Reportar Erro
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showReportForm && (
        <Dialog open={showReportForm} onOpenChange={() => setShowReportForm(false)}>
          <DialogContent className="w-full max-w-md rounded-t-xl md:rounded-lg fixed bottom-0 md:bottom-auto">
            <DialogHeader>
              <DialogTitle>Reportar Erro no Ponto</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">Motivo</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as ReportReason)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="does_not_exist">Nao existe</option>
                  <option value="outdated">Informacao desatualizada</option>
                  <option value="wrong_location">Localizacao errada</option>
                  <option value="other">Outro</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-white">Detalhes (opcional)</label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Descreva o problema..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div className="space-y-2 pt-4">
                <Button
                  onClick={handleReport}
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
                >
                  {loading ? 'Enviando...' : 'Enviar Relatorio'}
                </Button>
                <Button
                  onClick={() => setShowReportForm(false)}
                  variant="outline"
                  className="w-full"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
