import { db } from './lib/firebase'
import { collection, getDocs, limit } from 'firebase/firestore'

async function run() {
  const q = collection(db, 'products')
  const snap = await getDocs(q)
  const p = snap.docs[0].data()
  console.log("Keys in product:", Object.keys(p))
  console.log("categoryId:", p.categoryId)
  console.log("subcategoryId:", p.subcategoryId)
  process.exit(0)
}
run()
