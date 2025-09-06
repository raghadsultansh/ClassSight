"use client"

import { DashboardLayout } from '@/components/dashboard-layout'

export default function AuthedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: Get user role from auth context/session
  const userRole = 'admin' // Replace with actual auth logic

  return (
    <DashboardLayout userRole={userRole}>
      {children}
    </DashboardLayout>
  )
}