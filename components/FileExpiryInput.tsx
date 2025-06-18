import { FileInfo } from "@/app/dashboard/page"
import { useState } from "react"
import { Input } from "./ui/input"
import { Button } from "./ui/button"

export function FileExpiryInput({ editingFile, setEditingFile }: 
{
  editingFile: FileInfo,
  setEditingFile: (file: FileInfo) => void
}
) {
  const [showWarning, setShowWarning] = useState(false)

  // Calcular la fecha mínima (3 horas en el futuro) en local ISO string
  const getMinDateLocal = () => {
    const nowPlus3h = new Date(Date.now() + 3 * 60 * 60 * 1000)
    const offsetMs = nowPlus3h.getTimezoneOffset() * 60000
    return new Date(nowPlus3h.getTime() - offsetMs).toISOString().slice(0, 16)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = new Date(e.target.value)
    const nowPlus3h = new Date(Date.now() + 3 * 60 * 60 * 1000 - new Date().getTimezoneOffset() * 60000)

    let finalDate = selected
    let warning = false

    if (selected < nowPlus3h) {
      finalDate = nowPlus3h
      warning = true
    }

    // Convertir a UTC ISO
    const utcValue = new Date(finalDate.getTime()).toISOString()

    setEditingFile({ ...editingFile, delete_at: utcValue })
    setShowWarning(warning)
  }

  const handleClear = () => {
    setEditingFile({ ...editingFile, delete_at: undefined })
    setShowWarning(false)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Input
          id="delete_at"
          type="datetime-local"
          className="mt-1 text-sm"
          value={
            editingFile.delete_at
              ? new Date(new Date(editingFile.delete_at).getTime() - new Date(editingFile.delete_at).getTimezoneOffset() * 60000).toISOString().slice(0, 16)
              : ""
          }
          min={getMinDateLocal()}
          onChange={handleChange}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleClear}
        >
          Limpiar
        </Button>
      </div>
      {showWarning && (
        <p className="text-red-500 text-xs">
          La fecha debe estar al menos 3 horas en el futuro. Se ha ajustado automáticamente.
        </p>
      )}
    </>
  )
}
