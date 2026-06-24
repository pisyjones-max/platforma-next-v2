export interface CartItem {
  sku: string
  title: string
  price: number
  img: string
  qty: number
}

export interface LoyaltyCard {
  number: string
  balance: number
}

export type DeliveryMethod = 'pvz' | 'courier'

export interface CheckoutForm {
  name: string
  phone: string
  email: string
  address: string
  pvzAddress: string
  comment: string
  callback: boolean
  deliveryMethod: DeliveryMethod
}

export interface Filters {
  minPrice: number
  maxPrice: number
  color: string
  brand: string
  sort: 'default' | 'price_asc' | 'price_desc' | 'name'
}
