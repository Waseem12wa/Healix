import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './ui/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import GuidePage from './pages/GuidePage'
import PatientGuidePage from './pages/PatientGuidePage'
import PatientGuideFeaturePage from './pages/PatientGuideFeaturePage'
import DoctorGuidePage from './pages/DoctorGuidePage'
import DoctorGuideFeaturePage from './pages/DoctorGuideFeaturePage'
import ProviderGuidePage from './pages/ProviderGuidePage'
import ProviderGuideFeaturePage from './pages/ProviderGuideFeaturePage'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import PatientProfile from './pages/profile/PatientProfile'
import AdminProfile from './pages/profile/AdminProfile'
import ProviderProfile from './pages/profile/ProviderProfile'
import Dashboard from './pages/Dashboard'
import DrugInteractionChecker from './pages/DrugInteractionChecker'
import DrugFoodInteractionChecker from './pages/DrugFoodInteractionChecker'
import DrugAlternatives from './pages/DrugAlternatives'
import SideEffectPredictor from './pages/SideEffectPredictor'
import MedicationReminder from './pages/MedicationReminder'
import AIChatbot from './pages/AIChatbot'
import HealthRecordSummarization from './pages/HealthRecordSummarization'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import AdminPanel from './pages/AdminPanel'
import AdminAnalyticsPage from './pages/AdminAnalyticsPage'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminAppointmentsPage from './pages/AdminAppointmentsPage'
import AdminPaymentsPage from './pages/AdminPaymentsPage'
import AdminSystemSettingsPage from './pages/AdminSystemSettingsPage'
import AdminMedicinesPage from './pages/AdminMedicinesPage'
import DoctorDashboard from './pages/DoctorDashboard'
import DoctorMedicineManagerPage from './pages/DoctorMedicineManagerPage'
import ProviderDashboard from './pages/ProviderDashboard'
import ProviderOverviewPage from './pages/provider/ProviderOverviewPage'
import ProviderMedicinesPage from './pages/provider/ProviderMedicinesPage'
import ProviderOrdersPage from './pages/provider/ProviderOrdersPage'
import ProviderPaymentsPage from './pages/provider/ProviderPaymentsPage'
import Appointments from './pages/Appointments'
import DoctorProfile from './pages/DoctorProfile'
import DoctorHistory from './pages/DoctorHistory'
import AssignedPatients from './pages/AssignedPatients'
import DoctorAppointments from './pages/DoctorAppointments'
import DoctorFeatureReviews from './pages/DoctorFeatureReviews'
import MedicineShop from './pages/MedicineShop'
import OrderHistory from './pages/OrderHistory'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import PaymentCheckoutPage from './pages/PaymentCheckoutPage'
import SettingsPage from './pages/SettingsPage'

// Helper to wrap protected routes
const protect = (element: React.ReactElement) => (
  <ProtectedRoute>{element}</ProtectedRoute>
)

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      // Public routes (no protection needed)
      { index: true, element: <LandingPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'guide', element: <GuidePage /> },
      { path: 'guide/patient', element: <PatientGuidePage /> },
      { path: 'guide/pateint', element: <PatientGuidePage /> },
      { path: 'guide/patient/:featureSlug', element: <PatientGuideFeaturePage /> },
      { path: 'guide/doctor', element: <DoctorGuidePage /> },
      { path: 'guide/doctor/:featureSlug', element: <DoctorGuideFeaturePage /> },
      { path: 'guide/provider', element: <ProviderGuidePage /> },
      { path: 'guide/provider/:featureSlug', element: <ProviderGuideFeaturePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      
      // Protected routes - Patient
      { path: 'dashboard', element: protect(<Dashboard />) },
      { path: 'tools/medication-reminder', element: protect(<MedicationReminder />) },
      { path: 'tools/ai-chatbot', element: protect(<AIChatbot />) },
      { path: 'tools/health-summary', element: protect(<HealthRecordSummarization />) },
      { path: 'profile/patient', element: protect(<PatientProfile />) },
      
      // Protected routes - Doctor
      { path: 'doctor-dashboard', element: protect(<DoctorDashboard />) },
      { path: 'doctor-profile', element: protect(<DoctorProfile />) },
      { path: 'doctor-history', element: protect(<DoctorHistory />) },
      { path: 'doctor-assigned-patients', element: protect(<AssignedPatients />) },
        { path: 'doctor-appointments', element: protect(<DoctorAppointments />) },
      { path: 'doctor-reviews/ddi', element: protect(<DoctorFeatureReviews feature="ddi" />) },
      { path: 'doctor-reviews/dfi', element: protect(<DoctorFeatureReviews feature="dfi" />) },
      { path: 'doctor-reviews/alternatives', element: protect(<DoctorFeatureReviews feature="alternatives" />) },
      { path: 'doctor-reviews/side-effects', element: protect(<DoctorFeatureReviews feature="side-effects" />) },
      { path: 'doctor-reviews/ai-assistant', element: protect(<DoctorFeatureReviews feature="ai-assistant" />) },
      { path: 'doctor-reviews/medication-pharmacy', element: protect(<DoctorFeatureReviews feature="medication-pharmacy" />) },
      { path: 'doctor-reviews/health-summary', element: protect(<DoctorFeatureReviews feature="health-summary" />) },
      { path: 'doctor-medicines', element: protect(<DoctorMedicineManagerPage />) },
      
      // Protected routes - Admin
      { path: 'admin', element: protect(<AdminPanel />) },
      { path: 'admin/analytics', element: protect(<AdminAnalyticsPage />) },
      { path: 'admin/users', element: protect(<AdminUsersPage />) },
      { path: 'admin/appointments', element: protect(<AdminAppointmentsPage />) },
      { path: 'admin/payments', element: protect(<AdminPaymentsPage />) },
      { path: 'admin/medicines', element: protect(<AdminMedicinesPage />) },
      { path: 'admin/settings', element: protect(<AdminSystemSettingsPage />) },
      { path: 'profile/admin', element: protect(<AdminProfile />) },
      
      // Protected routes - Provider
      { path: 'provider-dashboard', element: protect(<ProviderDashboard />) },
      { path: 'provider/overview', element: protect(<ProviderOverviewPage />) },
      { path: 'provider/medicines', element: protect(<ProviderMedicinesPage />) },
      { path: 'provider/orders', element: protect(<ProviderOrdersPage />) },
      { path: 'provider/payments', element: protect(<ProviderPaymentsPage />) },
      { path: 'profile/provider', element: protect(<ProviderProfile />) },
      
      // Protected routes - Shared (multiple roles)
      { path: 'tools/drug-interactions', element: protect(<DrugInteractionChecker />) },
      { path: 'tools/drug-food-interactions', element: protect(<DrugFoodInteractionChecker />) },
      { path: 'tools/drug-alternatives', element: protect(<DrugAlternatives />) },
      { path: 'tools/side-effects', element: protect(<SideEffectPredictor />) },
      { path: 'tools/appointments', element: protect(<Appointments />) },
      { path: 'tools/notifications', element: protect(<Notifications />) },
      { path: 'tools/profile', element: protect(<Profile />) },
      { path: 'settings', element: protect(<SettingsPage />) },
      
      // Protected routes - Payment & Shopping
      { path: 'shop/medicines', element: protect(<MedicineShop />) },
      { path: 'shop/checkout', element: protect(<PaymentCheckoutPage />) },
      { path: 'shop/orders', element: protect(<OrderHistory />) },
      { path: 'shop/orders/:orderId/confirmation', element: protect(<OrderConfirmationPage />) },
    ],
  },
])



