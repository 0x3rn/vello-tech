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
  colors?: { name: string; hex: string }[]
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
    }
  )

  // Specs UI State
  const [specKey, setSpecKey] = useState('')
  const [specValue, setSpecValue] = useState('')

  // Colors UI State
  const [colorName, setColorName] = useState('')
  const [colorHex, setColorHex] = useState('#000000')

  // Images State
  const [uploadingImage, setUploadingImage] = useState(false)

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
    setFormData(prev => ({
      ...prev,
      colors: [...(prev.colors || []), { name: colorName, hex: colorHex }]
    }))
    setColorName('')
    setColorHex('#000000')
  }

  const removeColor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      colors: (prev.colors || []).filter((_, i) => i !== index)
    }))
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

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
      imageAlts: (prev.imageAlts || []).filter((_, i) => i !== index)
    }))
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

      const productRef = formData.id ? doc(db, 'products', formData.id) : doc(collection(db, 'products'))
      
      const payload = { ...formData, updatedAt: serverTimestamp() }
      if (!formData.id) {
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {initialData ? 'Edit Product' : 'Add New Product'}
        </h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
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
                    <div key={idx} className="flex items-center gap-2 bg-secondary/50 border border-border px-3 py-1.5 rounded-full">
                      <div className="w-4 h-4 rounded-full shadow-sm border border-black/10" style={{ backgroundColor: color.hex }} />
                      <span className="text-sm font-medium">{color.name}</span>
                      <button type="button" onClick={() => removeColor(idx)} className="text-muted-foreground hover:text-destructive ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-end gap-3 pt-4 border-t border-border mt-4">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Color Name (e.g. Midnight Green)</Label>
                    <Input value={colorName} onChange={(e) => setColorName(e.target.value)} placeholder="Color Name" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())} />
                  </div>
                  <div className="w-24 space-y-1">
                    <Label className="text-xs">Hex</Label>
                    <div className="flex items-center gap-2 h-10 border border-input rounded-md px-2 bg-background">
                      <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="w-6 h-6 p-0 border-0 cursor-pointer bg-transparent" />
                      <span className="text-xs uppercase text-muted-foreground flex-1">{colorHex}</span>
                    </div>
                  </div>
                  <Button type="button" onClick={addColor} variant="secondary">Add</Button>
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
    </form>
  )
}
