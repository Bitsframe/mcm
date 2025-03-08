'use client'

import { CircularProgress } from "@mui/material";
import { Switch } from "antd";
import { useEffect, useState } from "react";
import { GoPencil } from "react-icons/go";
import { IoSearchOutline } from "react-icons/io5";
import AddEditUserModal from "./AddEditUserModal";
import axios from "axios";
import { CreateUserModalDataInterface } from "@/types/typesInterfaces";
import { toast } from "react-toastify";
import { fetch_content_service } from "@/utils/supabase/data_services/data_services";
import { TrashIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";


interface DataListInterface {
    id: number;
    name: string;
    role: string;
    email: string;
    locations: [string];
    created_at?: string;
    active?: any;
    password: string;

}


const tableHeader = [
    // { id: 'toggle', label: '', align: 'text-start', classNames: 'w-24' },
    { id: 'full_name', label: 'UM_k4', align: 'text-start', classNames: 'w-72' },
    { id: 'role', label: 'UM_k5', classNames: 'w-72' },
    { id: 'email', label: 'Email' },
    { id: 'locations', label: 'UM_k6', },
    // { id: 'password', label: 'Password' },
    { id: 'actions', label: '', classNames: 'w-28' },
];



const UserManagementComponent = () => {

    const [loading, setLoading] = useState(false)
    const [dataList, setDataList] = useState<any[]>([]);
    const [allData, setAllData] = useState<any[]>([])
    const [tableLoading, setTableLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editData, setEditData] = useState<any>(null)

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false)
        setEditData(null)
    };

    const onChangeHandle = (e: any) => {
        const val = e.target.value;
        if (val === '') {
            setDataList([...allData]);
        } else {
            const filteredData = allData.filter((elem) => elem.full_name.toLowerCase().includes(val.toLowerCase()))
            setDataList([...filteredData]);
        }
    };





    const fetchUsers = async () => {
        setTableLoading(true);
        const resData = await axios.get('/api/admin/users');
        console.log(resData)
        try {
            const fetchedData = await fetch_content_service({
                table: 'profiles',
                selectParam: `, roles(name), email, user_locations(location_id, Locations(title))`,
            });


            console.log(fetchedData)
            const users: any = fetchedData.map((user: any) => ({
                id: user.id,
                full_name: user.full_name,
                role_id: user.role_id,
                email: user.email,
                role: user.roles.name,
                created_at: new Date(user.created_at).toLocaleDateString(),
                active: user.active,
                locations: user.user_locations.map((elem: any) => ({ title: elem.Locations.title, location_id: elem.location_id }))
            }));
            setDataList(users);
            setAllData(users);
        } catch (error) {
            console.error(error);
            toast.error("Error fetching user data.");
        } finally {
            setTableLoading(false);
        }
    };


    const addNewHandle = async (data: CreateUserModalDataInterface) => {
        try {
            setLoading(true);
            await axios.post('/api/admin/users', data);
            setLoading(false);
            handleClose();
            fetchUsers()
            toast.success("User created successfully!");
        } catch (error: any) {
            setLoading(false);
            console.error("Error submitting data:", error);
            toast.error(`Error creating user: ${error?.response?.data?.message || error.message}`);
        }
    }

    const editHandle = async (data: CreateUserModalDataInterface) => {
        try {
            setLoading(true);
            await axios.post('/api/admin/users/actions/edit', data);
            setLoading(false);
            handleClose();
            fetchUsers()
            toast.success("User details has been updated!");
        } catch (error: any) {
            setLoading(false);
            console.error("Error submitting data:", error);
            toast.error(`Error creating user: ${error?.response?.data?.message || error.message}`);
        }
    }
    useEffect(() => {
        fetchUsers();
    }, []);

    const deleteUserHandle = async (id: string) => {

        try {
            await axios.post('/api/admin/users/actions/delete', { id });
            toast.success("User deleted successfully!");
            fetchUsers()
        } catch (error: any) {
            console.error("Error:", error);
            toast.error(`Error: ${error?.response?.data?.message || error.message}`);
        }
    }

    const editUserHandle = (elem: any) => {
        const { full_name, role_id, id, email } = elem
        const data = {
            id,
            email,
            roleId: role_id,
            locationIds: elem.locations.map(({ location_id }: any) => location_id),
            fullName: full_name,
            password: '',
        }
        setEditData(data)
        handleOpen()
    }

    const {t} = useTranslation(translationConstant.USERMANAGEMENT)

    return (
        <div className="mt-16 bg-gray-50 flex justify-center px-4 py-3">




            <div className='px-3 pt-1 pb-4 w-full bg-white'>

                <div className='space-y-6 px-3 pb-4 flex justify-between items-center'>
                    <h1 className="text-xl font-bold pt-5">{t("UM_k1")}</h1>

                    <div className="flex items-center space-x-3 ">
                        <div className='pl-1 pr-3 w-72 text-sm rounded-md bg-[#F5F7F9] flex items-center '>
                            <input onChange={onChangeHandle} className="bg-transparent flex-1 focus:outline-none placeholder:text-[#B5B5BE]" type="text" placeholder={t("UM_k3")} />
                            <IoSearchOutline size={24} color="#B5B5BE" />
                        </div>

                        <button onClick={handleOpen} className='bg-black text-sm text-white px-5 py-2 rounded-md hover:opacity-70 active:opacity-90'>
                        {t("UM_k2")}
                        </button>
                    </div>





                </div>

                <div className='pb-4 pt-3 flex text-base text-[#71717A] items-center flex-1 font-normal w-full px-3'>
                    {tableHeader.map(({ label, align, classNames }, index: number) => (
                        <h1 key={index} className={`${classNames ? classNames : 'flex-1'} ${align || 'text-start'}`}>
                            {t(label)}
                        </h1>
                    ))}
                </div>

                <div className={`mb-4 h-[71dvh] overflow-y-auto space-y-3`}>
                    {tableLoading ? (
                        <div className='h-full w-full flex items-center justify-center'>
                            <CircularProgress />
                        </div>
                    ) : (
                        dataList.map((elem: any, index: number) => {

                            return <div key={index} className={`hover:bg-[#f0efef]  flex items-center flex-1 text-base py-5 border-[1px] border-[#E4E4E7] rounded-lg px-3 `}>
                                {tableHeader.map(({ id, classNames, align }, ind) => {

                                    const content = elem[id];

                                    return (<div className={`${classNames ? classNames : 'flex-1'} ${align || 'text-start'}`} key={ind}>
                                        {id === 'toggle' ? <Switch /> : id === 'actions' ? <div className="flex items-center space-x-5 justify-end ">
                                            <button className="disabled:opacity-55 disabled:cursor-not-allowed" disabled={elem.role === 'super admin'} onClick={() => deleteUserHandle(elem.id)}>
                                                <TrashIcon size={24} color="red" />
                                            </button>
                                            <button onClick={() => editUserHandle(elem)}>
                                                <GoPencil size={25} />
                                            </button>

                                        </div> : <div key={ind}>
                                            {Array.isArray(content) ? (
                                                content.length > 1 ? (
                                                    <h1>Multiple Locations</h1>
                                                ) : content.length === 1 ? (
                                                    <h1>{content[0].title}</h1>
                                                ) : null
                                            ) : (
                                                <h1>{content}</h1>
                                            )}
                                        </div>}
                                    </div>);

                                })}
                            </div>
                        })
                    )}
                </div>
            </div>

            <AddEditUserModal
                key={editData ? 1 : 0}
                editData={editData}
                open={open}
                handleClose={handleClose}
                submitHandle={editData ? editHandle : addNewHandle}
                loading={loading}
            />

        </div >
    )
}


export default UserManagementComponent;