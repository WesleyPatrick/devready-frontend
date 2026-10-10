import { Suspense } from 'react'
import type { RouteObject } from 'react-router'
import { PageSkeleton } from '@/components/Skeleton'
import { AppShell } from './layout/AppShell'
import { FocusedLayout } from './layout/FocusedLayout'
import { PublicLayout } from './layout/PublicLayout'
import { AdminUsersPage, SessionPage, SessionResultPage } from './lazyPages'
import { paths } from './paths'
import { appTexts } from './texts'
import { RequireAdmin } from './guards/RequireAdmin'
import { RequireAuth } from './guards/RequireAuth'
import { RequireCandidate } from './guards/RequireCandidate'
import { RequireCareerProfile } from './guards/RequireCareerProfile'
import { RequirePasswordChange } from './guards/RequirePasswordChange'
import { RedirectIfAuthenticated } from './guards/RedirectIfAuthenticated'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RouteErrorPage } from '@/pages/RouteErrorPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { AuthCallbackPage } from '@/features/auth/AuthCallbackPage'
import { ChangePasswordPage } from '@/features/auth/ChangePasswordPage'
import { ProfilePage } from '@/features/auth/ProfilePage'
import { OnboardingPage } from '@/features/career/OnboardingPage'
import { ChallengePage } from '@/features/challenge/ChallengePage'
import { NewSimulationPage } from '@/features/catalog/NewSimulationPage'
import { LandingPage } from '@/features/landing/LandingPage'
import { QuestionsPage } from '@/features/questions/QuestionsPage'
import { TrackPage } from '@/features/track/TrackPage'

export const routes: RouteObject[] = [
  {
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: paths.authCallback, element: <AuthCallbackPage /> },
          {
            element: <RedirectIfAuthenticated />,
            children: [
              { path: paths.landing, element: <LandingPage /> },
              { path: paths.login, element: <LoginPage /> },
              { path: paths.register, element: <RegisterPage /> },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <RequirePasswordChange />,
            children: [
              {
                element: <FocusedLayout />,
                children: [{ path: paths.changePassword, element: <ChangePasswordPage /> }],
              },
              {
                element: <RequireCandidate />,
                children: [
                  {
                    element: <FocusedLayout />,
                    children: [{ path: paths.onboarding, element: <OnboardingPage /> }],
                  },
                ],
              },
              {
                element: <RequireCareerProfile />,
                children: [
                  {
                    element: <AppShell />,
                    children: [
                      {
                        element: <RequireCandidate />,
                        children: [
                          { path: paths.track, element: <TrackPage /> },
                          { path: paths.questions, element: <QuestionsPage /> },
                          { path: paths.challenge, element: <ChallengePage /> },
                          { path: paths.newSimulation, element: <NewSimulationPage /> },
                          {
                            path: paths.session,
                            element: (
                              <Suspense fallback={<PageSkeleton label={appTexts.loading} />}>
                                <SessionPage />
                              </Suspense>
                            ),
                          },
                          {
                            path: paths.sessionResult,
                            element: (
                              <Suspense fallback={<PageSkeleton label={appTexts.loading} />}>
                                <SessionResultPage />
                              </Suspense>
                            ),
                          },
                        ],
                      },
                      { path: paths.profile, element: <ProfilePage /> },
                    ],
                  },
                ],
              },
              {
                element: <RequireAdmin />,
                children: [
                  {
                    element: <AppShell />,
                    children: [
                      {
                        path: paths.adminUsers,
                        element: (
                          <Suspense fallback={<PageSkeleton label={appTexts.loading} />}>
                            <AdminUsersPage />
                          </Suspense>
                        ),
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]
