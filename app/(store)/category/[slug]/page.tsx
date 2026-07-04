import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { CategoryClient } from './category-client'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cleanFirestoreData } from '@/lib/utils'

export const revalidate = 60

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  let categoryName = ''
  let parentCategory: {name: string, slug: string} | null = null
  let products: any[] = []
  let subcategories: any[] = []

  try {
    // 1. Find the category by slug
    const catQuery = query(collection(db, 'categories'), where('slug', '==', slug))
    const catSnap = await getDocs(catQuery)
    
    if (catSnap.empty) {
      return notFound()
    }

    const categoryDoc = cleanFirestoreData({ id: catSnap.docs[0].id, ...catSnap.docs[0].data() }) as any
    categoryName = categoryDoc.name
    const targetCategoryIds = [categoryDoc.id]

    // Fetch parent category for breadcrumb navigation
    const parentId = categoryDoc.parentCategoryId
    if (parentId) {
      const parentRef = doc(db, 'categories', parentId)
      const parentSnap = await getDoc(parentRef)
      if (parentSnap.exists()) {
        const parentData = cleanFirestoreData(parentSnap.data()) as any
        parentCategory = { name: parentData.name, slug: parentData.slug }
      }
    }

    // 2. Fetch subcategories
    const subCatQuery = query(collection(db, 'categories'), where('parentCategoryId', '==', categoryDoc.id))
    const subCatSnap = await getDocs(subCatQuery)
    const ignoreNames = ['new', 'used', 'refurbished']
    
    subCatSnap.forEach(d => {
      if (!ignoreNames.includes(d.data().name.toLowerCase())) {
        targetCategoryIds.push(d.id)
        subcategories.push({ id: d.id, ...d.data() })
      }
    })

    // 3. Fetch products
    const fetchedProducts: any[] = []
    const addedIds = new Set<string>()
    
    if (targetCategoryIds.length > 0) {
      for (let i = 0; i < targetCategoryIds.length; i += 30) {
        const chunk = targetCategoryIds.slice(i, i + 30)
        
        const prodQuery1 = query(collection(db, 'products'), where('categoryId', 'in', chunk))
        const prodQuery2 = query(collection(db, 'products'), where('subcategoryId', 'in', chunk))
        
        const [snap1, snap2] = await Promise.all([getDocs(prodQuery1), getDocs(prodQuery2)])
        
        snap1.forEach(d => {
          if (!addedIds.has(d.id)) {
            addedIds.add(d.id)
            fetchedProducts.push({ id: d.id, ...d.data() })
          }
        })
        
        snap2.forEach(d => {
          if (!addedIds.has(d.id)) {
            addedIds.add(d.id)
            fetchedProducts.push({ id: d.id, ...d.data() })
          }
        })
      }
    }
    
    products = fetchedProducts
  } catch (error) {
    console.error("Error fetching category products:", error)
  }

  return (
    <CategoryClient 
      categoryName={categoryName}
      parentCategory={parentCategory}
      initialProducts={products}
      subcategories={subcategories}
    />
  )
}
