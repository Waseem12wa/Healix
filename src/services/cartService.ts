import type { Medicine } from './paymentService'

const CART_KEY = 'healix_cart_v1'

export type CartData = {
  [medicineId: string]: {
    medicine: Medicine
    quantity: number
  }
}

const readCartFromStorage = (): CartData => {
  try {
    const raw = localStorage.getItem(CART_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw)
    return typeof data === 'object' && data !== null ? data : {}
  } catch {
    return {}
  }
}

const writeCartToStorage = (cart: CartData) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
  } catch {
    // ignore
  }
}

export const getCart = (): CartData => readCartFromStorage()

export const setCart = (cart: CartData): void => writeCartToStorage(cart)

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
}

export const clearCart = (): void => {
  writeCartToStorage({})
}

export const getCartItemCount = (): number => {
  const cart = readCartFromStorage()
  return Object.values(cart).reduce((sum, item) => sum + item.quantity, 0)
}
