"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Info, X, FileText, ArrowRight, Trash2, ArrowUp, Cloud, CloudUpload, FilePen, BookOpenCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ItemManagement() {
  const [importFile, setImportFile] = useState<File | null>(null)
  const [updateFile, setUpdateFile] = useState<File | null>(null)
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [wizardType, setWizardType] = useState<'import' | 'update'>('import')
  const [fileData, setFileData] = useState<any>(null)
  const [isImportDragOver, setIsImportDragOver] = useState(false)
  const [isUpdateDragOver, setIsUpdateDragOver] = useState(false)
  const { toast } = useToast()

  const validateAndSetFile = (file: File, type: 'import' | 'update') => {
    if (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || 
        file.type === "application/vnd.ms-excel") {
      if (type === 'import') {
        setImportFile(file)
      } else {
        setUpdateFile(file)
      }
      setWizardType(type)
      setFileData(file)
      setIsWizardOpen(true)
      setWizardStep(1)
      // TODO: Parse file and set preview data
      setPreviewData([
        { sku: "SKU001", nombre: "Producto Ejemplo", precio: 25.99, stock: 100, categoria: "Electrónicos" },
        { sku: "SKU002", nombre: "Otro Producto", precio: 15.50, stock: 50, categoria: "Hogar" },
        { sku: "SKU003", nombre: "Producto Test", precio: 45.00, stock: 25, categoria: "Oficina" }
      ])
    } else {
      toast({
        title: "Formato de archivo no válido",
        description: "Por favor, sube un archivo .xlsx o .xls.",
        variant: "destructive",
      })
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'import' | 'update') => {
    const file = event.target.files?.[0]
    if (file) {
      validateAndSetFile(file, type)
    }
  }

  const handleDragOver = (e: React.DragEvent, type: 'import' | 'update') => {
    e.preventDefault()
    if (type === 'import') {
      setIsImportDragOver(true)
    } else {
      setIsUpdateDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent, type: 'import' | 'update') => {
    e.preventDefault()
    if (type === 'import') {
      setIsImportDragOver(false)
    } else {
      setIsUpdateDragOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent, type: 'import' | 'update') => {
    e.preventDefault()
    if (type === 'import') {
      setIsImportDragOver(false)
    } else {
      setIsUpdateDragOver(false)
    }
    const file = e.dataTransfer.files[0]
    if (file) {
      validateAndSetFile(file, type)
    }
  }

  const handleRemoveFile = (type: 'import' | 'update') => {
    if (type === 'import') {
      setImportFile(null)
    } else {
      setUpdateFile(null)
    }
  }

  const handleAreaClick = (type: 'import' | 'update') => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx,.xls'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        validateAndSetFile(file, type)
      }
    }
    input.click()
  }

  const handleWizardClose = () => {
    setIsWizardOpen(false)
    setWizardStep(1)
    setPreviewData([])
    setFileData(null)
    setImportFile(null)
    setUpdateFile(null)
  }

  const handleNextStep = () => {
    if (wizardStep < 3) {
      setWizardStep(wizardStep + 1)
    }
  }

  const handleFinalize = () => {
    toast({
      title: wizardType === 'import' ? "Importación completada" : "Actualización completada",
      description: "Los datos han sido procesados exitosamente.",
      variant: "default",
    })
    handleWizardClose()
  }

  const renderWizardStep = () => {
    switch (wizardStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <FileText className="h-12 w-12 text-camouflage-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-camouflage-green-900">
                Archivo cargado exitosamente
              </h3>
              <p className="text-camouflage-green-600 mt-2">
                {fileData?.name} con {previewData.length} ítems detectados
              </p>
            </div>
            
            <div className="bg-camouflage-green-50 border border-camouflage-green-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-camouflage-green-700">
                  <p className="font-medium">Formato válido</p>
                  <p className="text-xs mt-1">El archivo cumple con los requisitos de formato</p>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-camouflage-green-900">
              Previsualización de datos
            </h3>
            <p className="text-sm text-camouflage-green-600">
              Revisa los primeros registros que serán procesados:
            </p>
            
            <div className="border border-camouflage-green-200 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Categoría</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 10).map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.sku}</TableCell>
                      <TableCell>{item.nombre}</TableCell>
                      <TableCell>${item.precio}</TableCell>
                      <TableCell>{item.stock}</TableCell>
                      <TableCell>{item.categoria}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">No se detectaron errores críticos</span>
              </div>
            </div>
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-camouflage-green-900">
              Confirmación final
            </h3>
            
            <div className="bg-camouflage-green-50 border border-camouflage-green-200 rounded-lg p-4">
              <h4 className="font-medium text-camouflage-green-800 mb-3">Resumen de la operación:</h4>
              <div className="space-y-2 text-sm text-camouflage-green-700">
                <div className="flex justify-between">
                  <span>Ítems a {wizardType === 'import' ? 'crear' : 'actualizar'}:</span>
                  <span className="font-medium">{previewData.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Archivo:</span>
                  <span className="font-medium">{fileData?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Errores detectados:</span>
                  <span className="font-medium text-green-600">0</span>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-700">
                  <p className="font-medium">Advertencia importante</p>
                  <p className="mt-1">
                    Esta acción {wizardType === 'import' ? 'creará nuevos ítems' : 'modificará datos existentes'} de forma masiva. 
                    ¿Desea continuar?
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-camouflage-green-900 flex items-center">
              <Upload className="h-8 w-8 mr-3 text-camouflage-green-600" />
              Gestión Masiva de Items
            </h1>
            <p className="text-camouflage-green-600 mt-1">
              Importa nuevos ítems o actualiza los existentes de forma masiva usando archivos Excel.
            </p>
          </div>
        </div>

        {/* Cards principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card: Importar Nuevos Items */}
          <Card className="border-camouflage-green-200 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-camouflage-green-900 flex items-center">
                <FileSpreadsheet className="h-6 w-6 mr-2 text-camouflage-green-600" />
                Importar Nuevos Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-camouflage-green-600 text-sm">
                Importa nuevos productos al inventario usando un archivo Excel.
              </p>

              {/* Información simplificada */}
              <div className="bg-camouflage-green-50 border border-camouflage-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-camouflage-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-camouflage-green-700">
                    <p className="font-medium mb-1">Campos obligatorios:</p>
                    <p className="text-xs">Nombre, SKU, Precio, Categoría, Stock inicial</p>
                  </div>
                </div>
              </div>

              {/* Recomendaciones simplificadas */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <BookOpenCheck className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-700 space-y-1.5">
                    <p className="font-medium mb-1">Recomendaciones:</p>
                    <p className="text-xs">• Por favor, no alteres el orden o elimines columnas</p>
                    <p className="text-xs">• Máximo 3.000 productos por archivo</p>
                    <p className="text-xs">• Para controlar stock puedes incluir las columnas "Cantidad" y "Costo inicial"</p>
                  </div>
                </div>
              </div>

              {/* Drag & Drop Area */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-camouflage-green-700">
                  Seleccionar archivo (.xlsx)
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                    isImportDragOver 
                      ? 'border-camouflage-green-500 bg-camouflage-green-50' 
                      : 'border-camouflage-green-300 hover:border-camouflage-green-400 hover:bg-camouflage-green-25'
                  }`}
                  onClick={() => !importFile && handleAreaClick('import')}
                  onDragOver={(e) => handleDragOver(e, 'import')}
                  onDragLeave={(e) => handleDragLeave(e, 'import')}
                  onDrop={(e) => handleDrop(e, 'import')}
                >
                  {importFile ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 text-camouflage-green-700">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium">{importFile.name}</span>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveFile('import')
                          }}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-center gap-3">
                        <CloudUpload className="h-8 w-8 text-camouflage-green-500" />

                      </div>
                      <p className="text-sm text-camouflage-green-600 font-medium">
                        Arrastra tu archivo aquí o haz clic para seleccionar
                      </p>
                      <p className="text-xs text-camouflage-green-500">
                        Solo archivos .xlsx, .xls
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón descargar plantilla */}
              <Button
                variant="outline"
                onClick={() => toast({ title: "Descarga iniciada", description: "Descargando plantilla de importación..." })}
                className="w-full border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar plantilla de importación
              </Button>
          </CardContent>
        </Card>

          {/* Card: Actualizar Items Existentes */}
          <Card className="border-camouflage-green-200 hover:shadow-lg transition-shadow">
          <CardHeader>
              <CardTitle className="text-camouflage-green-900 flex items-center">
                <FilePen className="h-6 w-6 mr-2 text-camouflage-green-600" />
                Actualizar Items Existentes
              </CardTitle>
          </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-camouflage-green-600 text-sm">
                Actualiza información de productos existentes usando el SKU como identificador único.
              </p>

              {/* Información simplificada */}
              <div className="bg-camouflage-green-50 border border-camouflage-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-camouflage-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-camouflage-green-700">
                    <p className="font-medium mb-1">Reglas:</p>
                    <p className="text-xs">SKU debe existir, solo campos proporcionados se actualizan</p>
                    </div>
                    </div>
                    </div>

              {/* Recomendaciones simplificadas */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <BookOpenCheck className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-700 space-y-1.5">
                    <p className="font-medium mb-1">Recomendaciones:</p>
                    <p className="text-xs">• Conserva el orden y los títulos de las columnas para subir tu archivo actualizado</p>
                    <p className="text-xs">• Máximo 400 productos por archivo</p>
                    </div>
                    </div>
                    </div>

              {/* Drag & Drop Area */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-camouflage-green-700">
                  Seleccionar archivo (.xlsx)
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                    isUpdateDragOver 
                      ? 'border-camouflage-green-500 bg-camouflage-green-50' 
                      : 'border-camouflage-green-300 hover:border-camouflage-green-400 hover:bg-camouflage-green-25'
                  }`}
                  onClick={() => !updateFile && handleAreaClick('update')}
                  onDragOver={(e) => handleDragOver(e, 'update')}
                  onDragLeave={(e) => handleDragLeave(e, 'update')}
                  onDrop={(e) => handleDrop(e, 'update')}
                >
                  {updateFile ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 text-camouflage-green-700">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium">{updateFile.name}</span>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveFile('update')
                          }}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-center gap-3">
                        <CloudUpload className="h-8 w-8 text-camouflage-green-500" />              
                      </div>
                      <p className="text-sm text-camouflage-green-600 font-medium">
                        Arrastra tu archivo aquí o haz clic para seleccionar
                      </p>
                      <p className="text-xs text-camouflage-green-500">
                        Solo archivos .xlsx, .xls
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón descargar plantilla */}
              <Button
                variant="outline"
                onClick={() => toast({ title: "Descarga iniciada", description: "Descargando plantilla de actualización..." })}
                className="w-full border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar plantilla de actualización
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Wizard Modal */}
        <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white border-camouflage-green-200">
            <DialogHeader className="border-b border-camouflage-green-200 pb-4">
              <DialogTitle className="text-camouflage-green-900 flex items-center gap-2">
                {wizardType === 'import' ? 'Importar Nuevos Items' : 'Actualizar Items Existentes'}
                <span className="text-sm font-normal text-camouflage-green-600">
                  (Paso {wizardStep} de 3)
                </span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Progress indicator */}
              <div className="flex items-center justify-center space-x-2">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step <= wizardStep 
                        ? 'bg-camouflage-green-700 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step}
                    </div>
                    {step < 3 && (
                      <div className={`w-8 h-0.5 mx-2 ${
                        step < wizardStep ? 'bg-camouflage-green-700' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              {/* Step content */}
              {renderWizardStep()}

              {/* Action buttons */}
              <div className="flex justify-between pt-4 border-t border-camouflage-green-200">
                <Button
                  variant="outline"
                  onClick={handleWizardClose}
                  className="border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
                >
                  Cancelar
                </Button>
                
                <div className="flex gap-2">
                  {wizardStep < 3 ? (
                    <Button
                      onClick={handleNextStep}
                      className="bg-camouflage-green-700 hover:bg-camouflage-green-800 text-white"
                    >
                      Continuar
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleFinalize}
                      className="bg-camouflage-green-700 hover:bg-camouflage-green-800 text-white"
                    >
                      {wizardType === 'import' ? 'Finalizar Importación' : 'Aplicar Actualización'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}