import React, { ReactNode } from 'react'
interface LayoutProps {
    children: ReactNode;
}

const layout: React.FC<LayoutProps> = ({
    children,
}) => {
    return (
        <div className="" >{children}</div>
    )
}


export default layout;
