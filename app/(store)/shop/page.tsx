import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ShopClient } from './shop-client'
import { cleanFirestoreData } from '@/lib/utils'

export const revalidate = 60

export default async function ShopPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams;
  const isSale = resolvedParams.sale === 'true';

  let products: any[] = []
  let categories: {id: string, name: string, parentCategoryId: string | null}[] = []

  try {
    const catSnap = await getDocs(collection(db, 'categories'))
    const ignoreNames = ['new', 'used', 'refurbished']
    catSnap.forEach(doc => {
      const data = doc.data()
      if (!ignoreNames.includes((data.name || '').toLowerCase())) {
        categories.push({ id: doc.id, name: data.name, parentCategoryId: data.parentCategoryId || null })
      }
    })

    // Fetch products
    const prodSnap = await getDocs(collection(db, 'products'))
    let fetchedProducts: any[] = []
    
    prodSnap.forEach(doc => {
      fetchedProducts.push(cleanFirestoreData({ id: doc.id, ...doc.data() }))
    })
    
    // If sale param is true, pre-filter
    if (isSale) {
      fetchedProducts = fetchedProducts.filter(p => p.discountPrice !== null && p.discountPrice < p.price)
    }
    
    products = fetchedProducts
  } catch (error) {
    console.error("Error fetching shop data:", error)
  }

  return (
    <ShopClient 
      initialProducts={products}
      categories={categories}
      title={isSale ? "Sale Items" : "All Products"}
      description="Explore our curated selection of top-tier products."
    />
  )
}
