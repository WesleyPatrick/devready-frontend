import { z } from 'zod'
import { authTexts } from './texts'

const v = authTexts.validation

export const emailSchema = z.string().trim().min(1, v.emailRequired).pipe(z.email(v.emailInvalid))
const encoder = new TextEncoder()

export const passwordSchema = z
  .string()
  .min(8, v.passwordShort)
  .refine((value) => encoder.encode(value).length <= 72, v.passwordLong)

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, v.passwordRequired),
})

export const registerSchema = z.object({
  displayName: z.string().trim().min(1, v.nameRequired).max(120, v.nameLong),
  email: emailSchema,
  password: passwordSchema,
})

const profileFields = z.object({
  displayName: z.string().trim().min(1, v.nameRequired).max(120, v.nameLong),
  avatarUrl: z
    .string()
    .trim()
    .max(2048, v.urlLong)
    .startsWith('https://', v.urlHttps)
    .optional()
    .or(z.literal('')),
  currentPassword: z.string().optional(),
  newPassword: z.union([z.literal(''), passwordSchema]).optional(),
})

export function profileSchema(hasPassword: boolean) {
  return profileFields.superRefine(
    (values, ctx) => {
      if (hasPassword && values.newPassword && !values.currentPassword) {
        ctx.addIssue({
          code: 'custom',
          path: ['currentPassword'],
          message: v.currentPasswordRequired,
        })
      }
    },
    { when: () => true },
  )
}

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, v.temporaryPasswordRequired),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.confirmPassword === values.newPassword, {
    path: ['confirmPassword'],
    message: v.confirmationMismatch,
    when: () => true,
  })

export type LoginForm = z.infer<typeof loginSchema>
export type RegisterForm = z.infer<typeof registerSchema>
export type ProfileForm = z.infer<typeof profileFields>
export type ChangePasswordForm = z.infer<typeof changePasswordSchema>
