import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from './routes/Layout'
import { HomePage } from './routes/HomePage'
import { SkeletonGrid } from './components/Skeleton'

// Code-Splitting: Unterseiten werden erst bei Bedarf geladen.
const ArticlePage = lazy(() => import('./routes/ArticlePage').then((m) => ({ default: m.ArticlePage })))
const CategoryPage = lazy(() => import('./routes/CategoryPage').then((m) => ({ default: m.CategoryPage })))
const BookmarksPage = lazy(() => import('./routes/BookmarksPage').then((m) => ({ default: m.BookmarksPage })))
const SettingsPage = lazy(() => import('./routes/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const AdminPage = lazy(() => import('./routes/AdminPage').then((m) => ({ default: m.AdminPage })))
const AuthPage = lazy(() => import('./routes/AuthPage').then((m) => ({ default: m.AuthPage })))
const ModerationPage = lazy(() => import('./routes/ModerationPage').then((m) => ({ default: m.ModerationPage })))
const ProfilePage = lazy(() => import('./routes/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const LeaderboardPage = lazy(() => import('./routes/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage })))
const SubmitPage = lazy(() => import('./routes/SubmitPage').then((m) => ({ default: m.SubmitPage })))
const TimelinePage = lazy(() => import('./routes/TimelinePage').then((m) => ({ default: m.TimelinePage })))
const MapPage = lazy(() => import('./routes/MapPage').then((m) => ({ default: m.MapPage })))
const GalleryPage = lazy(() => import('./routes/GalleryPage').then((m) => ({ default: m.GalleryPage })))
const LorePage = lazy(() => import('./routes/LorePage').then((m) => ({ default: m.LorePage })))
const LoreDetailPage = lazy(() => import('./routes/LorePage').then((m) => ({ default: m.LoreDetailPage })))
const StatusPage = lazy(() => import('./routes/StatusPage').then((m) => ({ default: m.StatusPage })))
const ApiDocsPage = lazy(() => import('./routes/ApiDocsPage').then((m) => ({ default: m.ApiDocsPage })))
const DashboardPage = lazy(() => import('./routes/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const AboutPage = lazy(() => import('./routes/StaticPages').then((m) => ({ default: m.AboutPage })))
const PrivacyPage = lazy(() => import('./routes/StaticPages').then((m) => ({ default: m.PrivacyPage })))
const ImprintPage = lazy(() => import('./routes/StaticPages').then((m) => ({ default: m.ImprintPage })))
const NotFoundPage = lazy(() => import('./routes/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route
          path="news/:id"
          element={
            <Suspense fallback={<SkeletonGrid count={3} />}>
              <ArticlePage />
            </Suspense>
          }
        />
        <Route
          path="kategorie/:slug"
          element={
            <Suspense fallback={<SkeletonGrid />}>
              <CategoryPage />
            </Suspense>
          }
        />
        <Route
          path="bookmarks"
          element={
            <Suspense fallback={<SkeletonGrid />}>
              <BookmarksPage />
            </Suspense>
          }
        />
        <Route
          path="settings"
          element={
            <Suspense fallback={<SkeletonGrid count={2} />}>
              <SettingsPage />
            </Suspense>
          }
        />
        <Route
          path="admin"
          element={
            <Suspense fallback={<SkeletonGrid count={2} />}>
              <AdminPage />
            </Suspense>
          }
        />
        <Route path="login" element={<Suspense fallback={null}><AuthPage /></Suspense>} />
        <Route path="moderation" element={<Suspense fallback={<SkeletonGrid count={2} />}><ModerationPage /></Suspense>} />
        <Route path="u/:id" element={<Suspense fallback={<SkeletonGrid count={2} />}><ProfilePage /></Suspense>} />
        <Route path="rangliste" element={<Suspense fallback={null}><LeaderboardPage /></Suspense>} />
        <Route path="einreichen" element={<Suspense fallback={null}><SubmitPage /></Suspense>} />
        <Route path="timeline" element={<Suspense fallback={<SkeletonGrid count={2} />}><TimelinePage /></Suspense>} />
        <Route path="karte" element={<Suspense fallback={<SkeletonGrid count={2} />}><MapPage /></Suspense>} />
        <Route path="galerie" element={<Suspense fallback={<SkeletonGrid />}><GalleryPage /></Suspense>} />
        <Route path="lore" element={<Suspense fallback={<SkeletonGrid />}><LorePage /></Suspense>} />
        <Route path="lore/:id" element={<Suspense fallback={<SkeletonGrid count={2} />}><LoreDetailPage /></Suspense>} />
        <Route path="status" element={<Suspense fallback={null}><StatusPage /></Suspense>} />
        <Route path="api-docs" element={<Suspense fallback={null}><ApiDocsPage /></Suspense>} />
        <Route path="dashboard" element={<Suspense fallback={<SkeletonGrid count={2} />}><DashboardPage /></Suspense>} />
        <Route path="about" element={<Suspense fallback={null}><AboutPage /></Suspense>} />
        <Route path="datenschutz" element={<Suspense fallback={null}><PrivacyPage /></Suspense>} />
        <Route path="impressum" element={<Suspense fallback={null}><ImprintPage /></Suspense>} />
        <Route path="*" element={<Suspense fallback={null}><NotFoundPage /></Suspense>} />
      </Route>
    </Routes>
  )
}
