'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs, setDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, Trash2, Edit, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Category {
  id: string
  name: string
  slug: string
  parentCategoryId: string | null
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  
  // Form State
  const [isEditing, setIsEditing] = useState(false)
  const [formId, setFormId] = useState('')
  const [formName, setFormName] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formParentId, setFormParentId] = useState('')
  const [saving, setSaving] = useState(false)



  const fetchCategories = async () => {
    try {
      const snap = await getDocs(collection(db, 'categories'))
      const fetched: Category[] = []
      const ignoreNames = ['new', 'used', 'refurbished']
      snap.forEach(doc => {
        const data = doc.data()
        if (!ignoreNames.includes(data.name.toLowerCase())) {
          fetched.push({ id: doc.id, ...data } as Category)
        }
      })
      setCategories(fetched)
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast.error('Failed to load categories. Reference: ERR-VLT-DB-101')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const generateSlug = () => {
    if (!formName) return
    setFormSlug(formName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName || !formSlug) {
      toast.error("Name and Slug are required")
      return
    }

    if (['new', 'used', 'refurbished'].includes(formName.toLowerCase())) {
      toast.error('The names "New", "Used", and "Refurbished" are reserved for condition states.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: formName,
        slug: formSlug,
        parentCategoryId: formParentId || null
      }

      if (isEditing && formId) {
        const res = await fetch(`/api/admin/collections/categories/${formId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error("Failed to update category")
        toast.success("Category updated")
      } else {
        const res = await fetch(`/api/admin/collections/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error("Failed to create category")
        toast.success("Category created")
      }

      resetForm()
      fetchCategories()
    } catch (error) {
      console.error("Error saving category", error)
      toast.error("Failed to save category")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this category? Ensure no products are actively using it.")) return

    try {
      const res = await fetch(`/api/admin/collections/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error("Failed to delete category")
      toast.success("Category deleted")
      setCategories(categories.filter(c => c.id !== id))
    } catch (error) {
      console.error("Error deleting category", error)
      toast.error("Failed to delete category")
    }
  }

  const startEdit = (cat: Category) => {
    setIsEditing(true)
    setFormId(cat.id)
    setFormName(cat.name)
    setFormSlug(cat.slug)
    setFormParentId(cat.parentCategoryId || '')
  }

  const resetForm = () => {
    setIsEditing(false)
    setFormId('')
    setFormName('')
    setFormSlug('')
    setFormParentId('')
  }

  const getParentName = (parentId: string | null) => {
    if (!parentId) return '-'
    const parent = categories.find(c => c.id === parentId)
    return parent ? parent.name : parentId
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Categories</h1>
        <p className="text-muted-foreground mt-1">Manage your store&apos;s taxonomy and navigation structure.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{isEditing ? 'Edit Category' : 'Add Category'}</CardTitle>
                {isEditing && (
                  <Button variant="ghost" size="icon" onClick={resetForm} className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input id="name" value={formName} onChange={(e) => setFormName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug *</Label>
                  <div className="flex gap-2">
                    <Input id="slug" value={formSlug} onChange={(e) => setFormSlug(e.target.value)} required />
                    <Button type="button" variant="secondary" onClick={generateSlug}>Auto</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent">Parent Category (Optional)</Label>
                  <select 
                    id="parent" 
                    value={formParentId} 
                    onChange={(e) => setFormParentId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="">None (Top Level)</option>
                    {categories.filter(c => c.id !== formId).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <Button type="submit" disabled={saving} className="w-full mt-4">
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : (isEditing ? null : <Plus className="h-4 w-4 mr-2" />)}
                  {isEditing ? 'Update Category' : 'Create Category'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Table Column */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Category List</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  No categories found. Create one to get started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Parent</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((cat) => (
                        <TableRow key={cat.id}>
                          <TableCell className="font-medium">{cat.name}</TableCell>
                          <TableCell className="font-mono text-xs">{cat.slug}</TableCell>
                          <TableCell>{getParentName(cat.parentCategoryId)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => startEdit(cat)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(cat.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
