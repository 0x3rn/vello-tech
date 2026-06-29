"use client"

import { useState, useEffect } from "react"
import { Country, State } from "country-state-city"
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Loader2, Save, Globe, Map, Edit2, Trash2 } from "lucide-react"

export default function ShippingAdminPage() {
  const [countries, setCountries] = useState<any[]>([])
  const [states, setStates] = useState<any[]>([])
  
  const [selectedCountry, setSelectedCountry] = useState("")
  const [selectedState, setSelectedState] = useState("")
  const [amount, setAmount] = useState("")
  const [threshold, setThreshold] = useState("")
  
  const [loadingRate, setLoadingRate] = useState(false)
  const [savingRate, setSavingRate] = useState(false)
  const [savingThreshold, setSavingThreshold] = useState(false)
  const [loadingThreshold, setLoadingThreshold] = useState(true)

  const [allRates, setAllRates] = useState<any[]>([])
  const [loadingAllRates, setLoadingAllRates] = useState(true)

  const fetchAllRates = async () => {
    setLoadingAllRates(true)
    try {
      const snap = await getDocs(collection(db, "shippingRates"))
      const rates = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setAllRates(rates)
    } catch (error) {
      console.error("Error fetching all rates", error)
    } finally {
      setLoadingAllRates(false)
    }
  }

  useEffect(() => {
    setCountries(Country.getAllCountries())
    
    // Fetch global threshold
    const fetchThreshold = async () => {
      try {
        const docRef = doc(db, "settings", "shipping")
        const snap = await getDoc(docRef)
        if (snap.exists()) {
          const data = snap.data()
          if (data.threshold !== undefined) {
            setThreshold(data.threshold === null ? "" : String(data.threshold))
          }
        }
      } catch (error) {
        console.error("Error fetching threshold:", error)
      } finally {
        setLoadingThreshold(false)
      }
    }
    fetchThreshold()
    fetchAllRates()
  }, [])

  useEffect(() => {
    if (selectedCountry) {
      setStates(State.getStatesOfCountry(selectedCountry))
      setSelectedState("")
      setAmount("")
    } else {
      setStates([])
    }
  }, [selectedCountry])

  useEffect(() => {
    const fetchRate = async () => {
      if (!selectedCountry || !selectedState) return
      setLoadingRate(true)
      try {
        const docId = `${selectedCountry}_${selectedState}`
        const docRef = doc(db, "shippingRates", docId)
        const snap = await getDoc(docRef)
        
        if (snap.exists()) {
          const data = snap.data()
          setAmount(data.amount !== null && data.amount !== undefined ? String(data.amount) : "")
        } else {
          setAmount("")
        }
      } catch (error) {
        console.error("Error fetching shipping rate:", error)
        toast.error("Failed to load rate")
      } finally {
        setLoadingRate(false)
      }
    }
    
    fetchRate()
  }, [selectedCountry, selectedState])

  const handleSaveRate = async () => {
    if (!selectedCountry || !selectedState) {
      toast.error("Please select a country and state")
      return
    }

    setSavingRate(true)
    try {
      const docId = `${selectedCountry}_${selectedState}`
      const docRef = doc(db, "shippingRates", docId)
      
      const payload = {
        country: selectedCountry,
        state: selectedState,
        amount: amount === "" ? null : Number(amount)
      }
      
      await setDoc(docRef, payload, { merge: true })
      toast.success("Shipping rate saved")
      fetchAllRates()
    } catch (error) {
      console.error("Error saving rate:", error)
      toast.error("Failed to save rate")
    } finally {
      setSavingRate(false)
    }
  }

  const handleDeleteRate = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this rate?")) return
    try {
      await deleteDoc(doc(db, "shippingRates", id))
      toast.success("Shipping rate deleted")
      // If we just deleted the currently selected rate, clear the input
      if (id === `${selectedCountry}_${selectedState}`) {
        setAmount("")
      }
      fetchAllRates()
    } catch (error) {
      console.error("Error deleting rate", error)
      toast.error("Failed to delete rate")
    }
  }

  const handleEditRate = (rate: any) => {
    setSelectedCountry(rate.country)
    // Wait a tick for states list to update before selecting state
    setTimeout(() => {
      setSelectedState(rate.state)
    }, 100)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSaveThreshold = async () => {
    setSavingThreshold(true)
    try {
      const docRef = doc(db, "settings", "shipping")
      const payload = {
        threshold: threshold === "" ? null : Number(threshold)
      }
      await setDoc(docRef, payload, { merge: true })
      toast.success("Free shipping threshold saved")
    } catch (error) {
      console.error("Error saving threshold:", error)
      toast.error("Failed to save threshold")
    } finally {
      setSavingThreshold(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Shipping Settings</h1>
        <p className="text-muted-foreground">Manage regional shipping rates and global thresholds.</p>
      </div>

      <div className="grid gap-8">
        
        {/* Threshold Section */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Global Free Shipping Threshold</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Orders with a subtotal exceeding this amount will automatically receive free shipping. Leave blank to disable free shipping completely.
          </p>
          
          <div className="flex flex-col sm:flex-row items-end gap-4 max-w-md">
            <div className="flex-1 w-full">
              <label className="text-sm font-medium text-foreground mb-1.5 block">Threshold Amount ($)</label>
              <Input 
                type="number" 
                min="0"
                step="0.01"
                placeholder="e.g. 99.00" 
                value={threshold} 
                onChange={(e) => setThreshold(e.target.value)} 
                disabled={loadingThreshold}
              />
            </div>
            <Button onClick={handleSaveThreshold} disabled={savingThreshold || loadingThreshold}>
              {savingThreshold ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Threshold
            </Button>
          </div>
        </div>

        {/* Regional Rates Section */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Regional Shipping Rates</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Configure flat shipping rates per region. If a user checks out from a region with a blank input, they will be blocked from checking out entirely. Enter 0 for free shipping.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Country</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <select 
                  className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                >
                  <option value="">Select a country</option>
                  {countries.map(c => (
                    <option key={c.isoCode} value={c.isoCode}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">State / Province</label>
              <div className="relative">
                <Map className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <select 
                  className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  disabled={!selectedCountry || states.length === 0}
                >
                  <option value="">{states.length === 0 && selectedCountry ? "No states found" : "Select a state"}</option>
                  {states.map(s => (
                    <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex flex-col sm:flex-row items-end gap-4 max-w-md">
            <div className="flex-1 w-full">
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Shipping Fee ($) <span className="text-xs text-muted-foreground font-normal">(leave blank to block)</span>
              </label>
              <Input 
                type="number" 
                min="0"
                step="0.01"
                placeholder="Leave blank to block shipping" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                disabled={!selectedCountry || !selectedState || loadingRate}
              />
            </div>
            <Button 
              onClick={handleSaveRate} 
              disabled={!selectedCountry || !selectedState || savingRate || loadingRate}
            >
              {savingRate ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Rate
            </Button>
          </div>
          {loadingRate && (
            <p className="text-sm text-muted-foreground mt-2 animate-pulse">Loading rate...</p>
          )}
        </div>

        {/* Current Rates List */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
          <h2 className="text-xl font-semibold mb-4">Current Shipping Rates</h2>
          <p className="text-sm text-muted-foreground mb-6">
            All dynamically configured shipping rates currently active in your store.
          </p>
          
          {loadingAllRates ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : allRates.length === 0 ? (
            <div className="text-center p-8 bg-muted/30 rounded-lg border border-dashed border-border">
              <p className="text-muted-foreground">No custom shipping rates configured.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-tl-lg">Region</th>
                    <th className="px-4 py-3 font-medium">Rate</th>
                    <th className="px-4 py-3 font-medium text-right rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allRates.map(rate => {
                    const countryName = Country.getCountryByCode(rate.country)?.name || rate.country
                    const stateName = State.getStateByCodeAndCountry(rate.state, rate.country)?.name || rate.state
                    return (
                      <tr key={rate.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-4 font-medium">
                          {countryName} &rsaquo; {stateName}
                        </td>
                        <td className="px-4 py-4">
                          {rate.amount === null ? (
                            <span className="text-destructive font-medium text-xs bg-destructive/10 px-2 py-1 rounded-md">Blocked</span>
                          ) : rate.amount === 0 ? (
                            <span className="text-accent font-medium text-xs bg-accent/10 px-2 py-1 rounded-md">Free</span>
                          ) : (
                            `$${rate.amount.toFixed(2)}`
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditRate(rate)}>
                              <Edit2 className="h-3 w-3 mr-1.5" />
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDeleteRate(rate.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
