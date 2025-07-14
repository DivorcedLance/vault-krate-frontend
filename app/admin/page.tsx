"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Server, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { APP_CONFIG, getHealthStatusUrl } from "@/lib/config";

interface HealthInfo {
  used_space: number;
  service_type: string;
  cpu_usage: number;
  memory_usage: number;
}

interface Instance {
  id: string;
  instance_identifier: string;
  provider: string;
  assigned_url: string;
  started_at: string;
  last_heartbeat: string;
  used_space: number;
}

interface ErrorDetails {
  server_identifier: string;
  server_url: string;
  provider: string;
  failed_at: string;
  enhanced_info?: {
    id: string;
    identifier: string;
    url: string;
    provider: string;
  };
}

interface ServerStatus {
  instance: Instance;
  healthInfo: HealthInfo | null;
  responseTime: number;
  status: 'healthy' | 'unhealthy';
  error?: string;
  errorDetails?: ErrorDetails;
}

interface HealthStatusResponse {
  success: boolean;
  timestamp: string;
  summary: {
    total_servers: number;
    healthy_servers: number;
    unhealthy_servers: number;
    overall_status: 'all_healthy' | 'all_unhealthy' | 'partial_healthy';
  };
  servers: ServerStatus[];
}

export default function AdminDashboard() {
  const [healthData, setHealthData] = useState<HealthStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Component lifecycle logging
  console.log('🎨 Admin Dashboard component rendered at', new Date().toISOString());

  const fetchHealthStatus = async () => {
    const startTime = Date.now();
    const healthUrl = getHealthStatusUrl();
    
    console.group('🔍 Health Status Check');
    console.log('📡 Fetching from:', healthUrl);
    console.log('⏱️ Started at:', new Date().toISOString());
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(healthUrl);
      const responseTime = Date.now() - startTime;
      
      console.log(`📊 Response received in ${responseTime}ms`);
      console.log('📋 Status:', response.status, response.statusText);
      
      if (!response.ok) {
        console.error('❌ HTTP Error:', response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: HealthStatusResponse = await response.json();
      
      console.log('✅ Health data received:', {
        total_servers: data.summary.total_servers,
        healthy_servers: data.summary.healthy_servers,
        unhealthy_servers: data.summary.unhealthy_servers,
        overall_status: data.summary.overall_status
      });
      
      if (data.summary.unhealthy_servers > 0) {
        console.warn('⚠️ Unhealthy servers detected:', data.summary.unhealthy_servers);
        data.servers.forEach(server => {
          if (server.status === 'unhealthy') {
            console.error(`💥 Server ${server.instance.instance_identifier} is down:`, {
              url: server.instance.assigned_url,
              error: server.error,
              response_time: server.responseTime + 'ms'
            });
          }
        });
      }
      
      setHealthData(data);
      const updateTime = new Date();
      setLastUpdate(updateTime);
      
      console.log('✅ Health status updated successfully');
      console.log('🕐 Last update:', updateTime.toLocaleString('es-ES'));
      
      // Log individual server statuses
      data.servers.forEach(server => {
        const status = server.status === 'healthy' ? '✅' : '❌';
        console.log(`${status} ${server.instance.instance_identifier}: ${server.responseTime}ms`);
      });
      
    } catch (err) {
      const responseTime = Date.now() - startTime;
      console.error('❌ Health check failed after', responseTime + 'ms');
      console.error('🔥 Error details:', err);
      
      // Enhanced error diagnosis
      if (err instanceof TypeError && err.message.includes('fetch')) {
        console.error('🌐 Network Error: Cannot reach balancer');
        console.error('🔍 Troubleshooting checklist:');
        console.error('   1. Is balancer running at', healthUrl, '?');
        console.error('   2. Check CORS configuration on balancer');
        console.error('   3. Verify network connectivity');
        console.error('   4. Check browser network tab for details');
      } else if (err instanceof Error && err.message.includes('HTTP')) {
        console.error('🚫 HTTP Error: Balancer responded with error');
        console.error('💡 Possible causes: Server error, authentication, or endpoint not found');
      }
      
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  };

  useEffect(() => {
    console.log('🚀 Admin Dashboard initialized');
    console.log('⚙️ Configuration:', {
      balancer_url: APP_CONFIG.BALANCER_URL,
      refresh_interval: APP_CONFIG.REFRESH_INTERVALS.HEALTH_CHECK + 'ms',
      timeout: APP_CONFIG.TIMEOUTS.HEALTH_CHECK + 'ms'
    });
    
    fetchHealthStatus();
    
    // Auto-refresh using configured interval
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh triggered');
      fetchHealthStatus();
    }, APP_CONFIG.REFRESH_INTERVALS.HEALTH_CHECK);
    
    return () => {
      console.log('🛑 Admin Dashboard cleanup - clearing interval');
      clearInterval(interval);
    };
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'unhealthy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getOverallStatusIcon = (status: string) => {
    switch (status) {
      case 'all_healthy': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'all_unhealthy': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'partial_healthy': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Administración</h1>
          <p className="text-gray-600">Monitoreo de servidores backend</p>
        </div>
        
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error de Conexión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => {
              console.log('🔄 Manual retry triggered from error state');
              fetchHealthStatus();
            }} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Administración</h1>
          <p className="text-gray-600">Monitoreo en tiempo real de la infraestructura</p>
        </div>
        <Button onClick={() => {
          console.log('🔄 Manual refresh triggered by user');
          fetchHealthStatus();
        }} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Summary Cards */}
      {healthData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Servidores</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{healthData.summary.total_servers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Servidores Activos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{healthData.summary.healthy_servers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Servidores Inactivos</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{healthData.summary.unhealthy_servers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado General</CardTitle>
              {getOverallStatusIcon(healthData.summary.overall_status)}
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {healthData.summary.overall_status === 'all_healthy' && 'Todos Activos'}
                {healthData.summary.overall_status === 'all_unhealthy' && 'Todos Inactivos'}
                {healthData.summary.overall_status === 'partial_healthy' && 'Parcialmente Activo'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Last Update Info */}
      {lastUpdate && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                Última actualización: {formatDate(lastUpdate.toISOString())}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Server className="h-4 w-4" />
                Balancer: {APP_CONFIG.BALANCER_URL}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Server Details */}
      {healthData && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Detalle de Servidores</h2>
          <div className="grid gap-4">
            {healthData.servers.map((server, index) => (
              <Card key={server.instance.id || index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(server.status)}`} />
                        {server.instance.instance_identifier}
                      </CardTitle>
                      <CardDescription>{server.instance.assigned_url}</CardDescription>
                    </div>
                    <Badge variant={server.status === 'healthy' ? 'default' : 'destructive'}>
                      {server.status === 'healthy' ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Proveedor</p>
                      <p className="text-sm">{server.instance.provider}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Tiempo de Respuesta</p>
                      <p className="text-sm">{server.responseTime}ms</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Espacio Usado</p>
                      <p className="text-sm">{formatBytes(server.instance.used_space)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Último Heartbeat</p>
                      <p className="text-sm">{formatDate(server.instance.last_heartbeat)}</p>
                    </div>
                  </div>

                  {server.healthInfo && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Información de Salud</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Tipo de Servicio:</span> {server.healthInfo.service_type}
                        </div>
                        <div>
                          <span className="font-medium">CPU:</span> {server.healthInfo.cpu_usage}%
                        </div>
                        <div>
                          <span className="font-medium">Memoria:</span> {server.healthInfo.memory_usage}%
                        </div>
                      </div>
                    </div>
                  )}

                  {server.error && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="bg-red-50 border border-red-200 rounded p-3 space-y-3">
                        <div>
                          <p className="text-sm text-red-600">
                            <span className="font-medium">Error:</span> {server.error}
                          </p>
                        </div>
                        
                        {server.errorDetails && (
                          <div className="border-t border-red-200 pt-3">
                            <h5 className="text-xs font-medium text-red-700 mb-2">Detalles del Fallo:</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-red-600">
                              <div>
                                <span className="font-medium">Servidor:</span> {server.errorDetails.server_identifier}
                              </div>
                              <div>
                                <span className="font-medium">Proveedor:</span> {server.errorDetails.provider}
                              </div>
                              <div className="md:col-span-2">
                                <span className="font-medium">URL:</span> {server.errorDetails.server_url}
                              </div>
                              <div className="md:col-span-2">
                                <span className="font-medium">Falló en:</span> {formatDate(server.errorDetails.failed_at)}
                              </div>
                            </div>
                            
                            {server.errorDetails.enhanced_info && (
                              <div className="mt-2 pt-2 border-t border-red-200">
                                <p className="text-xs text-red-500">
                                  <span className="font-medium">ID del Servidor:</span> {server.errorDetails.enhanced_info.id}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {loading && !healthData && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Cargando estado de servidores...</span>
          </div>
        </div>
      )}
    </div>
  );
}