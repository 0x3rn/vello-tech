import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ShopClient } from '../shop/shop-client'
import { UsedProductsClient } from './used-client'
import { cleanFirestoreData } from '@/lib/utils'

export const revalidate = 60

export default async function UsedPage() {
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

    // Fetch used/refurbished products
    const prodQuery = query(collection(db, 'products'), where('condition', 'in', ['used', 'refurbished']))
    const prodSnap = await getDocs(prodQuery)
    const fetchedProducts: any[] = []
    
    prodSnap.forEach(doc => {
      fetchedProducts.push(cleanFirestoreData({ id: doc.id, ...doc.data() }))
    })
    
    products = fetchedProducts
  } catch (error) {
    console.error("Error fetching used products:", error)
  }

  return (
    <ShopClient 
      initialProducts={products}
      categories={categories}
      title="Pre-Owned & Refurbished"
      description="Certified pre-owned and fully refurbished devices at a fraction of the cost."
    />
  )
}
