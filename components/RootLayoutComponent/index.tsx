'use client'
import { ReactNode, useContext } from 'react'
import { CircularProgress } from '@mui/material'
import { AuthContext } from '@/context'
import { SidebarSection } from '../Sidebar'
import { Navbar } from '../Navbar'

const LAYOUT_CONFIG = {
  sidebarWidth: '233px',
  contentPadding: '1rem',
  backgroundColor: 'rgb(249 250 251)'
} as const

interface RootLayoutProps {
  children: ReactNode
}

const LoadingState = () => (
  <div className="h-screen w-full grid place-items-center">
    <CircularProgress />
  </div>
)

const ErrorState = ({ message }: { message: string }) => (
  <div className="h-screen w-full grid place-items-center">
    <h1 className="text-red-600 text-xl">
      {message}
    </h1>
  </div>
)

const FixedSidebar = () => (
  <section
    className="fixed left-0 top-0 h-full"
    style={{ width: LAYOUT_CONFIG.sidebarWidth }}
  >
    <SidebarSection />
  </section>
)

const MainContent = ({ children }: { children: ReactNode }) => (
  <section
    className="flex flex-col flex-grow"
    style={{ marginLeft: LAYOUT_CONFIG.sidebarWidth }}
  >
    <Navbar width={LAYOUT_CONFIG.sidebarWidth} />
    <section
      className="flex-grow p-4"
      style={{
        minHeight: '100vh',
        overflowY: 'hidden',
        backgroundColor: LAYOUT_CONFIG.backgroundColor
      }}
    >
      {children}
    </section>
  </section>
)

const RootLayoutComponent = ({ children }: RootLayoutProps) => {
  const authState = useContext(AuthContext)
  if (authState?.checkingAuth) {
    return <LoadingState />
  }

  if (authState?.authError) {
    console.log(authState.authError)
    return <ErrorState message={"eRrore"} />
  }

  return (
    <div className="relative flex h-screen">
      <FixedSidebar />
      <MainContent>{children}</MainContent>
    </div>
  )
}

export default RootLayoutComponent