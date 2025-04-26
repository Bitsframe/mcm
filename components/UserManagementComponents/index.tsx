"use client";

import { CircularProgress } from "@mui/material";
import { Switch } from "antd";
import { useContext, useEffect, useState } from "react";
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
import { TabContext } from "@/context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";

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
  { id: "full_name", label: "UM_k4", align: "text-start", classNames: "w-72" },
  { id: "role", label: "UM_k5", classNames: "w-72" },
  { id: "email", label: "Email" },
  { id: "locations", label: "UM_k6" },
  { id: "actions", label: "", classNames: "w-28" },
];

const UserManagementComponent = () => {
  const [loading, setLoading] = useState(false);
  const [dataList, setDataList] = useState<any[]>([]);
  const [allData, setAllData] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);

  // Check for saved dark mode preference or system preference
  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode !== null) {
      setDarkMode(savedMode === "true");
    } else {
      setDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setEditData(null);
  };

  const viewUserHandle = (user: any) => {
    setSelectedUser(user);
    setSheetOpen(true);
  };

  const onChangeHandle = (e: any) => {
    const val = e.target.value;
    if (val === "") {
      setDataList([...allData]);
    } else {
      const filteredData = allData.filter((elem) =>
        elem.full_name.toLowerCase().includes(val.toLowerCase())
      );
      setDataList([...filteredData]);
    }
  };

  const fetchUsers = async () => {
    setTableLoading(true);
    const resData = await axios.get("/api/admin/users");
    console.log(resData);
    try {
      const fetchedData = await fetch_content_service({
        table: "profiles",
        selectParam: `, roles(name), email, user_locations(location_id, Locations(title))`,
      });

      console.log(fetchedData);
      const users: any = fetchedData.map((user: any) => ({
        id: user.id,
        full_name: user.full_name,
        role_id: user.role_id,
        email: user.email,
        role: user.roles.name,
        created_at: new Date(user.created_at).toLocaleDateString(),
        active: user.active,
        locations: user.user_locations.map((elem: any) => ({
          title: elem.Locations.title,
          location_id: elem.location_id,
        })),
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
      await axios.post("/api/admin/users", data);
      setLoading(false);
      handleClose();
      fetchUsers();
      toast.success("User created successfully!");
    } catch (error: any) {
      setLoading(false);
      console.error("Error submitting data:", error);
      toast.error(
        `Error creating user: ${
          error?.response?.data?.message || error.message
        }`
      );
    }
  };

  const editHandle = async (data: CreateUserModalDataInterface) => {
    try {
      setLoading(true);
      await axios.post("/api/admin/users/actions/edit", data);
      setLoading(false);
      handleClose();
      fetchUsers();
      toast.success("User details has been updated!");
    } catch (error: any) {
      setLoading(false);
      console.error("Error submitting data:", error);
      toast.error(
        `Error creating user: ${
          error?.response?.data?.message || error.message
        }`
      );
    }
  };
  useEffect(() => {
    fetchUsers();
  }, []);

  const deleteUserHandle = async (id: string) => {
    try {
      await axios.post("/api/admin/users/actions/delete", { id });
      toast.success("User deleted successfully!");
      fetchUsers();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(`Error: ${error?.response?.data?.message || error.message}`);
    }
  };

  const editUserHandle = (elem: any) => {
    const { full_name, role_id, id, email } = elem;
    const data = {
      id,
      email,
      roleId: role_id,
      locationIds: elem.locations.map(({ location_id }: any) => location_id),
      fullName: full_name,
      password: "",
    };
    setEditData(data);
    handleOpen();
  };

  const { setActiveTitle } = useContext(TabContext);

  useEffect(() => {
    setActiveTitle("Sidebar_k18");
  }, []);

  const { t } = useTranslation(translationConstant.USERMANAGEMENT);

  return (
    <div className="flex justify-center px-4 py-3 dark:bg-gray-900">
      <div className="w-full bg-white dark:bg-gray-800">
        {/* Header with search and add button */}
        <div className="p-6 flex justify-between items-center">
          <div className="relative w-60">
            <input
              onChange={onChangeHandle}
              className="w-full pl-8 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              type="text"
              placeholder={t("Search users by name")}
            />
            <IoSearchOutline
              className="absolute left-2 top-2.5 dark:text-gray-300"
              size={18}
              color={darkMode ? "#9CA3AF" : "#71717A"}
            />
          </div>

          <button
            onClick={handleOpen}
            className="bg-blue-600 text-sm text-white px-4 py-2 rounded-md hover:bg-blue-700 active:bg-blue-800 dark:hover:bg-blue-700 dark:active:bg-blue-900 flex items-center gap-2"
          >
            <span className="text-lg">+</span> {t("Add New User")}
          </button>
        </div>

        {/* Table */}
        <div className="px-6">
          <div
            className="border rounded-md overflow-auto dark:border-gray-700"
            style={{ maxHeight: "400px" }}
          >
            <Table>
              <TableHeader>
                <TableRow className="border-b text-sm text-[#71717A] dark:text-gray-300 dark:border-gray-700">
                  <TableHead className="w-10">
                    {/* <input
                      type="checkbox"
                      className="rounded dark:bg-gray-700 dark:border-gray-600"
                    /> */}
                  </TableHead>
                  {tableHeader.map(({ label, align, classNames }, index) => (
                    <TableHead
                      key={index}
                      className={`font-medium ${align || "text-left"} ${
                        classNames || ""
                      } dark:text-white`}
                    >
                      {t(label)}
                      {index < tableHeader.length - 1 && (
                        <span className="ml-1">↕</span>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y dark:divide-gray-700">
                {tableLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={tableHeader.length + 1}
                      className="py-20 dark:bg-gray-800"
                    >
                      <div className="flex justify-center">
                        <CircularProgress />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  dataList.map((elem, index) => (
                    <TableRow
                      key={index}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700"
                    >
                      <TableCell className="py-4 pr-3 dark:bg-gray-800">
                        {/* <input
                          type="checkbox"
                          className="rounded dark:bg-gray-700 dark:border-gray-600"
                        /> */}
                      </TableCell>
                      {tableHeader.map(({ id, classNames, align }, ind) => {
                        const content = elem[id];
                        return (
                          <TableCell
                            key={ind}
                            className={`py-4 ${align || "text-left"} ${
                              classNames || ""
                            } dark:text-white dark:bg-gray-800`}
                          >
                            {id === "toggle" ? (
                              <Switch />
                            ) : id === "actions" ? (
                              <div className="flex items-center space-x-4 justify-end">
                                {/* View Button */}
                                <button
                                  className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                                  onClick={() => viewUserHandle(elem)}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                    <circle cx="12" cy="12" r="3" />
                                  </svg>
                                </button>

                                {/* Edit Button */}
                                <button
                                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                  onClick={() => editUserHandle(elem)}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                  </svg>
                                </button>

                                {/* Delete Button */}
                                <button
                                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                  disabled={elem.role === "super admin"}
                                  onClick={() => deleteUserHandle(elem.id)}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M3 6h18" />
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <div>
                                {Array.isArray(content) ? (
                                  content.length > 1 ? (
                                    <span className="dark:text-white">
                                      Multiple Locations
                                    </span>
                                  ) : content.length === 1 ? (
                                    <span className="dark:text-white">
                                      {content[0].title}
                                    </span>
                                  ) : null
                                ) : (
                                  <span className="dark:text-white">
                                    {content}
                                  </span>
                                )}
                              </div>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center py-4 text-sm dark:text-white">
            <div className="text-gray-500 dark:text-gray-300">
              0 of {dataList.length} row(s) selected
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 border rounded text-gray-500 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                Previous
              </button>
              <button className="px-3 py-1 border rounded text-gray-500 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                Next
              </button>
            </div>
          </div>
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full max-w-md dark:bg-gray-800 dark:border-gray-700">
          <SheetHeader>
            <SheetTitle className="text-xl font-semibold dark:text-white">
              User Details
            </SheetTitle>
          </SheetHeader>
          {selectedUser && (
            <div className="grid gap-5 py-6">
              <div className="space-y-0.5">
                <div className="text-sm text-muted-foreground dark:text-gray-300">
                  Name
                </div>
                <div className="font-medium text-base dark:text-white">
                  {selectedUser.full_name}
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-sm text-muted-foreground dark:text-gray-300">
                  Role
                </div>
                <div className="font-medium text-base dark:text-white">
                  {selectedUser.role}
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-sm text-muted-foreground dark:text-gray-300">
                  Email
                </div>
                <div className="font-medium text-base dark:text-white">
                  {selectedUser.email}
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-sm text-muted-foreground dark:text-gray-300">
                  Locations
                </div>
                <div className="font-medium text-base space-y-1 dark:text-white">
                  {selectedUser.locations.length > 0 ? (
                    selectedUser.locations.map((loc: any, idx: number) => (
                      <div key={idx}>{loc.title}</div>
                    ))
                  ) : (
                    <span>No locations assigned</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default UserManagementComponent;
