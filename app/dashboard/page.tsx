"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, Download, Trash2, Edit, File, HardDrive, Calendar, Eye, Share2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { formatBytes, formatDate } from "@/lib/utils"
import Link from "next/link"

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

interface UserInfo {
  user_id: string
  file_count: number
  space_used: number
  space_limit: number
}

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const [files, setFiles] = useState<FileInfo[]>([])
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState("")
  const [editingFile, setEditingFile] = useState<FileInfo | null>(null)

  useEffect(() => {
    if (user) {
      fetchUserFiles()
      fetchUserInfo()
    }
  }, [user])

  const fetchUserFiles = async () => {
    if (!user) return

    try {
      const response = await fetch(`https://vault-krate-efzt.shuttle.app/files/info?user_id=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        console.log("Archivos obtenidos:", data)
        setFiles(data)
      }
    } catch (error) {
      console.error("Error al obtener archivos:", error)
    }
  }

  const fetchUserInfo = async () => {
    if (!user) return

    try {
      const response = await fetch(`https://vault-krate-efzt.shuttle.app/users/info?user_id=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setUserInfo(data)
      }
    } catch (error) {
      console.error("Error al obtener información del usuario:", error)
    }
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !user) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file_data", file)

      const metadata = {
        user_id: user.id,
        description: description || "",
        file_name: file.name,
        mime_type: file.type,
      }

      formData.append("metadata", JSON.stringify(metadata))

      const response = await fetch("https://vault-krate-efzt.shuttle.app/files/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        setFile(null)
        setDescription("")
        fetchUserFiles()
        fetchUserInfo()
      } else {
        throw new Error("Error al subir")
      }
    } catch (error) {
      console.error("Error de subida:", error)
      alert("Error al subir el archivo. Por favor intenta de nuevo.")
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este archivo?")) return

    try {
      const response = await fetch(`https://vault-krate-efzt.shuttle.app/files/delete?file_id=${fileId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        }
      })

      if (response.ok) {
        fetchUserFiles()
        fetchUserInfo()
      }
    } catch (error) {
      console.error("Error al eliminar:", error)
      alert("Error al eliminar. Por favor intenta de nuevo.")
    }
  }

  const handleUpdateFile = async (fileInfo: FileInfo) => {
    try {
      console.log("Actualizando archivo:", fileInfo)

      const response = await fetch("https://vault-krate-efzt.shuttle.app/files/info", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fileInfo),
      })

      if (response.ok) {
        setEditingFile(null)
        fetchUserFiles()
      }
    } catch (error) {
      console.error("Error al actualizar:", error)
      alert("Error al actualizar. Por favor intenta de nuevo.")
    }
  }

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const response = await fetch(`https://vault-krate-efzt.shuttle.app/files/download?file_id=${fileId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error al descargar:", error)
      alert("Error al descargar. Por favor intenta de nuevo.")
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>Por favor inicia sesión para acceder a tu dashboard.</CardDescription>
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

  const storagePercentage = userInfo ? (userInfo.space_used / userInfo.space_limit) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <Link href="/" className="flex items-center space-x-2">
              <File className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Vault-Krate</h1>
            </Link>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <span className="text-xs sm:text-sm text-gray-600 text-center">{user.email?.split("@")[0]}</span>
              <Button onClick={signOut} variant="outline" size="sm">
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Storage Overview */}
        {userInfo && (
          <Card className="mb-6 sm:mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                <HardDrive className="h-5 w-5" />
                <span>Resumen de Almacenamiento</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-indigo-600">{userInfo.file_count}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Archivos</p>
                </div>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-indigo-600">{formatBytes(userInfo.space_used)}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Usado</p>
                </div>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-indigo-600">{formatBytes(userInfo.space_limit)}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Total</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span>Almacenamiento Usado</span>
                  <span>{storagePercentage.toFixed(1)}%</span>
                </div>
                <Progress value={storagePercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
                  <Upload className="h-5 w-5" />
                  <span>Subir Nuevo Archivo</span>
                </CardTitle>
                <CardDescription className="text-sm">
                  Los archivos subidos aquí son permanentes y no expiran
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div>
                    <Label htmlFor="file" className="text-sm font-medium">
                      Elegir Archivo
                    </Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-sm font-medium">
                      Descripción
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Añade una descripción..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-1 min-h-[80px] resize-none"
                    />
                  </div>
                  <Button type="submit" disabled={!file || uploading} className="w-full">
                    {uploading ? "Subiendo..." : "Subir Archivo"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Files List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">Mis Archivos</CardTitle>
                <CardDescription className="text-sm">Gestiona tus archivos subidos</CardDescription>
              </CardHeader>
              <CardContent>
                {files.length === 0 ? (
                  <p className="text-center text-gray-500 py-8 text-sm sm:text-base">Aún no has subido archivos.</p>
                ) : (
                  <div className="space-y-4">
                    {files.map((file) => (
                      <div key={file.file_id} className="border rounded-lg p-3 sm:p-4">
                        {editingFile?.file_id === file.file_id ? (
                          <div className="space-y-4">
                            <Input
                              value={editingFile.file_name}
                              onChange={(e) => setEditingFile({ ...editingFile, file_name: e.target.value })}
                              placeholder="Nombre del archivo"
                              className="text-sm"
                            />
                            <Textarea
                              value={editingFile.description}
                              onChange={(e) => setEditingFile({ ...editingFile, description: e.target.value })}
                              placeholder="Descripción"
                              className="min-h-[60px] resize-none text-sm"
                            />
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                              <Button
                                onClick={() => handleUpdateFile(editingFile)}
                                size="sm"
                                className="w-full sm:w-auto"
                              >
                                Guardar
                              </Button>
                              <Button
                                onClick={() => setEditingFile(null)}
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-auto"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-col sm:flex-row justify-between items-start mb-3 space-y-2 sm:space-y-0">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base sm:text-lg truncate">{file.file_name}</h3>
                                <p className="text-xs sm:text-sm text-gray-600 break-words">{file.description}</p>
                              </div>
                              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                <Button
                                  onClick={() => handleDownload(file.file_id, file.file_name)}
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 sm:flex-none"
                                >
                                  <Download className="h-4 w-4" />
                                  <span className="ml-1 sm:hidden">Descargar</span>
                                </Button>
                                <Button
                                  onClick={() => setEditingFile(file)}
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 sm:flex-none"
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="ml-1 sm:hidden">Editar</span>
                                </Button>
                                <Button
                                  onClick={() => {
                                    const link = `${process.env.NEXT_PUBLIC_SITE_URL}/file/${file.file_id}`
                                    navigator.clipboard.writeText(link)
                                    alert("¡Enlace copiado al portapapeles!")
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 sm:flex-none"
                                >
                                  <Share2 className="h-4 w-4" />
                                  <span className="ml-1 sm:hidden">Compartir</span>
                                </Button>
                                <Button
                                  onClick={() => handleDeleteFile(file.file_id)}
                                  size="sm"
                                  variant="destructive"
                                  className="flex-1 sm:flex-none"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="ml-1 sm:hidden">Eliminar</span>
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <Badge variant="secondary">{formatBytes(file.size)}</Badge>
                              <Badge variant="secondary" className="truncate max-w-[120px]">
                                {file.mime_type}
                              </Badge>
                              <Badge variant="secondary">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">{formatDate(file.uploaded_at)}</span>
                                <span className="sm:hidden">{new Date(file.uploaded_at).toLocaleDateString()}</span>
                              </Badge>
                              <Badge variant="secondary">
                                <Eye className="h-3 w-3 mr-1" />
                                {file.download_count} descargas
                              </Badge>
                              {file.delete_at && (
                                <Badge variant="destructive" className="truncate">
                                  Expira: {new Date(file.delete_at).toLocaleDateString()}
                                </Badge>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
