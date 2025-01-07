'use client'
import { AuthContext } from '@/context';
import { CircularProgress } from '@mui/material';
import React, { useContext } from 'react'
import { SidebarSection } from '../Sidebar';
import { Navbar } from '../Navbar';


const sidebarWidth = "233px";
const RootLayoutComponent = ({
	children,
}: {
	children: React.ReactNode;
}) => {

    const { checkingAuth, initialAuthCheckError } = useContext(AuthContext);
    return (
        checkingAuth ? <div className='h-screen w-full grid place-items-center'>
            <CircularProgress />
        </div> : initialAuthCheckError ? <div className='h-screen w-full grid place-items-center'>
            <h1 className='text-red-600 text-xl'>
            {initialAuthCheckError}
            </h1>
        </div>  : <div className={`relative flex h-screen`}>
            <section
                className="fixed left-0 top-0 h-full"
                style={{ width: sidebarWidth }}
            >
                <SidebarSection />
            </section>
            <section
                className="flex flex-col flex-grow"
                style={{ marginLeft: sidebarWidth }}
            >
                <Navbar width={sidebarWidth} />

                <section
                    className="flex-grow p-4 bg-gray-50"
                    // style={{ minHeight: "calc(100vh - 70px)" }}
                    style={{
                        minHeight: "100vh",
                        overflowY:'hidden'
                        // backgroundColor: ,
                    }}
                >
                    {children}
                </section>
            </section>
        </div>
    )
}

export default RootLayoutComponent
