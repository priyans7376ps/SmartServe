export const routes = {
  home: '/',
  login: '/login',
  signup: '/signup',
  guest: '/guest',
  menu: '/menu',
  cart: '/cart',
  checkout: '/checkout',
  payment: '/payment',
  orderTracking: '/order-tracking/:orderId',
  orderHistory: '/orders',
  coupons: '/coupons',
  profile: '/profile',
}

export const authRoutes = ['/login', '/signup', '/guest']
export const protectedRoutes = ['/checkout', '/payment', '/profile', '/orders']

