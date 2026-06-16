'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useCartStore } from '@/lib/store/cart'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2, Minus, Plus, ShoppingCart, Star } from 'lucide-react'
import { toast } from 'sonner'
import { resolveImageUrl } from '@/lib/utils'

interface ProductData {
  id: string
  name: string
  brand: string
  price: number
  discountPrice: number | null
  stockQuantity: number
  description: string
  imageUrls: string[]
  specifications: Record<string, string>
  categoryId: string
  isFeatured: boolean
  rating: number
  numReviews: number
  slug: string
  condition?: 'new' | 'used' | 'refurbished'
  imageAlts?: string[]
  colors?: { name: string; hex: string }[]
}

interface CategoryData {
  id: string
  name: string
  slug: string
  parentCategoryId: string | null
}

export default function ProductDetailPage() {
  const { slug } = useParams()
  const [product, setProduct] = useState<ProductData | null>(null)
  const [category, setCategory] = useState<CategoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string } | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const { items, addItem, updateQuantity, removeItem } = useCartStore()

  const cartItem = product ? items.find((item) => item.id === product.id) : null

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const q = query(collection(db, 'products'), where('slug', '==', slug))
        const querySnapshot = await getDocs(q)
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0]
          const prodData = { id: docSnap.id, ...docSnap.data() } as ProductData
          setProduct(prodData)
          
          // Fetch Category
          if (prodData.categoryId) {
            const catRef = doc(db, 'categories', prodData.categoryId)
            const catSnap = await getDoc(catRef)
            if (catSnap.exists()) {
              setCategory({ id: catSnap.id, ...catSnap.data() } as CategoryData)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error)
      } finally {
        setLoading(false)
      }
    }
    
    if (slug) {
      fetchProduct()
    }
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
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

  const handleAddToCart = async () => {
    if (product?.colors && product.colors.length > 0 && !selectedColor) {
      toast.error("Please select a color first")
      return
    }

    setIsAdding(true)
    
    // Simulate short network delay for satisfying visual feedback
    await new Promise(resolve => setTimeout(resolve, 600))
    
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: resolveImageUrl(product.imageUrls?.[0]),
      quantity,
      slug: product.slug,
      categoryId: product.categoryId,
      selectedColor: selectedColor || undefined
    })
    
    toast.success(`${quantity} ${product.name} added to cart`, {
      description: "You can view your cart or continue shopping.",
    })
    setIsAdding(false)
  }

  const handleMinus = () => {
    setQuantity(Math.max(1, quantity - 1))
  }

  const handlePlus = () => {
    if (product) {
      setQuantity(Math.min(product.stockQuantity, quantity + 1))
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20 pt-8 lg:pt-12">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        
        <Link href={`/category/${category?.slug || ''}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {category ? category.name : 'Category'}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Images Gallery */}
          <div className="flex flex-col gap-4">
            <div className="relative aspect-square w-full rounded-2xl bg-secondary/30 overflow-hidden border border-border">
              <Image
                src={resolveImageUrl(product.imageUrls?.[activeImage])}
                alt={product.imageAlts?.[activeImage] || product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-8"
              />
            </div>
            {product.imageUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.imageUrls.map((url, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`relative aspect-square rounded-lg border-2 overflow-hidden bg-secondary/30 transition-all ${
                      activeImage === idx ? 'border-primary' : 'border-transparent hover:border-border'
                    }`}
                  >
                    <Image src={resolveImageUrl(url)} alt={product.imageAlts?.[idx] || `${product.name} ${idx + 1}`} fill sizes="100px" className="object-contain p-2" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-medium text-primary px-3 py-1 bg-primary/10 rounded-full">
                {product.brand}
              </span>
              <div className="flex items-center gap-1 text-sm text-muted-foreground ml-auto">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="font-medium text-foreground">{product.rating}</span>
                <span>({product.numReviews} reviews)</span>
              </div>
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-4">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-3 mb-6">
              <p className="text-2xl font-semibold text-foreground">
                ${(product.discountPrice || product.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              {product.discountPrice && (
                <p className="text-lg font-medium text-muted-foreground line-through">
                  ${product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>

            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              {product.description}
            </p>

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-medium text-foreground mb-3">
                  Color: <span className="text-muted-foreground font-normal">{selectedColor?.name || 'Select a color'}</span>
                </h3>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
                        selectedColor?.name === color.name ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-border hover:scale-110 shadow-sm'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      <span className="sr-only">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cart Actions */}
            <div className="p-6 bg-secondary/20 border border-border rounded-2xl mb-10">
              <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center justify-between border border-border rounded-lg bg-background p-1 w-32">
                  <button 
                    onClick={handleMinus}
                    className="p-2 hover:bg-secondary rounded-md transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-medium">{quantity}</span>
                  <button 
                    onClick={handlePlus}
                    className="p-2 hover:bg-secondary rounded-md transition-colors text-muted-foreground hover:text-foreground"
                    disabled={quantity >= product.stockQuantity}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-sm text-muted-foreground">
                  {product.stockQuantity > 0 ? (
                    <span className="text-green-600 font-medium">{product.stockQuantity} in stock</span>
                  ) : (
                    <span className="text-destructive font-medium">Out of stock</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={handleAddToCart}
                  disabled={product.stockQuantity === 0 || isAdding}
                  className="w-full h-14 text-lg font-medium"
                >
                  {isAdding ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <ShoppingCart className="mr-2 h-5 w-5" />
                  )}
                  {isAdding ? 'Adding...' : 'Add to Cart'}
                </Button>
                {cartItem && (
                  <Link href="/cart" className="w-full">
                    <Button 
                      variant="outline"
                      className="w-full h-12 font-medium border-primary/20 hover:bg-primary/5 text-primary"
                    >
                      View in Cart
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Specifications Table */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Specifications</h3>
                <div className="flex flex-col">
                  {Object.entries(product.specifications).map(([key, value], index) => (
                    <div 
                      key={key} 
                      className={`flex flex-col sm:flex-row py-4 ${index !== Object.keys(product.specifications).length - 1 ? 'border-b border-border' : ''}`}
                    >
                      <span className="sm:w-1/3 text-muted-foreground font-medium mb-1 sm:mb-0">
                        {key}
                      </span>
                      <span className="sm:w-2/3 text-foreground">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  )
}
