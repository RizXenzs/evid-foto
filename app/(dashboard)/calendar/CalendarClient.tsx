'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns'
import { id } from 'date-fns/locale'
import { formatDate } from '@/lib/utils'
import type { Photo } from '@/types'

interface CalendarClientProps {
  photos: Photo[]
}

export function CalendarClient({ photos }: CalendarClientProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Pad days to start from Sunday
  const startPad = monthStart.getDay()
  const paddedDays = Array(startPad).fill(null).concat(days)

  const photosByDate = useMemo(() => {
    const map: Record<string, Photo[]> = {}
    photos.forEach(photo => {
      const key = photo.work_date || photo.upload_date.split('T')[0]
      if (!map[key]) map[key] = []
      map[key].push(photo)
    })
    return map
  }, [photos])

  const selectedDayPhotos = selectedDay
    ? photosByDate[format(selectedDay, 'yyyy-MM-dd')] || []
    : []

  function prevMonth() {
    setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }
  function nextMonth() {
    setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }

  return (
    <div className="space-y-6 fade-in">
      <h1 className="text-2xl font-bold text-foreground">Kalender Evident</h1>

      <div className="glass-card p-6">
        {/* Calendar header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-foreground">
            {format(currentDate, 'MMMM yyyy', { locale: id })}
          </h2>
          <button onClick={nextMonth}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
            <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {paddedDays.map((day, i) => {
            if (!day) return <div key={`pad-${i}`} />
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayPhotos = photosByDate[dateKey] || []
            const hasPhotos = dayPhotos.length > 0
            const isSelected = selectedDay && isSameDay(day, selectedDay)
            const _isToday = isToday(day)

            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`relative flex flex-col items-center p-2 rounded-xl transition-all duration-200 min-h-[52px]
                  ${isSelected
                    ? 'bg-primary text-white'
                    : _isToday
                      ? 'bg-orange-500/20 border border-orange-500/40 text-orange-400'
                      : hasPhotos
                        ? 'hover:bg-primary/10 text-foreground'
                        : 'hover:bg-muted text-muted-foreground'
                  }`}
              >
                <span className="text-sm font-medium">{format(day, 'd')}</span>
                {hasPhotos && (
                  <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                    {dayPhotos.slice(0, 3).map((_, pi) => (
                      <div key={pi}
                        className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/70' : 'bg-primary'}`}
                      />
                    ))}
                    {dayPhotos.length > 3 && (
                      <span className={`text-[9px] ${isSelected ? 'text-white/70' : 'text-primary'}`}>
                        +{dayPhotos.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day photos */}
      {selectedDay && (
        <div className="glass-card p-6 slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">
              Foto tanggal {format(selectedDay, 'dd MMMM yyyy', { locale: id })}
              <span className="ml-2 text-sm text-muted-foreground">({selectedDayPhotos.length} foto)</span>
            </h3>
            <button onClick={() => setSelectedDay(null)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          {selectedDayPhotos.length === 0 ? (
            <p className="text-muted-foreground text-sm">Tidak ada foto pada tanggal ini.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {selectedDayPhotos.map(photo => (
                <div key={photo.id} className="photo-card aspect-square">
                  <img src={photo.thumbnail_url || photo.file_url} alt={photo.title}
                    className="w-full h-full object-cover" loading="lazy" />
                  <div className="photo-card-overlay">
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-white text-xs truncate">{photo.title}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span>Ada foto</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-lg border border-orange-500/40 bg-orange-500/20" />
          <span>Hari ini</span>
        </div>
      </div>
    </div>
  )
}
