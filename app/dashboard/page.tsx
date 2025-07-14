"use client"

import React, { useEffect, useState, useCallback, useRef } from "react"
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
import { FileExpiryInput } from "@/components/FileExpiryInput"
import { toast } from "sonner"
import Image from "next/image"
import { APP_CONFIG, buildApiUrl } from "@/lib/config"

export interface FileInfo {
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

// Enhanced error handling utility
const handleApiError = async (operation: string, error: unknown, context?: unknown) => {
  const timestamp = new Date().toISOString();
  
  console.group(`❌ API Error - ${operation}`);
  console.error('🕐 Timestamp:', timestamp);
  console.error('🔥 Error:', error);
  
  if (context) {
    console.error('📋 Context:', context);
  }
  
  // Categorize error types
  if (error instanceof TypeError && error.message.includes('fetch')) {
    console.error('🌐 Network Error: Cannot reach server');
    console.error('💡 Possible causes:');
    console.error('   - Server is down');
    console.error('   - Network connectivity issues');
    console.error('   - CORS configuration problems');
    console.error('   - URL misconfiguration');
    console.error('🔍 Current balancer URL:', APP_CONFIG.BALANCER_URL);
    
    toast.error("Error de conexión. Verifica tu conexión a internet.");
    return { type: 'network', message: 'Network connectivity error' };
  }
  
  if (error instanceof Response) {
    console.error('🚫 HTTP Error Response:', error.status, error.statusText);
    
    // Try to parse error response for detailed information
    try {
      const errorData = await error.json();
      
      // Handle enhanced balancer error responses
      if (error.status === 502 && errorData.failed_server) {
        console.error('🔥 Backend Server Failure Details:', {
          failed_server: errorData.failed_server,
          error_type: errorData.error_type,
          error_details: errorData.error_details
        });
        
        const serverInfo = errorData.failed_server;
        const serverName = serverInfo.server_identifier || serverInfo.server_id || 'unknown';
        
        toast.error(`Servidor backend "${serverName}" no disponible. ${errorData.message}`);
        
        return { 
          type: 'backend_failure', 
          message: errorData.message,
          server_info: serverInfo
        };
      }
      
      // Log any other structured error response
      console.error('📋 Structured error response:', errorData);
    } catch {
      console.warn('⚠️ Could not parse error response as JSON');
    }
    
    switch (error.status) {
      case 400:
        console.error('💥 Bad Request - Invalid data sent to server');
        toast.error("Datos inválidos. Verifica la información enviada.");
        return { type: 'validation', message: 'Invalid request data' };
      
      case 401:
        console.error('🔐 Unauthorized - Authentication required');
        toast.error("Sesión expirada. Por favor inicia sesión nuevamente.");
        return { type: 'auth', message: 'Authentication required' };
      
      case 403:
        console.error('🚫 Forbidden - Access denied');
        toast.error("Acceso denegado. No tienes permisos para esta acción.");
        return { type: 'permission', message: 'Access denied' };
      
      case 404:
        console.error('🔍 Not Found - Resource not available');
        toast.error("Recurso no encontrado.");
        return { type: 'notfound', message: 'Resource not found' };
      
      case 413:
        console.error('📦 Payload Too Large - File too big');
        toast.error("Archivo demasiado grande. Reduce el tamaño e intenta nuevamente.");
        return { type: 'filesize', message: 'File too large' };
      
      case 500:
        console.error('💥 Internal Server Error');
        toast.error("Error interno del servidor. Intenta nuevamente más tarde.");
        return { type: 'server', message: 'Internal server error' };
      
      case 502:
        console.error('🚫 Bad Gateway - Backend server unavailable');
        toast.error("Servidor backend no disponible. Intenta más tarde.");
        return { type: 'backend', message: 'Backend server unavailable' };
      
      case 503:
        console.error('🚫 Service Unavailable');
        toast.error("Servicio no disponible temporalmente. Intenta más tarde.");
        return { type: 'unavailable', message: 'Service unavailable' };
      
      default:
        console.error('❓ Unknown HTTP Error');
        toast.error(`Error del servidor: ${error.status}`);
        return { type: 'unknown', message: `HTTP ${error.status}` };
    }
  }
  
  // Generic error
  console.error('❓ Unhandled Error Type');
  console.error('🔍 Error details:', error instanceof Error ? error.message : 'Unknown error');
  console.groupEnd();
  
  toast.error("Error inesperado. Por favor intenta nuevamente.");
  return { type: 'generic', message: error instanceof Error ? error.message : 'Unknown error' };
};

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const [files, setFiles] = useState<FileInfo[]>([])
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [description, setDescription] = useState("")
  const [editingFile, setEditingFile] = useState<FileInfo | null>(null)

  // Component lifecycle logging
  console.log('📄 Dashboard component rendered for user:', user?.email || 'anonymous');

  const fetchUserFiles = useCallback(async () => {
    if (!user) return

    console.group('📁 Fetching user files');
    console.log('👤 User ID:', user.id);
    
    const startTime = Date.now();
    
    try {
      const url = `${buildApiUrl('/files/info')}?user_id=${user.id}`;
      console.log('📡 Fetching from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const responseTime = Date.now() - startTime;
      console.log(`⏱️ Response time: ${responseTime}ms`);
      
      if (!response.ok) {
        throw response;
      }
      
      const data = await response.json();
      console.log(`✅ Files loaded: ${data.length} files`);
      console.log('📋 File details:', data.map((f: FileInfo) => ({
        id: f.file_id,
        name: f.file_name,
        size: formatBytes(f.size)
      })));
      
      setFiles(data);
    } catch (error) {
      await handleApiError('Fetch User Files', error, { user_id: user.id });
    } finally {
      console.groupEnd();
    }
  }, [user])

  const fetchUserInfo = useCallback(async () => {
    if (!user) return

    console.group('👤 Fetching user info');
    console.log('🆔 User ID:', user.id);
    
    const startTime = Date.now();
    
    try {
      const url = `${buildApiUrl('/users/info')}?user_id=${user.id}`;
      console.log('📡 Fetching from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const responseTime = Date.now() - startTime;
      console.log(`⏱️ Response time: ${responseTime}ms`);
      
      if (!response.ok) {
        throw response;
      }
      
      const data = await response.json();
      console.log('✅ User info loaded:', {
        file_count: data.file_count,
        space_used: formatBytes(data.space_used),
        space_limit: formatBytes(data.space_limit),
        usage_percentage: ((data.space_used / data.space_limit) * 100).toFixed(1) + '%'
      });
      
      setUserInfo(data);
    } catch (error) {
      await handleApiError('Fetch User Info', error, { user_id: user.id });
    } finally {
      console.groupEnd();
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchUserFiles()
      fetchUserInfo()
    }
  }, [user, fetchUserFiles, fetchUserInfo])

  const uploadFileChunked = async (file: File, metadata: Record<string, unknown>) => {
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
      is_temporary: false
    }

    formData.append("metadata", JSON.stringify(chunkMetadata))

    const response = await fetch(buildApiUrl("/files/upload/chunked"), {
      method: "POST",
      body: formData,
    })

    return response
  }


  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !user) return

    console.group('📤 File Upload');
    console.log('📁 File details:', {
      name: file.name,
      size: formatBytes(file.size),
      type: file.type,
      user_id: user.id
    });

    setUploading(true)
    const startTime = Date.now();
    
    try {
      const metadata = {
        user_id: user.id,
        description: description || "",
        file_name: file.name.replace(/\.[^/.]+$/, ""),
        mime_type: file.type,
      }

      console.log('📋 Upload metadata:', metadata);

      // Always use chunked upload
      const response = await uploadFileChunked(file, metadata)
      
      const uploadTime = Date.now() - startTime;
      console.log(`⏱️ Upload completed in ${uploadTime}ms`);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Upload successful:', result);
        
        toast.success(`Archivo "${file.name}" subido exitosamente`);
        
        setFile(null)
        setDescription("")
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        fetchUserFiles()
        fetchUserInfo()
      } else {
        throw response;
      }
    } catch (error) {
      await handleApiError('File Upload', error, {
        file_name: file.name,
        file_size: file.size,
        user_id: user.id
      });
    } finally {
      setUploading(false)
      console.groupEnd();
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este archivo?")) return

    console.group('🗑️ Delete File');
    console.log('📁 File ID:', fileId);
    
    const startTime = Date.now();
    
    try {
      const url = `${buildApiUrl('/files/delete')}?file_id=${fileId}`;
      console.log('📡 Deleting from:', url);
      
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        }
      })

      const responseTime = Date.now() - startTime;
      console.log(`⏱️ Response time: ${responseTime}ms`);

      if (!response.ok) {
        throw response;
      }

      console.log('✅ File deleted successfully');
      toast.success("Archivo eliminado correctamente");
      
      fetchUserFiles()
      fetchUserInfo()
    } catch (error) {
      await handleApiError('Delete File', error, { file_id: fileId });
    } finally {
      console.groupEnd();
    }
  }

  const handleUpdateFile = async (fileInfo: FileInfo) => {
    console.group('✏️ Update File');
    console.log('📁 File info:', {
      id: fileInfo.file_id,
      name: fileInfo.file_name,
      description: fileInfo.description,
      delete_at: fileInfo.delete_at
    });
    
    const startTime = Date.now();
    
    try {
      const url = buildApiUrl('/files/info');
      console.log('📡 Updating at:', url);
      
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fileInfo),
      })

      const responseTime = Date.now() - startTime;
      console.log(`⏱️ Response time: ${responseTime}ms`);

      if (!response.ok) {
        throw response;
      }

      console.log('✅ File updated successfully');
      toast.success("Archivo actualizado correctamente");
      
      setEditingFile(null)
      fetchUserFiles()
    } catch (error) {
      await handleApiError('Update File', error, { file_info: fileInfo });
    } finally {
      console.groupEnd();
    }
  }

  const handleDownload = async (fileId: string, fileName: string) => {
    console.group('📥 Download File');
    console.log('📁 File details:', { id: fileId, name: fileName });
    
    const startTime = Date.now();
    
    try {
      const url = `${buildApiUrl('/files/download')}?file_id=${fileId}`;
      console.log('📡 Downloading from:', url);
      
      const response = await fetch(url);

      const responseTime = Date.now() - startTime;
      console.log(`⏱️ Response time: ${responseTime}ms`);

      if (!response.ok) {
        throw response;
      }

      const contentLength = response.headers.get('content-length');
      console.log('📦 File size:', contentLength ? formatBytes(parseInt(contentLength)) : 'unknown');

      const blob = await response.blob();
      console.log('✅ Blob created:', formatBytes(blob.size));

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);

      console.log('✅ Download completed successfully');
      toast.success(`Archivo "${fileName}" descargado correctamente`);
    } catch (error) {
      await handleApiError('Download File', error, { 
        file_id: fileId, 
        file_name: fileName 
      });
    } finally {
      console.groupEnd();
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
              <Image
                src="/favicon.ico"
                alt="Vault-Krate Logo"
                width={32}
                height={32}
                className="h-6 w-6 sm:h-8 sm:w-8"
                priority
              />
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
                      ref={fileInputRef}
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
                              <Label className="text-sm font-medium">Editar nombre</Label>
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
                              <div>
                                <Label htmlFor="delete_at" className="text-sm font-medium">
                                  Programar fecha de eliminación (mínimo dentro de 3 horas)
                                </Label>
                                <FileExpiryInput 
                                  editingFile={editingFile}
                                  setEditingFile={setEditingFile}
                                />
                              </div>
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
                                    toast.success("¡Enlace copiado al portapapeles!")
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
                                  Expira: {new Date(file.delete_at).toLocaleDateString()} {new Date(file.delete_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
