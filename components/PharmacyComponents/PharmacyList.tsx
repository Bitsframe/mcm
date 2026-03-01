"use client";

import { CircularProgress } from "@mui/material";
import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
    CirclePlus,
    PenBoxIcon,
    Trash2,
} from "lucide-react";
import { IoSearchOutline } from "react-icons/io5";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";
import AddEditPharmacyModal from "./AddEditPharmacyModal";
import { Pharmacy, CreatePharmacyData } from "@/types/pharmacy";
import { TabContext } from "@/context";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";

const tableHeader = [
    { id: "name", label: "Pharmacy_k5", align: "text-start", classNames: "w-72" },
    { id: "address", label: "Pharmacy_k6", classNames: "w-72" },
    { id: "phone", label: "Pharmacy_k7" },
    { id: "delivers", label: "Pharmacy_k8" },
    { id: "actions", label: "", classNames: "w-28" },
];

const PharmacyList = () => {
    const [loading, setLoading] = useState(false);
    const [dataList, setDataList] = useState<Pharmacy[]>([]);
    const [allData, setAllData] = useState<Pharmacy[]>([]);
    const [tableLoading, setTableLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editData, setEditData] = useState<Pharmacy | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPageLarge = 6;
    const rowsPerPageSmall = 3;

    const { t } = useTranslation(translationConstant.PHARMACY);

    const handleOpen = () => setOpen(true);
    const handleClose = () => {
        setOpen(false);
        setEditData(null);
    };

    const onChangeHandle = (e: any) => {
        const val = e.target.value;
        if (val === "") {
            setDataList([...allData]);
        } else {
            const filteredData = allData.filter((elem) =>
                elem.name.toLowerCase().includes(val.toLowerCase())
            );
            setDataList([...filteredData]);
        }
        setCurrentPage(1);
    };

    const fetchPharmacies = async () => {
        setTableLoading(true);
        try {
            const response = await axios.get("/api/tools/pharmacy");
            const pharmacies = response.data.data;
            setDataList(pharmacies);
            setAllData(pharmacies);
        } catch (error) {
            console.error(error);
            toast.error("Error fetching pharmacy data.");
        } finally {
            setTableLoading(false);
        }
    };

    const addNewHandle = async (data: CreatePharmacyData) => {
        try {
            setLoading(true);
            await axios.post("/api/tools/pharmacy", data);
            setLoading(false);
            handleClose();
            fetchPharmacies();
            toast.success(t("Pharmacy_k27"));
        } catch (error: any) {
            setLoading(false);
            console.error("Error submitting data:", error);
            toast.error(
                `${t("Pharmacy_k28")} ${error?.response?.data?.message || error.message
                }`
            );
        }
    };

    const editHandle = async (data: CreatePharmacyData) => {
        if (!editData) return;
        try {
            setLoading(true);
            await axios.put(`/api/tools/pharmacy/${editData.id}`, data);
            setLoading(false);
            handleClose();
            fetchPharmacies();
            toast.success(t("Pharmacy_k29"));
        } catch (error: any) {
            setLoading(false);
            console.error("Error submitting data:", error);
            toast.error(
                `${t("Pharmacy_k30")} ${error?.response?.data?.message || error.message
                }`
            );
        }
    };

    const deleteHandle = async (id: number) => {
        if (!confirm(t("Pharmacy_k31"))) return;
        try {
            await axios.delete(`/api/tools/pharmacy/${id}`);
            toast.success(t("Pharmacy_k32"));
            fetchPharmacies();
            if (dataList.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
        } catch (error: any) {
            console.error("Error:", error);
            toast.error(`${t("Pharmacy_k33")} ${error?.response?.data?.message || error.message}`);
        }
    };

    const openEditModal = (pharmacy: Pharmacy) => {
        setEditData(pharmacy);
        handleOpen();
    }

    useEffect(() => {
        fetchPharmacies();
    }, []);

    const { setActiveTitle } = useContext(TabContext);

    useEffect(() => {
        setActiveTitle("Pharmacy"); // Or translation key
    }, [setActiveTitle]);

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
        <div className="flex flex-col sm:flex-row justify-center px-2 sm:px-4 pt-1 dark:bg-[#0E1725]">
            <div className="w-full bg-white rounded-lg dark:bg-[#0E1725]">
                {/* Heading Section */}
                <div className="p-1 sm:px-3">
                    <h1 className="text-xl font-bold dark:text-white">{t("Pharmacy_k1")}</h1>
                    <h1 className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {t("Pharmacy_k2")}
                    </h1>
                </div>

                {/* Header with search and add button */}
                <div className="p-1 sm:p-3 flex flex-row flex-wrap justify-between items-center gap-2 sm:gap-0">
                    <div className="relative w-full sm:w-60">
                        <input
                            onChange={onChangeHandle}
                            className="w-full pl-8 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[#f1f4f9] dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:focus:ring-blue-600"
                            type="text"
                            placeholder={t("Pharmacy_k3")}
                        />
                        <IoSearchOutline className="absolute left-2 top-2.5 text-gray-400 dark:text-gray-300" />
                    </div>

                    <button
                        onClick={handleOpen}
                        className="bg-blue-600 text-sm text-white px-4 py-2 rounded-md hover:bg-blue-700 active:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600 dark:active:bg-blue-800 flex items-center gap-2 
    sm:w-auto w-full justify-center sm:justify-start"
                    >
                        <CirclePlus className="text-lg" />
                        {t("Pharmacy_k4")}
                    </button>
                </div>

                {/* Table */}
                <div className="px-3">
                    {/* Desktop Table */}
                    <div className="hidden sm:block border rounded-md overflow-auto dark:border-[#172945] relative">
                        <Table>
                            <TableHeader className="sticky top-0 bg-white dark:bg-[#0E1725] z-10">
                                <TableRow className="border-b text-sm text-[#71717A] dark:text-gray-300 dark:border-[#172945]">
                                    <TableHead className="w-10 dark:bg-[#0E1725]"></TableHead>
                                    {tableHeader.map(({ label, align, classNames }, index) => (
                                        <TableHead
                                            key={index}
                                            className={`font-medium ${align || "text-left"} ${classNames || ""
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
                                            <TableCell className="py-4 text-left dark:text-white dark:bg-[#0E1725]">{elem.name}</TableCell>
                                            <TableCell className="py-4 text-left dark:text-white dark:bg-[#0E1725]">{elem.address}</TableCell>
                                            <TableCell className="py-4 text-left dark:text-white dark:bg-[#0E1725]">{elem.phone_number}</TableCell>
                                            <TableCell className="py-4 text-left dark:text-white dark:bg-[#0E1725]">{elem.delivers ? t("Pharmacy_k10") : t("Pharmacy_k11")}</TableCell>
                                            <TableCell className="py-4 text-left dark:text-white dark:bg-[#0E1725]">
                                                <div className="flex items-center space-x-4 justify-end">
                                                    <button
                                                        className="px-4 py-1 rounded bg-blue-500 text-white hover:bg-blue-700 transition-colors"
                                                        onClick={() => openEditModal(elem)}
                                                    >
                                                        Update
                                                    </button>
                                                    <button
                                                        className="px-4 py-1 rounded bg-red-500 text-white hover:bg-red-700 transition-colors"
                                                        onClick={() => deleteHandle(elem.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </TableCell>
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
                                                {elem.name}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-300">
                                                {elem.address}
                                            </p>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                className="px-4 py-1 rounded bg-blue-500 text-white hover:bg-blue-700 transition-colors"
                                                onClick={() => openEditModal(elem)}
                                            >
                                                Update
                                            </button>
                                            <button
                                                className="px-4 py-1 rounded bg-red-500 text-white hover:bg-red-700 transition-colors"
                                                onClick={() => deleteHandle(elem.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-3 space-y-2">
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-300">
                                                {t("Pharmacy_k7")}
                                            </p>
                                            <p className="text-sm dark:text-white">{elem.phone_number || "N/A"}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-300">{t("Pharmacy_k8")}</p>
                                            <p className="text-sm dark:text-white">{elem.delivers ? t("Pharmacy_k10") : t("Pharmacy_k11")}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-between items-center pt-3 text-sm dark:text-white">
                        <div className="text-gray-500 dark:text-gray-300">
                            {dataList.length > 0
                                ? `${t("Pharmacy_k12")} ${(currentPage - 1) *
                                (window.innerWidth < 640
                                    ? rowsPerPageSmall
                                    : rowsPerPageLarge) +
                                1
                                } ${t("Pharmacy_k13")} ${Math.min(
                                    currentPage *
                                    (window.innerWidth < 640
                                        ? rowsPerPageSmall
                                        : rowsPerPageLarge),
                                    dataList.length
                                )} ${t("Pharmacy_k14")} ${dataList.length} ${t("Pharmacy_k15")}`
                                : `${t("Pharmacy_k12")} 0 ${t("Pharmacy_k13")} 0 ${t("Pharmacy_k14")} 0 ${t("Pharmacy_k15")}`}
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="px-3 py-1 border rounded text-gray-500 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50"
                                onClick={handlePrevious}
                                disabled={currentPage === 1}
                            >
                                {t("Pharmacy_k16")}
                            </button>
                            <button
                                className="px-3 py-1 border rounded text-gray-500 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50"
                                onClick={handleNext}
                                disabled={
                                    currentPage >=
                                    (window.innerWidth < 640 ? totalPagesSmall : totalPagesLarge)
                                }
                            >
                                {t("Pharmacy_k17")}
                            </button>
                        </div>
                    </div>

                </div>

            </div>

            <AddEditPharmacyModal
                open={open}
                handleClose={handleClose}
                submitHandle={editData ? editHandle : addNewHandle}
                loading={loading}
                editData={editData}
            />
        </div>
    );
};

export default PharmacyList;
