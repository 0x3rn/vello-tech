import { collection, doc, getDoc, getDocs, query, where, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ProductDetailClient, ProductData, CategoryData } from './product-detail-client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cleanFirestoreData } from '@/lib/utils'

export const revalidate = 60 // optional, keeps it fast with ISR

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  let product: ProductData | null = null
  let category: CategoryData | null = null
  const breadcrumbs: {name: string, slug: string}[] = []
  const similarProducts: ProductData[] = []

  try {
    const q = query(collection(db, 'products'), where('slug', '==', slug))
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0]
      product = cleanFirestoreData({ id: docSnap.id, ...docSnap.data() }) as ProductData
      
      // Fetch Category and Breadcrumbs
      const startingCatId = product.subcategoryId || product.categoryId;
      if (startingCatId) {
        let currentCatId = startingCatId
        let currentCatSnap = null
        
        while (currentCatId) {
          const catRef = doc(db, 'categories', currentCatId)
          const catSnap = await getDoc(catRef)
          if (catSnap.exists()) {
            const data = catSnap.data() as CategoryData
            breadcrumbs.unshift({ name: data.name, slug: data.slug })
            currentCatId = data.parentCategoryId || ''
            if (!currentCatSnap) currentCatSnap = catSnap // store the main category
          } else {
            break
          }
        }
        if (currentCatSnap && currentCatSnap.exists()) {
           category = cleanFirestoreData({ id: currentCatSnap.id, ...currentCatSnap.data() }) as CategoryData
        }

        // Fetch Similar Items
        const simQ = query(collection(db, 'products'), where('categoryId', '==', product.categoryId), limit(5))
        const simSnap = await getDocs(simQ)
        simSnap.forEach(d => {
          if (d.id !== product!.id && similarProducts.length < 4) {
            similarProducts.push(cleanFirestoreData({ id: d.id, ...d.data() }) as ProductData)
          }
        })
      }
    }
  } catch (error) {
    console.error('Error fetching product:', error)
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
        <p className="text-muted-foreground mb-8">We couldn&apos;t find the product you were looking for.</p>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    )
  }

  return (
    <ProductDetailClient 
      product={product} 
      category={category} 
      breadcrumbs={breadcrumbs} 
      similarProducts={similarProducts} 
    />
  )
}
