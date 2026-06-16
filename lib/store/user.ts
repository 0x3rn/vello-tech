import { create } from 'zustand'

export interface UserData {
  uid: string
  email: string
  name: string
  phoneNumber?: string
  address?: string
  wishlist?: string[]
  role?: 'admin' | 'user'
  createdAt?: string
}

interface UserState {
  userData: UserData | null
  setUserData: (data: UserData | null) => void
  clearUserData: () => void
}

export const useUserStore = create<UserState>((set) => ({
  userData: null,
  setUserData: (data) => set({ userData: data }),
  clearUserData: () => set({ userData: null }),
}))
