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

export default function TaxesAdminPage() {
  const [countries, setCountries] = useState<any[]>([])
  const [states, setStates] = useState<any[]>([])
  
  const [selectedCountry, setSelectedCountry] = useState("")
  const [selectedState, setSelectedState] = useState("")
  const [percentage, setPercentage] = useState("")
  const [amount, setAmount] = useState("")
  
  const [loadingRate, setLoadingRate] = useState(false)
  const [savingRate, setSavingRate] = useState(false)

  const [allRates, setAllRates] = useState<any[]>([])
  const [loadingAllRates, setLoadingAllRates] = useState(true)

  const fetchAllRates = async () => {
    setLoadingAllRates(true)
    try {
      const snap = await getDocs(collection(db, "taxRates"))
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
    fetchAllRates()
  }, [])

  useEffect(() => {
    if (selectedCountry) {
      setStates(State.getStatesOfCountry(selectedCountry))
      setSelectedState("")
      setPercentage("")
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
        const docRef = doc(db, "taxRates", docId)
        const snap = await getDoc(docRef)
        
        if (snap.exists()) {
          const data = snap.data()
          setPercentage(data.percentage !== null && data.percentage !== undefined ? String(data.percentage) : "")
          setAmount(data.amount !== null && data.amount !== undefined ? String(data.amount) : "")
        } else {
          setPercentage("")
          setAmount("")
        }
      } catch (error) {
        console.error("Error fetching tax rate:", error)
        toast.error("Failed to load tax rate")
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
      const docRef = doc(db, "taxRates", docId)
      
      const payload = {
        country: selectedCountry,
        state: selectedState,
        percentage: percentage === "" ? null : Number(percentage),
        amount: amount === "" ? null : Number(amount)
      }
      
      await setDoc(docRef, payload, { merge: true })
      toast.success("Tax rate saved")
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
      await deleteDoc(doc(db, "taxRates", id))
      toast.success("Tax rate deleted")
      if (id === `${selectedCountry}_${selectedState}`) {
        setPercentage("")
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
    setTimeout(() => {
      setSelectedState(rate.state)
    }, 100)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Tax Settings</h1>
        <p className="text-muted-foreground">Manage regional tax percentages.</p>
      </div>

      <div className="grid gap-8">
        
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Regional Tax Rates</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Configure tax percentage rates per region. Leave blank to block checkout from this region. Enter 0 for no tax.
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

          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Tax Percentage (%) <span className="text-xs text-muted-foreground font-normal">(leave blank to block)</span>
              </label>
              <Input 
                type="number" 
                min="0"
                step="0.1"
                placeholder="e.g. 5.5" 
                value={percentage} 
                onChange={(e) => setPercentage(e.target.value)} 
                disabled={!selectedCountry || !selectedState || loadingRate}
              />
            </div>
            
            <div className="flex-1 w-full">
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Flat Rate Tax ($) <span className="text-xs text-muted-foreground font-normal">(leave blank to block)</span>
              </label>
              <Input 
                type="number" 
                min="0"
                step="0.01"
                placeholder="e.g. 10.00" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                disabled={!selectedCountry || !selectedState || loadingRate}
              />
            </div>

            <Button 
              onClick={handleSaveRate} 
              disabled={!selectedCountry || !selectedState || savingRate || loadingRate}
              className="shrink-0"
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
          <h2 className="text-xl font-semibold mb-4">Current Tax Rates</h2>
          <p className="text-sm text-muted-foreground mb-6">
            All dynamically configured tax rates currently active in your store.
          </p>
          
          {loadingAllRates ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : allRates.length === 0 ? (
            <div className="text-center p-8 bg-muted/30 rounded-lg border border-dashed border-border">
              <p className="text-muted-foreground">No custom tax rates configured.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-tl-lg">Region</th>
                    <th className="px-4 py-3 font-medium">Percentage (%)</th>
                    <th className="px-4 py-3 font-medium">Flat Rate ($)</th>
                    <th className="px-4 py-3 font-medium text-right rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {allRates.map(rate => {
                    const countryName = Country.getCountryByCode(rate.country)?.name || rate.country
                    const stateName = State.getStateByCodeAndCountry(rate.state, rate.country)?.name || rate.state
                    
                    const isBlocked = rate.percentage === null && rate.amount === null
                    
                    return (
                      <tr key={rate.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-4 font-medium">
                          {countryName} &rsaquo; {stateName}
                        </td>
                        <td className="px-4 py-4">
                          {isBlocked ? (
                            <span className="text-destructive font-medium text-xs bg-destructive/10 px-2 py-1 rounded-md">Blocked</span>
                          ) : rate.percentage === null ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            `${rate.percentage}%`
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {isBlocked ? (
                            <span className="text-destructive font-medium text-xs bg-destructive/10 px-2 py-1 rounded-md">Blocked</span>
                          ) : rate.amount === null ? (
                            <span className="text-muted-foreground">-</span>
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
