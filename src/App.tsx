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
        <Route path="about" element={<Suspense fallback={null}><AboutPage /></Suspense>} />
        <Route path="datenschutz" element={<Suspense fallback={null}><PrivacyPage /></Suspense>} />
        <Route path="impressum" element={<Suspense fallback={null}><ImprintPage /></Suspense>} />
        <Route path="*" element={<Suspense fallback={null}><NotFoundPage /></Suspense>} />
      </Route>
    </Routes>
  )
}
