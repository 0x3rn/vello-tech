'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db, storage } from '@/lib/firebase'
import { collection, doc, setDoc, updateDoc, getDocs, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, Trash2, UploadCloud, X } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { resolveImageUrl } from '@/lib/utils'

interface ProductData {
  id?: string
  name: string
  slug: string
  brand: string
  description: string
  price: number
  discountPrice: number | null
  stockQuantity: number
  categoryId: string
  subcategoryId?: string
  condition: 'new' | 'used' | 'refurbished'
  imageUrls: string[]
  imageAlts?: string[]
  specifications: Record<string, string>
  isFeatured: boolean
  isNewArrival: boolean
  isBestSeller: boolean
  isCarousel: boolean
  colors?: { name: string; hex: string; priceModifier?: number; stockQuantity: number; imageUrls?: string[] }[]
  variantGroups?: { groupName: string; choices: { choiceName: string; priceModifier: number; stockQuantity: number }[] }[]
}

interface Category {
  id: string
  name: string
  parentCategoryId: string | null
}

export function ProductForm({ initialData }: { initialData?: ProductData }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  
  // Form State
  const [formData, setFormData] = useState<ProductData>(
    initialData || {
      name: '',
      slug: '',
      brand: '',
      description: '',
      price: 0,
      discountPrice: null,
      stockQuantity: 0,
      categoryId: '',
      subcategoryId: '',
      condition: 'new',
      imageUrls: [],
      imageAlts: [],
      specifications: {},
      isFeatured: false,
      isNewArrival: false,
      isBestSeller: false,
      isCarousel: false,
      colors: [],
      variantGroups: [],
    }
  )

  // Specs UI State
  const [specKey, setSpecKey] = useState('')
  const [specValue, setSpecValue] = useState('')

  // Colors UI State
  const [colorName, setColorName] = useState('')
  const [colorHex, setColorHex] = useState('#000000')
  const [colorPriceModifier, setColorPriceModifier] = useState('')
  const [colorStockQuantity, setColorStockQuantity] = useState('')

  // Variant Groups UI State
  const [vgName, setVgName] = useState('')
  const [vgChoiceName, setVgChoiceName] = useState('')
  const [vgChoicePrice, setVgChoicePrice] = useState('')
  const [vgChoiceStock, setVgChoiceStock] = useState('')
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null)

  // Images State
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingColorImageIndex, setUploadingColorImageIndex] = useState<number | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      const snap = await getDocs(collection(db, 'categories'))
      const fetched: Category[] = []
      const ignoreNames = ['new', 'used', 'refurbished']
      snap.forEach(doc => {
        const name = doc.data().name
        if (!ignoreNames.includes(name.toLowerCase())) {
          fetched.push({ 
            id: doc.id, 
            name: name,
            parentCategoryId: doc.data().parentCategoryId || null
          })
        }
      })
      setCategories(fetched)
    }
    fetchCategories()
  }, [])

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updates: any = {
        [name]: name === 'price' || name === 'discountPrice' || name === 'stockQuantity' 
          ? (value === '' ? (name === 'discountPrice' ? null : 0) : Number(value)) 
          : value
      }
      if (name === 'categoryId') {
        updates.subcategoryId = ''
      }
      return { ...prev, ...updates }
    })
  }

  const handleToggle = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  // Generate slug from name
  const generateSlug = () => {
    if (!formData.name) return
    const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    setFormData(prev => ({ ...prev, slug }))
  }

  // Add Spec
  const addSpec = () => {
    if (!specKey || !specValue) return
    setFormData(prev => ({
      ...prev,
      specifications: { ...prev.specifications, [specKey]: specValue }
    }))
    setSpecKey('')
    setSpecValue('')
  }

  const removeSpec = (key: string) => {
    setFormData(prev => {
      const newSpecs = { ...prev.specifications }
      delete newSpecs[key]
      return { ...prev, specifications: newSpecs }
    })
  }

  // Add Color
  const addColor = () => {
    if (!colorName || !colorHex) return
    
    const newStockQty = Number(colorStockQuantity) || 0
    const currentTotal = (formData.colors || []).reduce((acc, c) => acc + (c.stockQuantity || 0), 0)
    
    if (currentTotal + newStockQty > formData.stockQuantity) {
      toast.error(`Cannot add ${newStockQty} items. Total color stock would exceed product capacity (${formData.stockQuantity}). Currently used: ${currentTotal}.`)
      return
    }
    
    const newColor: any = { name: colorName, hex: colorHex, stockQuantity: newStockQty }
    if (colorPriceModifier) newColor.priceModifier = Number(colorPriceModifier)
    
    setFormData(prev => ({
      ...prev,
      colors: [...(prev.colors || []), newColor]
    }))
    setColorName('')
    setColorHex('#000000')
    setColorPriceModifier('')
    setColorStockQuantity('')
  }

  const removeColor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      colors: (prev.colors || []).filter((_, i) => i !== index)
    }))
  }

  // Variant Groups
  const addVariantGroup = () => {
    if (!vgName) return
    setFormData(prev => ({
      ...prev,
      variantGroups: [...(prev.variantGroups || []), { groupName: vgName, choices: [] }]
    }))
    setVgName('')
  }

  const removeVariantGroup = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variantGroups: (prev.variantGroups || []).filter((_, i) => i !== index)
    }))
    if (activeGroupIndex === index) setActiveGroupIndex(null)
  }

  const addVariantChoice = (groupIndex: number) => {
    if (!vgChoiceName) return

    const priceMod = vgChoicePrice ? Number(vgChoicePrice) : 0
    const stockQty = vgChoiceStock ? Number(vgChoiceStock) : 0

    const groups = [...(formData.variantGroups || [])]
    const group = groups[groupIndex]
    const currentTotal = group.choices.reduce((acc, c) => acc + (c.stockQuantity || 0), 0)
    
    if (currentTotal + stockQty > formData.stockQuantity) {
      toast.error(`Cannot add ${stockQty} items. Total variant stock would exceed product capacity (${formData.stockQuantity}). Currently used: ${currentTotal}.`)
      return
    }

    setFormData(prev => {
      const updatedGroups = [...(prev.variantGroups || [])]
      updatedGroups[groupIndex] = {
        ...updatedGroups[groupIndex],
        choices: [...updatedGroups[groupIndex].choices, { choiceName: vgChoiceName, priceModifier: priceMod, stockQuantity: stockQty }]
      }
      return { ...prev, variantGroups: updatedGroups }
    })
    setVgChoiceName('')
    setVgChoicePrice('')
    setVgChoiceStock('')
  }

  const removeVariantChoice = (groupIndex: number, choiceIndex: number) => {
    setFormData(prev => {
      const groups = [...(prev.variantGroups || [])]
      groups[groupIndex] = {
        ...groups[groupIndex],
        choices: groups[groupIndex].choices.filter((_, i) => i !== choiceIndex)
      }
      return { ...prev, variantGroups: groups }
    })
  }

  // Handle Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`
      const storageRef = ref(storage, `products/${filename}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)
      
      setFormData(prev => ({
        ...prev,
        imageUrls: [...prev.imageUrls, downloadURL],
        imageAlts: [...(prev.imageAlts || []), '']
      }))
      toast.success("Image uploaded")
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload image")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleColorImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingColorImageIndex(index)
    try {
      const filename = `${Date.now()}_color_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`
      const storageRef = ref(storage, `products/colors/${filename}`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)
      
      setFormData(prev => {
        const newColors = [...(prev.colors || [])];
        const colorToUpdate = { ...newColors[index] };
        const currentUrls = colorToUpdate.imageUrls ? [...colorToUpdate.imageUrls] : [];
        
        if (currentUrls.length < 2 && !currentUrls.includes(downloadURL)) {
          currentUrls.push(downloadURL);
        }
        
        colorToUpdate.imageUrls = currentUrls;
        newColors[index] = colorToUpdate;
        
        return { ...prev, colors: newColors };
      })
      toast.success("Color image uploaded")
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload color image")
    } finally {
      setUploadingColorImageIndex(null)
    }
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
      imageAlts: (prev.imageAlts || []).filter((_, i) => i !== index)
    }))
  }

  const removeColorImage = (colorIndex: number, imageIndex: number) => {
    setFormData(prev => {
      const newColors = [...(prev.colors || [])];
      newColors[colorIndex] = {
        ...newColors[colorIndex],
        imageUrls: newColors[colorIndex].imageUrls?.filter((_, i) => i !== imageIndex)
      };
      return { ...prev, colors: newColors };
    })
  }

  const handleAltTextChange = (index: number, text: string) => {
    setFormData(prev => {
      const newAlts = [...(prev.imageAlts || [])];
      // Ensure the array is long enough if it's an old product being edited
      while (newAlts.length < prev.imageUrls.length) {
        newAlts.push('');
      }
      newAlts[index] = text;
      return { ...prev, imageAlts: newAlts };
    })
  }

  // Save Product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.name || !formData.slug || !formData.categoryId || formData.price <= 0) {
        toast.error("Please fill out all required fields properly.")
        setLoading(false)
        return
      }

      // Auto-commit any pending inputs that the user forgot to explicitly add
      let finalFormData = { ...formData }
      
      if (vgName) {
        finalFormData.variantGroups = [
          ...(finalFormData.variantGroups || []),
          { groupName: vgName, choices: [] }
        ]
      }
      if (activeGroupIndex !== null && vgChoiceName) {
        if (!finalFormData.variantGroups) finalFormData.variantGroups = []
        if (finalFormData.variantGroups[activeGroupIndex]) {
          const priceMod = vgChoicePrice ? Number(vgChoicePrice) : 0
          const stockQty = vgChoiceStock ? Number(vgChoiceStock) : 0;
          finalFormData.variantGroups[activeGroupIndex].choices.push({ choiceName: vgChoiceName, priceModifier: priceMod, stockQuantity: stockQty })
        }
      }
      
      if (colorName && colorHex) {
        const newColor: any = { name: colorName, hex: colorHex }
        if (colorPriceModifier) newColor.priceModifier = Number(colorPriceModifier)
        finalFormData.colors = [...(finalFormData.colors || []), newColor]
      }
      
      if (specKey && specValue) {
        finalFormData.specifications = {
          ...finalFormData.specifications,
          [specKey]: specValue
        }
      }

      const productRef = finalFormData.id ? doc(db, 'products', finalFormData.id) : doc(collection(db, 'products'))
      
      const payload = { ...finalFormData, updatedAt: serverTimestamp() }
      if (!finalFormData.id) {
        (payload as any).createdAt = serverTimestamp()
        await setDoc(productRef, payload)
        toast.success("Product created successfully")
      } else {
        await updateDoc(productRef, payload as any)
        toast.success("Product updated successfully")
      }
      
      router.push('/admin/products')
      router.refresh()
    } catch (error) {
      console.error("Error saving product:", error)
      toast.error("An error occurred while saving.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-24 sm:pb-0 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {initialData ? 'Edit Product' : 'Add New Product'}
        </h1>
        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-3 w-full sm:w-auto">
          <Button variant="outline" type="button" onClick={() => router.push('/admin/products')} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Main Info) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleTextChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL friendly) *</Label>
                <div className="flex gap-2">
                  <Input id="slug" name="slug" value={formData.slug} onChange={handleTextChange} required />
                  <Button type="button" variant="secondary" onClick={generateSlug}>Generate</Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand *</Label>
                  <Input id="brand" name="brand" value={formData.brand} onChange={handleTextChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition *</Label>
                  <select 
                    id="condition" 
                    name="condition" 
                    value={formData.condition} 
                    onChange={handleTextChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="new">New</option>
                    <option value="used">Used</option>
                    <option value="refurbished">Refurbished</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleTextChange} rows={6} required />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6 mb-4">
                {formData.imageUrls.map((url, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="relative w-24 h-24 bg-secondary rounded-md border border-border flex items-center justify-center shrink-0">
                      <Image src={resolveImageUrl(url)} alt="Product" fill className="object-contain p-2" />
                      <button 
                        type="button" 
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:scale-110 transition-transform"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={`alt-${index}`} className="text-xs text-muted-foreground mb-1 block">Alt Text (SEO & Accessibility)</Label>
                      <Input 
                        id={`alt-${index}`}
                        placeholder="e.g. Silver iPhone 14 Pro Max back view"
                        value={formData.imageAlts?.[index] || ''}
                        onChange={(e) => handleAltTextChange(index, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
                
                <label className="relative w-24 h-24 bg-secondary/50 rounded-md border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                  {uploadingImage ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /> : <UploadCloud className="w-6 h-6 text-muted-foreground" />}
                  <span className="text-[10px] text-muted-foreground mt-1">Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Specifications Builder</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(formData.specifications).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <Input value={key} readOnly className="w-1/3 bg-muted" />
                    <Input value={value} readOnly className="flex-1 bg-muted" />
                    <Button type="button" variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => removeSpec(key)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <div className="flex items-end gap-3 pt-4 border-t border-border mt-4">
                  <div className="w-1/3 space-y-1">
                    <Label className="text-xs">Property (e.g. RAM)</Label>
                    <Input value={specKey} onChange={(e) => setSpecKey(e.target.value)} placeholder="Key" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Value (e.g. 16GB)</Label>
                    <Input value={specValue} onChange={(e) => setSpecValue(e.target.value)} placeholder="Value" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpec())} />
                  </div>
                  <Button type="button" onClick={addSpec} variant="secondary">Add</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Colors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(formData.colors || []).map((color, idx) => (
                    <div key={idx} className="flex flex-col gap-1 bg-secondary/50 border border-border px-3 py-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full shadow-sm border border-black/10" style={{ backgroundColor: color.hex }} />
                        <span className="text-sm font-medium">{color.name}</span>
                        <button type="button" onClick={() => removeColor(idx)} className="text-muted-foreground hover:text-destructive ml-1">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        {color.priceModifier !== undefined && color.priceModifier !== 0 && (
                          <span className="text-xs text-muted-foreground">
                            {color.priceModifier > 0 ? '+' : ''}${color.priceModifier}
                          </span>
                        )}
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-auto">
                          Stock: {color.stockQuantity ?? 0}
                        </span>
                      </div>
                      
                      {/* Color Images */}
                      <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
                        <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Color Images (Max 2)</Label>
                        <div className="flex flex-wrap gap-2">
                          {color.imageUrls?.map((url: string, imgIdx: number) => (
                            <div key={imgIdx} className="relative w-12 h-12 rounded-md overflow-hidden border border-border group bg-secondary/30">
                              <Image src={resolveImageUrl(url)} alt={`${color.name} image ${imgIdx + 1}`} fill sizes="48px" className="object-cover" />
                              <button
                                type="button"
                                onClick={() => removeColorImage(idx, imgIdx)}
                                className="absolute top-0.5 right-0.5 p-0.5 bg-destructive text-destructive-foreground rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          
                          {(!color.imageUrls || color.imageUrls.length < 2) && (
                            <div className="relative w-12 h-12 rounded-md border border-dashed border-border flex items-center justify-center bg-secondary/10 hover:bg-secondary/20 transition-colors">
                              {uploadingColorImageIndex === idx ? (
                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                              ) : (
                                <Plus className="w-4 h-4 text-muted-foreground" />
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleColorImageUpload(idx, e)}
                                disabled={uploadingColorImageIndex === idx}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t border-border mt-4 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">Color Name (e.g. Red)</Label>
                    <Input value={colorName} onChange={(e) => setColorName(e.target.value)} placeholder="Color Name" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Hex</Label>
                    <div className="flex items-center gap-2 h-9 border border-input rounded-md px-2 bg-background">
                      <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="w-6 h-6 p-0 border-0 cursor-pointer bg-transparent" />
                      <span className="text-xs uppercase text-muted-foreground flex-1">{colorHex}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Additional Cost ($) (Optional)</Label>
                    <Input type="number" step="0.01" value={colorPriceModifier} onChange={(e) => setColorPriceModifier(e.target.value)} placeholder="0.00" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Stock Quantity</Label>
                    <Input type="number" value={colorStockQuantity} onChange={(e) => setColorStockQuantity(e.target.value)} placeholder="0" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())} />
                  </div>
                  <div className="md:col-span-1 sm:col-span-2">
                    <Button type="button" onClick={addColor} variant="secondary" className="w-full">Add Color</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Variants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(formData.variantGroups || []).map((group, groupIndex) => (
                  <div key={groupIndex} className="bg-secondary/10 border border-border p-4 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-foreground">{group.groupName}</h4>
                      <Button type="button" variant="ghost" size="sm" className="text-destructive h-8" onClick={() => removeVariantGroup(groupIndex)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Remove Group
                      </Button>
                    </div>
                    
                    {group.choices.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {group.choices.map((choice, choiceIndex) => (
                          <div key={choiceIndex} className="flex items-center bg-background border border-border rounded-full pl-3 pr-1 py-1 text-sm">
                            <span>{choice.choiceName}</span>
                            {choice.priceModifier ? (
                              <span className="text-muted-foreground ml-1 text-xs">({choice.priceModifier > 0 ? '+' : ''}${choice.priceModifier})</span>
                            ) : null}
                            <span className="text-muted-foreground ml-1 text-xs">[Stock: {choice.stockQuantity}]</span>
                            <button type="button" onClick={() => removeVariantChoice(groupIndex, choiceIndex)} className="ml-2 p-1 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeGroupIndex === groupIndex ? (
                      <div className="flex items-end gap-3 pt-2 border-t border-border mt-2">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">Choice Name</Label>
                          <Input size={1} value={vgChoiceName} onChange={(e) => setVgChoiceName(e.target.value)} placeholder="e.g. 512GB" />
                        </div>
                        <div className="w-24 space-y-1">
                          <Label className="text-xs">Cost ($)</Label>
                          <Input size={1} type="number" step="0.01" value={vgChoicePrice} onChange={(e) => setVgChoicePrice(e.target.value)} placeholder="0.00" />
                        </div>
                        <div className="w-24 space-y-1">
                          <Label className="text-xs">Stock</Label>
                          <Input size={1} type="number" value={vgChoiceStock} onChange={(e) => setVgChoiceStock(e.target.value)} placeholder="0" />
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" onClick={() => addVariantChoice(groupIndex)} variant="secondary">Add</Button>
                          <Button type="button" onClick={() => { setActiveGroupIndex(null); setVgChoiceName(''); setVgChoicePrice(''); setVgChoiceStock(''); }} variant="ghost" size="icon"><X className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    ) : (
                      <Button type="button" variant="outline" size="sm" onClick={() => setActiveGroupIndex(groupIndex)} className="text-xs">
                        <Plus className="w-3 h-3 mr-1" /> Add Choice
                      </Button>
                    )}
                  </div>
                ))}

                <div className="flex items-end gap-3 pt-4 border-t border-border">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">New Group Name</Label>
                    <Input value={vgName} onChange={(e) => setVgName(e.target.value)} placeholder="e.g. Storage Capacity" />
                  </div>
                  <Button type="button" onClick={addVariantGroup} variant="secondary">Add Group</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Pricing, Inventory, Toggles) */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">Regular Price ($) *</Label>
                <Input id="price" name="price" type="number" step="0.01" min="0" value={formData.price} onChange={handleTextChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountPrice">Sale Price ($) (Optional)</Label>
                <Input id="discountPrice" name="discountPrice" type="number" step="0.01" min="0" value={formData.discountPrice || ''} onChange={handleTextChange} placeholder="Leave empty for no sale" />
              </div>
              <div className="space-y-2 pt-4 border-t border-border mt-4">
                <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                <Input id="stockQuantity" name="stockQuantity" type="number" min="0" value={formData.stockQuantity} onChange={handleTextChange} required />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="categoryId">Main Category *</Label>
                <select 
                  id="categoryId" 
                  name="categoryId" 
                  value={formData.categoryId} 
                  onChange={handleTextChange}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled>Select a main category</option>
                  {categories.filter(c => !c.parentCategoryId).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subcategoryId">Subcategory</Label>
                <select 
                  id="subcategoryId" 
                  name="subcategoryId" 
                  value={formData.subcategoryId || ''} 
                  onChange={handleTextChange}
                  disabled={!formData.categoryId}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled>Select a subcategory</option>
                  {categories.filter(c => c.parentCategoryId === formData.categoryId).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Marketing Flags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Featured</Label>
                  <p className="text-[10px] text-muted-foreground">Show in featured lists</p>
                </div>
                <Switch checked={formData.isFeatured} onCheckedChange={(c) => handleToggle('isFeatured', c)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New Arrival</Label>
                  <p className="text-[10px] text-muted-foreground">Mark as new</p>
                </div>
                <Switch checked={formData.isNewArrival} onCheckedChange={(c) => handleToggle('isNewArrival', c)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Best Seller</Label>
                  <p className="text-[10px] text-muted-foreground">Highlight as best seller</p>
                </div>
                <Switch checked={formData.isBestSeller} onCheckedChange={(c) => handleToggle('isBestSeller', c)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Homepage Carousel</Label>
                  <p className="text-[10px] text-muted-foreground">Display in main hero</p>
                </div>
                <Switch checked={formData.isCarousel} onCheckedChange={(c) => handleToggle('isCarousel', c)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border z-50 flex gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <Button variant="outline" type="button" onClick={() => router.push('/admin/products')} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save
        </Button>
      </div>
    </form>
  )
}
