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
const FeedPage = lazy(() => import('./routes/FeedPage').then((m) => ({ default: m.FeedPage })))
const TippspielPage = lazy(() => import('./routes/TippspielPage').then((m) => ({ default: m.TippspielPage })))
const AskHubPage = lazy(() => import('./routes/AskHubPage').then((m) => ({ default: m.AskHubPage })))
const SearchPage = lazy(() => import('./routes/SearchPage').then((m) => ({ default: m.SearchPage })))
const DiscoverPage = lazy(() => import('./routes/DiscoverPage').then((m) => ({ default: m.DiscoverPage })))
const TopicHubPage = lazy(() => import('./routes/TopicHubPage').then((m) => ({ default: m.TopicHubPage })))
const AboutPage = lazy(() => import('./routes/StaticPages').then((m) => ({ default: m.AboutPage })))
const PrivacyPage = lazy(() => import('./routes/StaticPages').then((m) => ({ default: m.PrivacyPage })))
const ImprintPage = lazy(() => import('./routes/StaticPages').then((m) => ({ default: m.ImprintPage })))
const NotFoundPage = lazy(() => import('./routes/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))
const ForYouPage = lazy(() => import('./routes/ForYouPage').then((m) => ({ default: m.ForYouPage })))
const CommunityPage = lazy(() => import('./routes/CommunityPage').then((m) => ({ default: m.CommunityPage })))
const GamificationPage = lazy(() => import('./routes/GamificationPage').then((m) => ({ default: m.GamificationPage })))
const MessagesPage = lazy(() => import('./routes/MessagesPage').then((m) => ({ default: m.MessagesPage })))
const UserProfilePage = lazy(() => import('./routes/UserProfilePage').then((m) => ({ default: m.UserProfilePage })))
const SecurityPage = lazy(() => import('./routes/SecurityPage').then((m) => ({ default: m.SecurityPage })))
const ModerationQueuePage = lazy(() => import('./routes/ModerationQueuePage').then((m) => ({ default: m.ModerationQueuePage })))
const DatabasePage = lazy(() => import('./routes/DatabasePage').then((m) => ({ default: m.DatabasePage })))
const SoundtrackPage = lazy(() => import('./routes/SoundtrackPage').then((m) => ({ default: m.SoundtrackPage })))
const NotificationsPage = lazy(() => import('./routes/NotificationsPage').then((m) => ({ default: m.NotificationsPage })))
const PricingPage = lazy(() => import('./routes/PricingPage').then((m) => ({ default: m.PricingPage })))
const PrivacyDashboardPage = lazy(() => import('./routes/PrivacyDashboardPage').then((m) => ({ default: m.PrivacyDashboardPage })))
const AccessibilityPage = lazy(() => import('./routes/AccessibilityPage').then((m) => ({ default: m.AccessibilityPage })))
const AnalyticsDashboardPage = lazy(() => import('./routes/AnalyticsDashboardPage').then((m) => ({ default: m.AnalyticsDashboardPage })))
const PresseKitPage = lazy(() => import('./routes/PresseKitPage').then((m) => ({ default: m.PresseKitPage })))
const EventsPage = lazy(() => import('./routes/EventsPage').then((m) => ({ default: m.EventsPage })))
const UGCPage = lazy(() => import('./routes/UGCPage').then((m) => ({ default: m.UGCPage })))
const ExperimentsPage = lazy(() => import('./routes/ExperimentsPage').then((m) => ({ default: m.ExperimentsPage })))

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
        <Route path="feed" element={<Suspense fallback={<SkeletonGrid count={2} />}><FeedPage /></Suspense>} />
        <Route path="tippspiel" element={<Suspense fallback={null}><TippspielPage /></Suspense>} />
        <Route path="frag" element={<Suspense fallback={null}><AskHubPage /></Suspense>} />
        <Route path="suche" element={<Suspense fallback={<SkeletonGrid count={3} />}><SearchPage /></Suspense>} />
        <Route path="entdecken" element={<Suspense fallback={<SkeletonGrid count={3} />}><DiscoverPage /></Suspense>} />
        <Route path="thema/:tag" element={<Suspense fallback={<SkeletonGrid count={3} />}><TopicHubPage /></Suspense>} />
        <Route path="fuer-dich" element={<Suspense fallback={<SkeletonGrid count={3} />}><ForYouPage /></Suspense>} />
        <Route path="community" element={<Suspense fallback={<SkeletonGrid count={3} />}><CommunityPage /></Suspense>} />
        <Route path="spielen" element={<Suspense fallback={<SkeletonGrid count={2} />}><GamificationPage /></Suspense>} />
        <Route path="nachrichten" element={<Suspense fallback={null}><MessagesPage /></Suspense>} />
        <Route path="profil" element={<Suspense fallback={<SkeletonGrid count={2} />}><UserProfilePage /></Suspense>} />
        <Route path="sicherheit" element={<Suspense fallback={<SkeletonGrid count={2} />}><SecurityPage /></Suspense>} />
        <Route path="moderation-queue" element={<Suspense fallback={<SkeletonGrid count={2} />}><ModerationQueuePage /></Suspense>} />
        <Route path="premium" element={<Suspense fallback={<SkeletonGrid count={2} />}><PricingPage /></Suspense>} />
        <Route path="datenschutz-dashboard" element={<Suspense fallback={null}><PrivacyDashboardPage /></Suspense>} />
        <Route path="barrierefreiheit" element={<Suspense fallback={null}><AccessibilityPage /></Suspense>} />
        <Route path="analytics" element={<Suspense fallback={<SkeletonGrid count={2} />}><AnalyticsDashboardPage /></Suspense>} />
        <Route path="presse" element={<Suspense fallback={null}><PresseKitPage /></Suspense>} />
        <Route path="datenbank" element={<Suspense fallback={<SkeletonGrid count={3} />}><DatabasePage /></Suspense>} />
        <Route path="soundtrack" element={<Suspense fallback={<SkeletonGrid count={3} />}><SoundtrackPage /></Suspense>} />
        <Route path="benachrichtigungen" element={<Suspense fallback={null}><NotificationsPage /></Suspense>} />
        <Route path="about" element={<Suspense fallback={null}><AboutPage /></Suspense>} />
        <Route path="datenschutz" element={<Suspense fallback={null}><PrivacyPage /></Suspense>} />
        <Route path="impressum" element={<Suspense fallback={null}><ImprintPage /></Suspense>} />
        <Route path="events" element={<Suspense fallback={<SkeletonGrid count={2} />}><EventsPage /></Suspense>} />
        <Route path="community-ugc" element={<Suspense fallback={<SkeletonGrid count={3} />}><UGCPage /></Suspense>} />
        <Route path="experimente" element={<Suspense fallback={<SkeletonGrid count={2} />}><ExperimentsPage /></Suspense>} />
        <Route path="*" element={<Suspense fallback={null}><NotFoundPage /></Suspense>} />
      </Route>
    </Routes>
  )
}
