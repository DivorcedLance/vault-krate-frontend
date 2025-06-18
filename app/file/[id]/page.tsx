"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, File, Calendar, Eye, Clock, AlertTriangle } from "lucide-react"
import { formatBytes, formatDate } from "@/lib/utils"
import Link from "next/link"
import { use } from "react"

interface FileInfo {
  file_id: string
  user_id: string
  size: number
  server_id: string
  uploaded_at: string
  description: string
  file_name: string
  mime_type: string
  download_count: number
  last_access: string
  delete_at?: string
}

export default function FilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFileInfo()
  }, [id])

  const fetchFileInfo = async () => {
    try {
      const response = await fetch(`https://vault-krate-efzt.shuttle.app/files/info?file_id=${id}`)
      if (response.ok) {
        const data = await response.json()
        setFileInfo(data)
      } else {
        setError("Archivo no encontrado o ha expirado")
      }
    } catch (error) {
      console.error("Error al obtener información del archivo:", error)
      setError("Error al cargar la información del archivo")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!fileInfo) return

    setDownloading(true)
    try {
      const response = await fetch(`https://vault-krate-efzt.shuttle.app/files/download?file_id=${id}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = fileInfo.file_name
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        // Refresh file info to update download count
        fetchFileInfo()
      } else {
        throw new Error("Error al descargar")
      }
    } catch (error) {
      console.error("Error de descarga:", error)
      alert("Error al descargar. Por favor intenta de nuevo.")
    } finally {
      setDownloading(false)
    }
  }

  const isExpired = fileInfo?.delete_at && new Date(fileInfo.delete_at) < new Date()
  const timeUntilExpiry = fileInfo?.delete_at ? new Date(fileInfo.delete_at).getTime() - Date.now() : null
  const hoursUntilExpiry = timeUntilExpiry ? Math.floor(timeUntilExpiry / (1000 * 60 * 60)) : null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-sm sm:text-base">Cargando información del archivo...</p>
        </div>
      </div>
    )
  }

  if (error || !fileInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Archivo No Encontrado</span>
            </CardTitle>
            <CardDescription>{error || "El archivo que buscas no existe o ha expirado."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">Ir al Inicio</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center space-x-2">
            <File className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Vault-Krate</h1>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="max-w-sm sm:max-w-2xl mx-auto">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl break-words">
                <File className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                <span className="truncate">{fileInfo.file_name}</span>
              </CardTitle>
              {fileInfo.description && (
                <CardDescription className="text-sm sm:text-base break-words">{fileInfo.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              {/* Expiry Warning */}
              {isExpired ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center space-x-2 text-red-800">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="font-semibold text-sm sm:text-base">Archivo Expirado</span>
                  </div>
                  <p className="text-red-700 mt-1 text-xs sm:text-sm">
                    Este archivo ha expirado y ya no está disponible para descarga.
                  </p>
                </div>
              ) : fileInfo.delete_at && hoursUntilExpiry !== null && hoursUntilExpiry < 24 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center space-x-2 text-yellow-800">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="font-semibold text-sm sm:text-base">Expira Pronto</span>
                  </div>
                  <p className="text-yellow-700 mt-1 text-xs sm:text-sm">
                    Este archivo expirará en {hoursUntilExpiry} horas.
                  </p>
                </div>
              ) : null}

              {/* File Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Tamaño del Archivo</p>
                  <p className="text-base sm:text-lg font-semibold">{formatBytes(fileInfo.size)}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Tipo de Archivo</p>
                  <p className="text-base sm:text-lg font-semibold truncate">{fileInfo.mime_type}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Subido</p>
                  <p className="text-base sm:text-lg font-semibold">
                    <span className="hidden sm:inline">{formatDate(fileInfo.uploaded_at)}</span>
                    <span className="sm:hidden">{new Date(fileInfo.uploaded_at).toLocaleDateString()}</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Descargas</p>
                  <p className="text-base sm:text-lg font-semibold">{fileInfo.download_count}</p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Subido {formatDate(fileInfo.uploaded_at)}</span>
                  <span className="sm:hidden">{new Date(fileInfo.uploaded_at).toLocaleDateString()}</span>
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  {fileInfo.download_count} descargas
                </Badge>
                {fileInfo.delete_at && (
                  <Badge variant={isExpired ? "destructive" : "outline"} className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {isExpired ? "Expirado" : `Expira ${new Date(fileInfo.delete_at).toLocaleDateString()}`}
                  </Badge>
                )}
                {fileInfo.user_id === "anonymous" && (
                  <Badge variant="outline" className="text-xs">
                    Archivo Temporal
                  </Badge>
                )}
              </div>

              {/* Download Button */}
              <div className="pt-2 sm:pt-4">
                <Button
                  onClick={handleDownload}
                  disabled={downloading || !!isExpired}
                  size="lg"
                  className="w-full text-sm sm:text-base"
                >
                  <Download className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  {downloading ? "Descargando..." : isExpired ? "Archivo Expirado" : "Descargar Archivo"}
                </Button>
              </div>

              {/* Share Link */}
              <div className="pt-2 sm:pt-4 border-t">
                <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2">Compartir este archivo</p>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <input
                    type="text"
                    value={window.location.href}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm bg-gray-50"
                  />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href)
                      alert("¡Enlace copiado al portapapeles!")
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    Copiar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
