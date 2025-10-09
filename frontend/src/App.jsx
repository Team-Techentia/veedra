import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'

// Dashboard Pages
import OwnerDashboard from './pages/dashboard/OwnerDashboard'
import ManagerDashboard from './pages/dashboard/ManagerDashboard'
import StaffDashboard from './pages/dashboard/StaffDashboard'

// Product Management
import ProductsPage from './pages/products/ProductsPage'
import ViewProductsPage from './pages/products/ViewProductsPage'
import ProductsPageEnhanced from './pages/products/ProductsPageEnhanced'
import ProductsPagePOS from './pages/products/ProductsPagePOS'
import ProductImportPage from './pages/products/ProductImportPage'
import AddProductPage from './pages/products/AddProductPage'
import EditProductPage from './pages/products/EditProductPage'
import CategoriesPage from './pages/products/CategoriesPage'
import VendorsPage from './pages/vendors/VendorsPage'
import AddVendorPage from './pages/vendors/AddVendorPage'

// Combo Management
import CombosPage from './pages/combos/NewCombosPage'
import CreateComboPage from './pages/combos/CreateComboPage'
import EditComboPage from './pages/combos/EditComboPage'

// Billing
import BillingPage from './pages/billing/BillingPage'
import POSBillingPage from './pages/billing/POSBillingPage'
import BillHistoryPage from './pages/billing/BillHistoryPage'

// Inventory
import InventoryPage from './pages/inventory/InventoryPage'
import StockAdjustmentPage from './pages/inventory/StockAdjustmentPage'

// Reports
import ReportsPage from './pages/reports/ReportsPage'

// Wallets
import WalletsPage from './pages/wallets/WalletsPage'

// Settings
import SettingsPage from './pages/settings/SettingsPage'
import UsersPage from './pages/users/UsersPage'

function App() {
  const { user, isAuthenticated } = useSelector((state) => state.auth)

  const getDashboardComponent = () => {
    if (!user) return <Navigate to="/login" replace />
    
    switch (user.role) {
      case 'owner':
        return <OwnerDashboard />
      case 'manager':
        return <ManagerDashboard />
      case 'staff':
        return <StaffDashboard />
      default:
        return <Navigate to="/login" replace />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
          } 
        />
        
        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={getDashboardComponent()} />
          
          {/* Product Management - Manager/Owner */}
          <Route path="products" element={
            <ProtectedRoute allowedRoles={['owner', 'manager']}>
              <ViewProductsPage />
            </ProtectedRoute>
          } />
          <Route path="products/classic" element={
            <ProtectedRoute allowedRoles={['owner', 'manager']}>
              <ProductsPageEnhanced />
            </ProtectedRoute>
          } />
          <Route path="products/pos" element={
            <ProtectedRoute allowedRoles={['owner', 'manager']}>
              <ProductsPagePOS />
            </ProtectedRoute>
          } />
          <Route path="products/import" element={
            <ProtectedRoute allowedRoles={['owner', 'manager']}>
              <ProductImportPage />
            </ProtectedRoute>
          } />
          <Route path="products/add" element={
            <ProtectedRoute allowedRoles={['owner', 'manager']}>
              <AddProductPage />
            </ProtectedRoute>
          } />
          <Route path="products/edit/:id" element={
            <ProtectedRoute allowedRoles={['owner', 'manager']}>
              <EditProductPage />
            </ProtectedRoute>
          } />
          <Route path="categories" element={
            <ProtectedRoute allowedRoles={['owner', 'manager']}>
              <CategoriesPage />
            </ProtectedRoute>
          } />
          <Route path="vendors" element={
            <ProtectedRoute allowedRoles={['owner', 'manager']}>
              <VendorsPage />
            </ProtectedRoute>
          } />
          <Route path="vendors/add" element={
            <ProtectedRoute allowedRoles={['owner', 'manager']}>
              <AddVendorPage />
            </ProtectedRoute>
          } />
          <Route path="vendors/edit/:id" element={
            <ProtectedRoute allowedRoles={['owner', 'manager']}>
              <AddVendorPage />
            </ProtectedRoute>
          } />
          
          {/* Combo Management - Manager/Owner */}
          <Route path="combos" element={
            <ProtectedRoute allowedRoles={['owner', 'manager']}>
              <CombosPage />
            </ProtectedRoute>
          } />
          <Route path="combos/create" element={
            <ProtectedRoute allowedRoles={['owner', 'manager']}>
              <CreateComboPage />
            </ProtectedRoute>
          } />
          <Route path="combos/:id/edit" element={
            <ProtectedRoute allowedRoles={['owner', 'manager']}>
              <EditComboPage />
            </ProtectedRoute>
          } />
          
          {/* Billing - All Roles */}
          <Route path="billing" element={
            <ProtectedRoute allowedRoles={['owner', 'manager', 'staff']}>
              <POSBillingPage />
            </ProtectedRoute>
          } />
          <Route path="billing/classic" element={
            <ProtectedRoute allowedRoles={['owner', 'manager', 'staff']}>
              <BillingPage />
            </ProtectedRoute>
          } />
          <Route path="billing/history" element={
            <ProtectedRoute allowedRoles={['owner', 'manager', 'staff']}>
              <BillHistoryPage />
            </ProtectedRoute>
          } />
          
          {/* Inventory - Manager/Owner */}
          <Route path="inventory" element={
            <ProtectedRoute allowedRoles={['owner', 'manager']}>
              <InventoryPage />
            </ProtectedRoute>
          } />
          <Route path="inventory/adjust" element={
            <ProtectedRoute allowedRoles={['owner', 'manager']}>
              <StockAdjustmentPage />
            </ProtectedRoute>
          } />
          
          {/* Reports - Role-based access */}
          <Route path="reports" element={
            <ProtectedRoute allowedRoles={['owner', 'manager', 'staff']}>
              <ReportsPage />
            </ProtectedRoute>
          } />
          
          {/* Wallets - All Roles (filtered by backend) */}
          <Route path="wallets" element={
            <ProtectedRoute allowedRoles={['owner', 'manager', 'staff']}>
              <WalletsPage />
            </ProtectedRoute>
          } />
          
          {/* User Management - Owner Only */}
          <Route path="users" element={
            <ProtectedRoute allowedRoles={['owner']}>
              <UsersPage />
            </ProtectedRoute>
          } />
          
          {/* Settings - All Roles */}
          <Route path="settings" element={
            <ProtectedRoute allowedRoles={['owner', 'manager', 'staff']}>
              <SettingsPage />
            </ProtectedRoute>
          } />
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  )
}

export default App