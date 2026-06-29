"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, MapPin, Plus, Trash2, Edit2, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Country, State as CSCState } from "country-state-city"

interface Address {
  id: string
  name: string
  street: string
  city: string
  state: string
  zip: string
  country: string
  isDefault: boolean
}

export default function AddressesPage() {
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  
  // Form State
  const [name, setName] = useState("")
  const [street, setStreet] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zip, setZip] = useState("")
  const [country, setCountry] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [countriesList, setCountriesList] = useState<any[]>([])
  const [statesList, setStatesList] = useState<any[]>([])

  useEffect(() => {
    setCountriesList(Country.getAllCountries())
  }, [])

  useEffect(() => {
    if (country) {
      setStatesList(CSCState.getStatesOfCountry(country))
    } else {
      setStatesList([])
    }
  }, [country])

  const fetchAddresses = async () => {
    if (!user) return
    try {
      const q = query(collection(db, "users", user.uid, "addresses"))
      const snapshot = await getDocs(q)
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Address))
      setAddresses(fetched)
    } catch (error) {
      console.error("Error fetching addresses", error)
      toast.error("Failed to load addresses")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchAddresses()
    } else {
      setLoading(false)
    }
  }, [user])

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsSubmitting(true)
    
    try {
      const isDefault = addresses.length === 0
      const newAddress = { name, street, city, state, zip, country, isDefault }
      const docRef = await addDoc(collection(db, "users", user.uid, "addresses"), newAddress)
      setAddresses([...addresses, { id: docRef.id, ...newAddress }])
      toast.success("Address added successfully")
      setIsAddOpen(false)
      // Reset form
      setName(""); setStreet(""); setCity(""); setState(""); setZip(""); setCountry("")
    } catch (error) {
      toast.error("Failed to add address")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) return
    try {
      await deleteDoc(doc(db, "users", user.uid, "addresses", id))
      setAddresses(addresses.filter(a => a.id !== id))
      toast.success("Address removed")
    } catch (error) {
      toast.error("Failed to remove address")
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <div className="pt-10 lg:pt-16 pb-20">
          <div className="mx-auto max-w-3xl px-4 lg:px-8">
            <Link
              href="/account"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Saved Addresses</h1>
                <p className="text-muted-foreground mt-2">Manage your shipping and billing addresses.</p>
              </div>
              
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="shrink-0 transition-transform hover:scale-105">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Address
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Address</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddAddress} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Label (e.g. Home, Office)</Label>
                      <Input id="name" required value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="street">Street Address</Label>
                      <Input id="street" required value={street} onChange={e => setStreet(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <select 
                          id="country"
                          required
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                          value={country}
                          onChange={(e) => {
                            setCountry(e.target.value)
                            setState("")
                          }}
                        >
                          <option value="">Select a country</option>
                          {countriesList.map(c => (
                            <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State / Province</Label>
                        <select 
                          id="state"
                          required
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          disabled={!country || statesList.length === 0}
                        >
                          <option value="">{statesList.length === 0 && country ? "No states found" : "Select a state"}</option>
                          {statesList.map(s => (
                            <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" required value={city} onChange={e => setCity(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip">ZIP / Postal Code</Label>
                        <Input id="zip" required value={zip} onChange={e => setZip(e.target.value)} />
                      </div>
                    </div>
                    <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Save Address
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : addresses.length > 0 ? (
                addresses.map((address) => (
                  <div key={address.id} className={`bg-card border ${address.isDefault ? 'border-primary/50' : 'border-border'} rounded-xl p-6 relative overflow-hidden transition-all duration-200 hover:shadow-md`}>
                    {address.isDefault && (
                      <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-xl">
                        Default
                      </div>
                    )}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground mb-1">{address.name}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                          {address.street}, {address.city}, {address.state} {address.zip}, {address.country}
                        </p>
                        <div className="flex items-center gap-3 mt-4">
                          <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(address.id)}>
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-12 bg-secondary/30 rounded-xl border border-dashed border-border">
                  <MapPin className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-bold mb-2">No addresses saved</h3>
                  <p className="text-muted-foreground">Add your first address to speed up checkout.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
