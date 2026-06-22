import Stripe from 'stripe'
import { STRIPE_SECRET_KEY } from '../config'

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2026-05-27.dahlia',
})
