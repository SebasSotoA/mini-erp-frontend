"use client"

import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Info,
  X,
  FileText,
  ArrowRight,
  Trash2,
  ArrowUp,
  Cloud,
  CloudUpload,
  FilePen,
  BookOpenCheck,
} from "lucide-react"
import { useState } from "react"

import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

export default function ItemManagement() {
  const [importFile, setImportFile] = useState<File | null>(null)
  const [updateFile, setUpdateFile] = useState<File | null>(null)
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [wizardType, setWizardType] = useState<"import" | "update">("import")
  const [fileData, setFileData] = useState<any>(null)
  const [isImportDragOver, setIsImportDragOver] = useState(false)
  const [isUpdateDragOver, setIsUpdateDragOver] = useState(false)
  const { toast } = useToast()

  const validateAndSetFile = (file: File, type: "import" | "update") => {
    if (
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.type === "application/vnd.ms-excel"
    ) {
      if (type === "import") {
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
        { sku: "SKU002", nombre: "Otro Producto", precio: 15.5, stock: 50, categoria: "Hogar" },
        { sku: "SKU003", nombre: "Producto Test", precio: 45.0, stock: 25, categoria: "Oficina" },
      ])
    } else {
      toast({
        title: "Formato de archivo no válido",
        description: "Por favor, sube un archivo .xlsx o .xls.",
        variant: "destructive",
      })
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: "import" | "update") => {
    const file = event.target.files?.[0]
    if (file) {
      validateAndSetFile(file, type)
    }
  }

  const handleDragOver = (e: React.DragEvent, type: "import" | "update") => {
    e.preventDefault()
    if (type === "import") {
      setIsImportDragOver(true)
    } else {
      setIsUpdateDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent, type: "import" | "update") => {
    e.preventDefault()
    if (type === "import") {
      setIsImportDragOver(false)
    } else {
      setIsUpdateDragOver(false)
    }
  }

  const handleDrop = (e: React.DragEvent, type: "import" | "update") => {
    e.preventDefault()
    if (type === "import") {
      setIsImportDragOver(false)
    } else {
      setIsUpdateDragOver(false)
    }
    const file = e.dataTransfer.files[0]
    if (file) {
      validateAndSetFile(file, type)
    }
  }

  const handleRemoveFile = (type: "import" | "update") => {
    if (type === "import") {
      setImportFile(null)
    } else {
      setUpdateFile(null)
    }
  }

  const handleAreaClick = (type: "import" | "update") => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".xlsx,.xls"
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
      title: wizardType === "import" ? "Importación completada" : "Actualización completada",
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
              <FileText className="mx-auto mb-4 h-12 w-12 text-camouflage-green-600" />
              <h3 className="text-lg font-semibold text-camouflage-green-900">Archivo cargado exitosamente</h3>
              <p className="mt-2 text-camouflage-green-600">
                {fileData?.name} con {previewData.length} ítems detectados
              </p>
            </div>

            <div className="rounded-lg border border-camouflage-green-200 bg-camouflage-green-50 p-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                <div className="text-sm text-camouflage-green-700">
                  <p className="font-medium">Formato válido</p>
                  <p className="mt-1 text-xs">El archivo cumple con los requisitos de formato</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-camouflage-green-900">Previsualización de datos</h3>
            <p className="text-sm text-camouflage-green-600">Revisa los primeros registros que serán procesados:</p>

            <div className="overflow-hidden rounded-lg border border-camouflage-green-200">
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

            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
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
            <h3 className="text-lg font-semibold text-camouflage-green-900">Confirmación final</h3>

            <div className="rounded-lg border border-camouflage-green-200 bg-camouflage-green-50 p-4">
              <h4 className="mb-3 font-medium text-camouflage-green-800">Resumen de la operación:</h4>
              <div className="space-y-2 text-sm text-camouflage-green-700">
                <div className="flex justify-between">
                  <span>Ítems a {wizardType === "import" ? "crear" : "actualizar"}:</span>
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

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div className="text-sm text-amber-700">
                  <p className="font-medium">Advertencia importante</p>
                  <p className="mt-1">
                    Esta acción {wizardType === "import" ? "creará nuevos ítems" : "modificará datos existentes"} de
                    forma masiva. ¿Desea continuar?
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center text-3xl font-bold text-camouflage-green-900">
              <Upload className="mr-3 h-8 w-8 text-camouflage-green-600" />
              Gestión Masiva de Items
            </h1>
            <p className="mt-1 text-camouflage-green-600">
              Importa nuevos ítems o actualiza los existentes de forma masiva usando archivos Excel.
            </p>
          </div>
        </div>

        {/* Cards principales */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Card: Importar Nuevos Items */}
          <Card className="border-camouflage-green-200 transition-shadow hover:shadow-lg">
          <CardHeader>
              <CardTitle className="flex items-center text-camouflage-green-900">
                <FileSpreadsheet className="mr-2 h-6 w-6 text-camouflage-green-600" />
                Importar Nuevos Items
              </CardTitle>
          </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-camouflage-green-600">
                Importa nuevos productos al inventario usando un archivo Excel.
              </p>

              {/* Información simplificada */}
              <div className="rounded-lg border border-camouflage-green-200 bg-camouflage-green-50 p-3">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-camouflage-green-600" />
                  <div className="text-sm text-camouflage-green-700">
                    <p className="mb-1 font-medium">Campos obligatorios:</p>
                    <p className="text-xs">Nombre, SKU, Precio, Categoría, Stock inicial</p>
                    </div>
                    </div>
                    </div>

              {/* Recomendaciones simplificadas */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-start gap-2">
                  <BookOpenCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                  <div className="space-y-1.5 text-sm text-blue-700">
                    <p className="mb-1 font-medium">Recomendaciones:</p>
                    <p className="text-xs">• Por favor, no alteres el orden o elimines columnas</p>
                    <p className="text-xs">• Máximo 3.000 productos por archivo</p>
                    <p className="text-xs">
                      • Para controlar stock puedes incluir las columnas "Cantidad" y "Costo inicial"
                    </p>
                    </div>
                    </div>
                    </div>

              {/* Drag & Drop Area */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-camouflage-green-700">Seleccionar archivo (.xlsx)</label>
                <div
                  className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                    isImportDragOver
                      ? "border-camouflage-green-500 bg-camouflage-green-50"
                      : "hover:bg-camouflage-green-25 border-camouflage-green-300 hover:border-camouflage-green-400"
                  }`}
                  onClick={() => !importFile && handleAreaClick("import")}
                  onDragOver={(e) => handleDragOver(e, "import")}
                  onDragLeave={(e) => handleDragLeave(e, "import")}
                  onDrop={(e) => handleDrop(e, "import")}
                >
                  {importFile ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 text-camouflage-green-700">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium">{importFile.name}</span>
                      </div>
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveFile("import")
                          }}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-center gap-3">
                        <CloudUpload className="h-8 w-8 text-camouflage-green-500" />
                      </div>
                      <p className="text-sm font-medium text-camouflage-green-600">
                        Arrastra tu archivo aquí o haz clic para seleccionar
                      </p>
                      <p className="text-xs text-camouflage-green-500">Solo archivos .xlsx, .xls</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón descargar plantilla */}
              <Button
                variant="outline"
                onClick={() =>
                  toast({ title: "Descarga iniciada", description: "Descargando plantilla de importación..." })
                }
                className="w-full border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar plantilla de importación
              </Button>
            </CardContent>
          </Card>

          {/* Card: Actualizar Items Existentes */}
          <Card className="border-camouflage-green-200 transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-camouflage-green-900">
                <FilePen className="mr-2 h-6 w-6 text-camouflage-green-600" />
                Actualizar Items Existentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-camouflage-green-600">
                Actualiza información de productos existentes usando el SKU como identificador único.
              </p>

              {/* Información simplificada */}
              <div className="rounded-lg border border-camouflage-green-200 bg-camouflage-green-50 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-camouflage-green-600" />
                  <div className="text-sm text-camouflage-green-700">
                    <p className="mb-1 font-medium">Reglas:</p>
                    <p className="text-xs">SKU debe existir, solo campos proporcionados se actualizan</p>
                  </div>
                </div>
              </div>

              {/* Recomendaciones simplificadas */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-start gap-2">
                  <BookOpenCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                  <div className="space-y-1.5 text-sm text-blue-700">
                    <p className="mb-1 font-medium">Recomendaciones:</p>
                    <p className="text-xs">
                      • Conserva el orden y los títulos de las columnas para subir tu archivo actualizado
                    </p>
                    <p className="text-xs">• Máximo 400 productos por archivo</p>
                  </div>
                </div>
              </div>

              {/* Drag & Drop Area */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-camouflage-green-700">Seleccionar archivo (.xlsx)</label>
                <div
                  className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                    isUpdateDragOver
                      ? "border-camouflage-green-500 bg-camouflage-green-50"
                      : "hover:bg-camouflage-green-25 border-camouflage-green-300 hover:border-camouflage-green-400"
                  }`}
                  onClick={() => !updateFile && handleAreaClick("update")}
                  onDragOver={(e) => handleDragOver(e, "update")}
                  onDragLeave={(e) => handleDragLeave(e, "update")}
                  onDrop={(e) => handleDrop(e, "update")}
                >
                  {updateFile ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 text-camouflage-green-700">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium">{updateFile.name}</span>
                      </div>
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveFile("update")
                          }}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-center gap-3">
                        <CloudUpload className="h-8 w-8 text-camouflage-green-500" />
                      </div>
                      <p className="text-sm font-medium text-camouflage-green-600">
                        Arrastra tu archivo aquí o haz clic para seleccionar
                      </p>
                      <p className="text-xs text-camouflage-green-500">Solo archivos .xlsx, .xls</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón descargar plantilla */}
              <Button
                variant="outline"
                onClick={() =>
                  toast({ title: "Descarga iniciada", description: "Descargando plantilla de actualización..." })
                }
                className="w-full border-camouflage-green-300 text-camouflage-green-700 hover:bg-camouflage-green-50"
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar plantilla de actualización
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Wizard Modal */}
        <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
          <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto border-camouflage-green-200 bg-white">
            <DialogHeader className="border-b border-camouflage-green-200 pb-4">
              <DialogTitle className="flex items-center gap-2 text-camouflage-green-900">
                {wizardType === "import" ? "Importar Nuevos Items" : "Actualizar Items Existentes"}
                <span className="text-sm font-normal text-camouflage-green-600">(Paso {wizardStep} de 3)</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Progress indicator */}
              <div className="flex items-center justify-center space-x-2">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                        step <= wizardStep ? "bg-camouflage-green-700 text-white" : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {step}
                    </div>
                    {step < 3 && (
                      <div
                        className={`mx-2 h-0.5 w-8 ${step < wizardStep ? "bg-camouflage-green-700" : "bg-gray-200"}`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Step content */}
              {renderWizardStep()}

              {/* Action buttons */}
              <div className="flex justify-between border-t border-camouflage-green-200 pt-4">
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
                      variant="primary"
                    >
                      Continuar
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleFinalize}
                      variant="primary"
                    >
                      {wizardType === "import" ? "Finalizar Importación" : "Aplicar Actualización"}
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
