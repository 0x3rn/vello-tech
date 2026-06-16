'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ProductForm } from '@/components/admin/product-form'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function EditProductPage() {
  const { id } = useParams()
  const [initialData, setInitialData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'products', id as string)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setInitialData({ id: docSnap.id, ...docSnap.data() })
        } else {
          toast.error("Product not found")
        }
      } catch (error) {
        console.error("Error fetching product", error)
        toast.error("Failed to load product data")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchProduct()
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!initialData) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        Product not found.
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <ProductForm initialData={initialData} />
    </div>
  )
}
