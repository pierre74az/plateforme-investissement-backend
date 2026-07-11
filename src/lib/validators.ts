import { z } from 'zod'

// ─── Auth ────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email("Format d'email invalide"),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(
      /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Le mot de passe doit contenir majuscule, minuscule et chiffre'
    ),
  firstName: z.string().trim().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères'),
})

export const loginSchema = z.object({
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(1, 'Mot de passe requis'),
})

// ─── Offering ────────────────────────────────────────────────────────────────

export const createOfferingSchema = z.object({
  name: z.string().trim().min(2, 'Nom trop court'),
  sector: z.string().trim().min(2, 'Secteur requis'),
  pricePerShare: z.number().positive('Le prix par action doit être positif'),
  totalShares: z.number().int().positive('Le nombre total d\'actions doit être un entier positif'),
  minInvest: z.number().positive('Le montant minimum doit être positif'),
  description: z.string().trim().min(10, 'La description doit contenir au moins 10 caractères'),
  riskLevel: z.enum(['Faible', 'Moyen', 'Élevé'], {
    errorMap: () => ({ message: 'Niveau de risque invalide : Faible, Moyen ou Élevé' }),
  }),
})

export const updateOfferingSchema = createOfferingSchema.partial().extend({
  isOpen: z.boolean().optional(),
})

// ─── User ────────────────────────────────────────────────────────────────────

export const updateMyProfileSchema = z.object({
  firstName: z.string().trim().min(2, 'Le prénom doit contenir au moins 2 caractères').optional(),
  lastName: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères').optional(),
}).refine(data => data.firstName !== undefined || data.lastName !== undefined, {
  message: 'Au moins un champ (firstName ou lastName) est requis',
})

export const updateUserAdminSchema = z.object({
  firstName: z.string().trim().min(2).optional(),
  lastName: z.string().trim().min(2).optional(),
  kycStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  balance: z.number().nonnegative('Le solde ne peut pas être négatif').optional(),
})

// ─── Subscription ─────────────────────────────────────────────────────────────

export const createSubscriptionSchema = z.object({
  offeringId: z.string().min(1, 'offeringId requis'),
  shares: z.number().int().positive('Le nombre d\'actions doit être un entier positif'),
})
