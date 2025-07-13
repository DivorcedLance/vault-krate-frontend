"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Share2, Shield, Clock, Users } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import Image from "next/image"

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<string | null>(null)
  const { user, signInWithGoogle } = useAuth()

  const uploadFileChunked = async (file: File, metadata: Record<string, unknown>, endpoint: string) => {
    const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB chunks
    const chunks = []
    
    for (let start = 0; start < file.size; start += CHUNK_SIZE) {
      const chunk = file.slice(start, start + CHUNK_SIZE)
      chunks.push(chunk)
    }

    const formData = new FormData()
    chunks.forEach(chunk => {
      formData.append("file_data", chunk)
    })

    const chunkMetadata = {
      ...metadata,
      total_size: file.size,
      chunk_count: chunks.length,
      is_temporary: !user
    }

    formData.append("metadata", JSON.stringify(chunkMetadata))

    const response = await fetch(`https://vault-krate-balancer-01-946317982825.europe-west1.run.app${endpoint}`, {
      method: "POST",
      body: formData,
    })

    return response
  }


  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    try {
      const metadata = {
        user_id: user?.id || null,
        description: description || "",
        file_name: file.name.replace(/\.[^/.]+$/, ""),
        mime_type: file.type,
        delete_at: user ? undefined : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }

      // Always use chunked upload
      const endpoint = user ? "/files/upload/chunked" : "/files/upload/temp/chunked"
      const response = await uploadFileChunked(file, metadata, endpoint)

      if (response.ok) {
        const result = await response.json()
        setUploadResult(result.file_id)
        setFile(null)
        setDescription("")
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      console.error("Upload error:", error)
      alert("Error al subir el archivo. Por favor intenta de nuevo.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <Image
                src="/favicon.ico"
                alt="Vault-Krate Logo"
                width={32}
                height={32}
                className="h-6 w-6 sm:h-8 sm:w-8"
                priority
              />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Vault-Krate</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <span className="text-xs sm:text-sm text-gray-600 text-center">
                    Bienvenido, {user.email?.split("@")[0]}
                  </span>
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                </div>
              ) : (
                <Button
                  onClick={signInWithGoogle}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 text-xs sm:text-sm"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Iniciar sesión con Google</span>
                  <span className="sm:hidden">Google</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Comparte Archivos al Instante</h2>
        <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto px-4">
          Sube y comparte archivos rápidamente sin registro, o crea una cuenta para almacenamiento permanente y
          funciones avanzadas.
        </p>

        {/* Upload Form */}
        <Card className="w-full max-w-sm sm:max-w-md mx-auto">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-center space-x-2 text-lg sm:text-xl">
              <Upload className="h-5 w-5" />
                <span>{user ? "Subida Permanente" : "Subida Rápida"}</span>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {user
              ? "Tus archivos se almacenarán de forma permanente en tu cuenta."
              : "Los archivos expiran en 24 horas a menos que tengas una cuenta"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
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
                  Descripción (opcional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Añade una descripción para tu archivo..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 min-h-[80px] resize-none"
                />
              </div>
              <Button type="submit" disabled={!file || uploading} className="w-full">
                {uploading ? "Subiendo..." : "Subir Archivo"}
              </Button>
            </form>

            {uploadResult && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 mb-2 font-medium">¡Archivo subido exitosamente!</p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <Input value={`${process.env.NEXT_PUBLIC_SITE_URL}/file/${uploadResult}`} readOnly className="text-xs flex-1" />
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_SITE_URL}/file/${uploadResult}`)
                      alert("¡Enlace copiado al portapapeles!")
                    }}
                    className="w-full sm:w-auto"
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Copiar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        <h3 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8 sm:mb-12">
          ¿Por qué elegir Vault-Krate?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <Card className="text-center">
            <CardHeader className="pb-4">
              <Clock className="h-8 w-8 text-indigo-600 mb-2 mx-auto" />
              <CardTitle className="text-lg sm:text-xl">Rápido y Temporal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm sm:text-base">
                Sube archivos instantáneamente sin registro. Perfecto para compartir rápido con expiración automática.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader className="pb-4">
              <Shield className="h-8 w-8 text-indigo-600 mb-2 mx-auto" />
              <CardTitle className="text-lg sm:text-xl">Seguro y Permanente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm sm:text-base">
                Crea una cuenta para almacenamiento permanente, gestión de archivos y funciones de seguridad mejoradas.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader className="pb-4">
              <Users className="h-8 w-8 text-indigo-600 mb-2 mx-auto" />
              <CardTitle className="text-lg sm:text-xl">Fácil de compartir</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm sm:text-base">
                Comparte archivos con cualquiera usando enlaces simples. No se requiere cuenta para descargar.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-600 text-white py-8 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold mb-4">¿Listo para más funciones?</h3>
            <p className="text-lg sm:text-xl mb-6 sm:mb-8 opacity-90 max-w-2xl mx-auto">
            {user
              ? "¡Gracias por usar Vault-Krate! Disfruta de almacenamiento permanente, gestión de archivos y análisis detallados."
              : "Crea una cuenta para obtener almacenamiento permanente, gestión de archivos y análisis detallados."
            }
            </p>
          {!user && (
            <Button
              onClick={signInWithGoogle}
              size="lg"
              variant="secondary"
              className="flex items-center space-x-2 mx-auto text-sm sm:text-base"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Registrarse con Google</span>
            </Button>
          )}
        </div>
      </section>
    </div>
  )
}
