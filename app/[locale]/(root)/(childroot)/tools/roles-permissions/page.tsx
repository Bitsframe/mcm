'use client'

import RolesAndPermissionsComponent from "@/components/RolesAndPermissionsComponents";
import { ConfigProvider } from "antd";


const UserManagement = () => {


    return (
        <div className="min-h-full bg-gray-50">

            <div className="pt-20 px-12">
            <RolesAndPermissionsComponent />
            </div>
        </div>
    )
}


export default UserManagement;