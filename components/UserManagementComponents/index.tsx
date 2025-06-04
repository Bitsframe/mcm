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
import {
  CirclePlus,
  Eye,
  PenBoxIcon,
  Pencil,
  Trash2,
  TrashIcon,
} from "lucide-react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPageLarge = 6; 
  const rowsPerPageSmall = 3;

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
    setCurrentPage(1); // Reset to first page on search
  };

  const fetchUsers = async () => {
    setTableLoading(true);
    try {
      const fetchedData = await fetch_content_service({
        table: "profiles",
        selectParam: `, roles(name), email, user_locations(location_id, Locations(title))`,
      });

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
      // Adjust current page if necessary
      if (dataList.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
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

  // Pagination logic
  const totalPagesLarge = Math.ceil(dataList.length / rowsPerPageLarge);
  const totalPagesSmall = Math.ceil(dataList.length / rowsPerPageSmall);

  const paginatedDataLarge = dataList.slice(
    (currentPage - 1) * rowsPerPageLarge,
    currentPage * rowsPerPageLarge
  );

  const paginatedDataSmall = dataList.slice(
    (currentPage - 1) * rowsPerPageSmall,
    currentPage * rowsPerPageSmall
  );

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    const totalPages =
      window.innerWidth < 640 ? totalPagesSmall : totalPagesLarge;
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-center px-2 sm:px-4 py-3 dark:bg-[#0E1725]">
      <div className="w-full bg-white rounded-lg dark:bg-[#0E1725]">
        {/* Heading Section */}
        <div className="p-1 sm:p-3">
          <h1 className="text-xl font-bold dark:text-white">{t("User Management")}</h1>
          <h1 className="mt-1 mb-2 text-sm text-gray-500 dark:text-gray-400">
            Tools / User Management
          </h1>
        </div>

        {/* Header with search and add button */}
        <div className="p-1 sm:p-3 flex flex-row flex-wrap justify-between items-center gap-2 sm:gap-0">
          <div className="relative w-full sm:w-60">
            <input
              onChange={onChangeHandle}
              className="w-full pl-8 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#f1f4f9] dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-blue-600"
              type="text"
              placeholder={t("Search users by name")}
            />
            <IoSearchOutline className="absolute left-2 top-2.5 text-gray-400 dark:text-gray-300" />
          </div>

          <button
            onClick={handleOpen}
            className="bg-blue-600 text-sm text-white px-4 py-2 rounded-md hover:bg-blue-700 active:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600 dark:active:bg-blue-800 flex items-center gap-2 
    sm:w-auto w-full justify-center sm:justify-start"
          >
            <CirclePlus className="text-lg" />
            {t("Add New User")}
          </button>
        </div>

        {/* Table */}
        <div className="px-3 pb-6">
          {/* Desktop Table */}
          <div className="hidden sm:block border rounded-md overflow-auto dark:border-[#172945] relative">
            <Table>
              <TableHeader className="sticky top-0 bg-white dark:bg-[#0E1725] z-10">
                <TableRow className="border-b text-sm text-[#71717A] dark:text-gray-300 dark:border-[#172945]">
                  <TableHead className="w-10 dark:bg-[#0E1725]"></TableHead>
                  {tableHeader.map(({ label, align, classNames }, index) => (
                    <TableHead
                      key={index}
                      className={`font-medium ${align || "text-left"} ${
                        classNames || ""
                      } dark:text-white dark:bg-[#0E1725]`}
                    >
                      {t(label)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y dark:bg-[#0E1725]">
                {tableLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={tableHeader.length + 1}
                      className="py-20 dark:bg-[#0E1725]"
                    >
                      <div className="flex justify-center">
                        <CircularProgress />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedDataLarge.map((elem, index) => (
                    <TableRow
                      key={index}
                      className="hover:bg-gray-50 dark:bg-[#0E1725] dark:border-[#172945]"
                    >
                      <TableCell className="py-4 pr-3 dark:bg-[#0E1725]"></TableCell>
                      {tableHeader.map(({ id, classNames, align }, ind) => {
                        const content = elem[id];
                        return (
                          <TableCell
                            key={ind}
                            className={`py-4 ${align || "text-left"} ${
                              classNames || ""
                            } dark:text-white dark:bg-[#0E1725]`}
                          >
                            {id === "toggle" ? (
                              <Switch />
                            ) : id === "actions" ? (
                              <div className="flex items-center space-x-4 justify-end">
                                <button
                                  className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                                  onClick={() => viewUserHandle(elem)}
                                >
                                  <Eye className="w-4 h-4" color="grey" />
                                </button>

                                <button
                                  className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                  onClick={() => editUserHandle(elem)}
                                >
                                  <PenBoxIcon
                                    className="w-4 h-4"
                                    color="blue"
                                  />
                                </button>

                                <button
                                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                  disabled={elem.role === "super admin"}
                                  onClick={() => deleteUserHandle(elem.id)}
                                >
                                  <Trash2 className="w-4 h-4" color="red" />
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

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-3 mt-4">
            {tableLoading ? (
              <div className="flex justify-center py-20">
                <CircularProgress />
              </div>
            ) : (
              paginatedDataSmall.map((elem, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 dark:border-[#172945] dark:bg-[#0E1725]"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-base dark:text-white">
                        {elem.full_name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        {elem.role}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                        onClick={() => viewUserHandle(elem)}
                      >
                        <Eye className="w-4 h-4" color="grey" />{" "}
                      </button>
                      <button
                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        onClick={() => editUserHandle(elem)}
                      >
                        <PenBoxIcon className="w-4 h-4" color="blue" />
                      </button>
                      <button
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        disabled={elem.role === "super admin"}
                        onClick={() => deleteUserHandle(elem.id)}
                      >
                        <Trash2 className="w-4 h-4" color="red" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        Email
                      </p>
                      <p className="text-sm dark:text-white">{elem.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        Locations
                      </p>
                      <p className="text-sm dark:text-white">
                        {elem.locations.length > 0
                          ? elem.locations.length > 1
                            ? "Multiple Locations"
                            : elem.locations[0].title
                          : "No locations assigned"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center py-4 text-sm dark:text-white">
            <div className="text-gray-500 dark:text-gray-300">
              {dataList.length > 0
                ? `${
                    (currentPage - 1) *
                      (window.innerWidth < 640
                        ? rowsPerPageSmall
                        : rowsPerPageLarge) +
                    1
                  } - ${Math.min(
                    currentPage *
                      (window.innerWidth < 640
                        ? rowsPerPageSmall
                        : rowsPerPageLarge),
                    dataList.length
                  )} of ${dataList.length} row(s)`
                : "0 of 0 row(s)"}
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 border rounded text-gray-500 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50"
                onClick={handlePrevious}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <button
                className="px-3 py-1 border rounded text-gray-500 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50"
                onClick={handleNext}
                disabled={
                  currentPage >=
                  (window.innerWidth < 640 ? totalPagesSmall : totalPagesLarge)
                }
              >
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
        <SheetContent className="w-full max-w-md dark:bg-[#0e1725] m-3 rounded-lg dark:border-gray-700">
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
