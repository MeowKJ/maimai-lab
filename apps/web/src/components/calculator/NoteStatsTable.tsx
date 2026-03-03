'use client'

import type { NoteCounts } from '@/lib/calculator/types'

interface NoteStatsTableProps {
  notes: NoteCounts
}

export function NoteStatsTable({ notes }: NoteStatsTableProps) {
  const cols = [
    { key: 'total', label: '总数' },
    { key: 'tap',   label: 'Tap' },
    { key: 'hold',  label: 'Hold' },
    { key: 'slide', label: 'Slide' },
    { key: 'touch', label: 'Touch' },
    { key: 'break', label: 'Break' },
  ] as const

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 text-sm font-medium text-foreground border-b border-border">
        音符统计
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-center">
          <thead>
            <tr className="border-b border-border">
              {cols.map(({ key, label }) => (
                <th key={key} className="px-3 py-2 text-xs font-medium text-muted-foreground">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {cols.map(({ key }) => (
                <td key={key} className="px-3 py-2 font-mono font-medium text-foreground">
                  {notes[key]}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
