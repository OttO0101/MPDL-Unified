"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Package, Save, Download } from "lucide-react"
import { AppLogo } from "@/components/core/AppLogo"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DEVICE_OPTIONS,
  CLEANING_PRODUCTS_LIST,
  PRODUCT_SPECIFIC_QUANTITIES,
  MM_MF_PRODUCT_QUANTITIES,
  LAC_GROUP_DEFAULT_QUANTITIES,
  LAC_PAPEL_COCINA_QUANTITIES,
  PRODUCT_ID_PAPEL_COCINA,
  PRODUCT_ID_OTROS,
  LAC_CONSOLIDATED_INVENTORY_DEVICE,
} from "@/lib/constants"
import { getLatestInventory, getLacConsolidated, saveInventory } from "@/actions/get-inventory"
import { generateCleaningInventoryPdf } from "@/actions/generate-pdf"
import { toast } from "sonner"

interface ProductosLimpiezaProps {
  onBack: () => void
  showBackButton?: boolean
}

interface ProductQuantity {
  productId: string
  quantity: string
}

export default function ProductosLimpieza({ onBack, showBackButton = true }: ProductosLimpiezaProps) {
  const [selectedDevice, setSelectedDevice] = useState("")
  const [productQuantities, setProductQuantities] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lacSummaryQuantities, setLacSummaryQuantities] = useState<Record<string, number>>({})
  const [hasLoadedPrevious, setHasLoadedPrevious] = useState(false)

  const getQuantityOptions = (productId: string, device: string): string[] => {
    if (device === "MM" || device === "MF") {
      return MM_MF_PRODUCT_QUANTITIES[productId] || ["0", "1"]
    }

    if (device.startsWith("LAC") && device !== LAC_CONSOLIDATED_INVENTORY_DEVICE) {
      if (productId === PRODUCT_ID_PAPEL_COCINA) {
        return LAC_PAPEL_COCINA_QUANTITIES
      }
      return LAC_GROUP_DEFAULT_QUANTITIES
    }

    return PRODUCT_SPECIFIC_QUANTITIES[productId] || ["0", "1", "2", "3", "4", "5"]
  }

  const handleLoadPrevious = async () => {
    if (!selectedDevice) return

    setIsLoading(true)
    setError(null)

    try {
      if (selectedDevice === LAC_CONSOLIDATED_INVENTORY_DEVICE) {
        const result = await getLacConsolidated()
        if (result.success && result.quantities) {
          setLacSummaryQuantities(result.quantities)
          toast.success("Consolidado LAC cargado")
        } else {
          setError(result.error || "Error al cargar consolidado LAC")
          toast.error(result.error || "Error al cargar consolidado LAC")
        }
      } else {
        const result = await getLatestInventory(selectedDevice)
        if (result.success && result.quantities) {
          setProductQuantities(result.quantities)
          setHasLoadedPrevious(true)
          toast.success("Inventario anterior cargado")
        } else if (result.error) {
          setError(result.error)
          toast.error(result.error)
        } else {
          toast.info("No hay inventario anterior para este dispositivo")
        }
      }
    } catch (err) {
      console.error("[v0] Error loading previous inventory:", err)
      setError("Error al cargar inventario anterior")
      toast.error("Error al cargar inventario anterior")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeviceChange = (device: string) => {
    setSelectedDevice(device)
    setProductQuantities({})
    setLacSummaryQuantities({})
    setHasLoadedPrevious(false)
    setError(null)
  }

  const handleQuantityChange = (productId: string, quantity: string) => {
    setProductQuantities((prev) => ({
      ...prev,
      [productId]: quantity,
    }))
  }

  const handleSubmit = async () => {
    if (!selectedDevice || selectedDevice === LAC_CONSOLIDATED_INVENTORY_DEVICE) return

    setIsSubmitting(true)
    setError(null)

    try {
      const products: ProductQuantity[] = Object.entries(productQuantities)
        .filter(([productId, quantity]) => {
          if (productId === PRODUCT_ID_OTROS) {
            return quantity.trim() !== ""
          }
          return quantity !== "" && quantity !== "0"
        })
        .map(([productId, quantity]) => ({ productId, quantity }))

      const result = await saveInventory(selectedDevice, products)

      if (result.success) {
        setSuccess(true)
        setSelectedDevice("")
        setProductQuantities({})
        setHasLoadedPrevious(false)
        toast.success("Inventario guardado correctamente")

        // Regenerate PDF
        generateCleaningInventoryPdf().then((pdfResult) => {
          if (pdfResult.error) {
            console.error("[v0] Error regenerating PDF:", pdfResult.error)
          }
        })
      } else {
        setError(result.error || "Error al guardar")
        toast.error(result.error || "Error al guardar")
      }
    } catch (err) {
      console.error("[v0] Unexpected error saving inventory:", err)
      setError("Ocurrió un error inesperado al guardar el inventario.")
      toast.error("Error inesperado al guardar")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center py-8">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">¡Inventario Guardado!</h2>
              <p className="text-gray-600 mb-6">
                El inventario de productos de limpieza ha sido registrado correctamente en el sistema MPDL.
              </p>
              <div className="space-y-2">
                <Button onClick={() => setSuccess(false)} className="mr-2">
                  Registrar Otro Inventario
                </Button>
                <Button variant="outline" onClick={onBack}>
                  Volver al Inicio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const isLacConsolidated = selectedDevice === LAC_CONSOLIDATED_INVENTORY_DEVICE

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          {showBackButton && (
            <Button variant="ghost" onClick={onBack} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          )}
          <AppLogo size="small" className="mr-3" />
          <h1 className="text-2xl font-bold">Productos de Limpieza - MPDL</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registro de Inventario de Productos de Limpieza</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="device">Dispositivo</Label>
              <Select value={selectedDevice} onValueChange={handleDeviceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar dispositivo" />
                </SelectTrigger>
                <SelectContent>
                  {DEVICE_OPTIONS.map((device) => (
                    <SelectItem key={device} value={device}>
                      {device === LAC_CONSOLIDATED_INVENTORY_DEVICE ? "LAC (Consolidado)" : device}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDevice && (
              <Button
                onClick={handleLoadPrevious}
                disabled={isLoading}
                variant="outline"
                className="w-full bg-transparent"
              >
                <Download className="h-4 w-4 mr-2" />
                {isLoading ? "Cargando..." : "Cargar Inventario Anterior"}
              </Button>
            )}

            {selectedDevice && (
              <div className="space-y-4">
                <Alert>
                  <Package className="h-4 w-4" />
                  <AlertDescription>
                    {isLacConsolidated
                      ? `Cantidades consolidadas para los dispositivos LAC1 a LAC6.`
                      : `Selecciona la cantidad disponible de cada producto para el dispositivo ${selectedDevice}`}
                  </AlertDescription>
                </Alert>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CLEANING_PRODUCTS_LIST.map((product) => {
                    if (product.id === PRODUCT_ID_OTROS) {
                      return (
                        <div key={product.id} className="space-y-2">
                          <Label>{product.name}</Label>
                          <Input
                            type="text"
                            value={
                              isLacConsolidated ? "Ver detalles en sub-unidades" : productQuantities[product.id] || ""
                            }
                            onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                            placeholder="Especificar otros productos..."
                            readOnly={isLacConsolidated}
                            disabled={isLacConsolidated}
                          />
                        </div>
                      )
                    }

                    const quantityValue = isLacConsolidated
                      ? (lacSummaryQuantities[product.id] || 0).toString()
                      : productQuantities[product.id] || ""

                    return (
                      <div key={product.id} className="space-y-2">
                        <Label>{product.name}</Label>
                        {isLacConsolidated ? (
                          <Input type="text" value={quantityValue} readOnly disabled />
                        ) : (
                          <Select
                            value={quantityValue}
                            onValueChange={(value) => handleQuantityChange(product.id, value)}
                          >
                            <SelectTrigger className="w-1/2">
                              <SelectValue placeholder="Cantidad" />
                            </SelectTrigger>
                            <SelectContent>
                              {getQuantityOptions(product.id, selectedDevice).map((qty) => (
                                <SelectItem key={qty} value={qty}>
                                  {qty}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )
                  })}
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isLacConsolidated || Object.keys(productQuantities).length === 0}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Guardando..." : "Guardar Inventario"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
