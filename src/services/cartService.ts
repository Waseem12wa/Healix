import type { Medicine } from './paymentService'
import { getMyCart, saveMyCart } from './patientService'

const CART_KEY_PREFIX = 'healix_cart_v2'
let hydratedUserId: string | null = null

export type CartData = {
  [medicineId: string]: {
    medicine: Medicine
    quantity: number
  }
}

const readCartFromStorage = (): CartData => {
  try {
    const raw = localStorage.getItem(getCartStorageKey())
    if (!raw) return {}
    const data = JSON.parse(raw)
    return typeof data === 'object' && data !== null ? data : {}
  } catch {
    return {}
  }
}

const getCurrentUserId = (): string => localStorage.getItem('userId') || 'guest'

const getCartStorageKey = (): string => `${CART_KEY_PREFIX}:${getCurrentUserId()}`

const writeCartToStorage = (cart: CartData) => {
  try {
    localStorage.setItem(getCartStorageKey(), JSON.stringify(cart))
  } catch {
    // ignore
  }
}

const persistCartBackground = (cart: CartData) => {
  if (!localStorage.getItem('token')) return
  saveMyCart(cart).catch(() => {
    // keep local cart if server sync fails
  })
}

export const getCart = (): CartData => readCartFromStorage()

export const setCart = (cart: CartData): void => {
  writeCartToStorage(cart)
  persistCartBackground(cart)
}

export const addToCart = (medicine: Medicine, quantity = 1): void => {
  const cart = readCartFromStorage()
  const key = medicine._id
  const existing = cart[key]
  if (existing) {
    existing.quantity += quantity
    cart[key] = existing
  } else {
    cart[key] = {
      medicine,
      quantity,
    }
  }
  writeCartToStorage(cart)
  persistCartBackground(cart)
}

export const removeFromCart = (medicineId: string, quantity = 1): void => {
  const cart = readCartFromStorage()
  const existing = cart[medicineId]
  if (!existing) return
  if (existing.quantity <= quantity) {
    delete cart[medicineId]
  } else {
    existing.quantity -= quantity
    cart[medicineId] = existing
  }
  writeCartToStorage(cart)
  persistCartBackground(cart)
}

export const clearCart = (): void => {
  writeCartToStorage({})
  persistCartBackground({})
}

export const getCartItemCount = (): number => {
  const cart = readCartFromStorage()
  return Object.values(cart).reduce((sum, item) => sum + item.quantity, 0)
}

export const syncCartFromServer = async (): Promise<CartData> => {
  const currentUserId = getCurrentUserId()
  if (!localStorage.getItem('token') || currentUserId === 'guest') {
    return readCartFromStorage()
  }

  if (hydratedUserId === currentUserId) {
    return readCartFromStorage()
  }

  try {
    const serverCart = await getMyCart()
    writeCartToStorage(serverCart)
    hydratedUserId = currentUserId
    return serverCart
  } catch {
    return readCartFromStorage()
  }
}
