"use client";

import React, { useContext, useEffect, useState } from "react";
import PermissionToggle from "./PermissionToggle";
import { Switch } from "antd";
import { useRolesAndPermissions } from "@/hooks/useRolesAndPermissions";
import { CircularProgress } from "@mui/material";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import { TabContext } from "@/context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

const SingleRoleHandle = ({
  data,
  index,
  updateRoleHandle,
  deleteRoleHandle,
  editStateId,
  editHandle,
  selectRoleHandle,
  selectedRole,
  setSelectedRoleDetails,
}: any) => {
  const [editValue, setEditValue] = useState(data.name);
  const { t } = useTranslation(translationConstant.ROLESANDPERMISSIONS);

  const handleCancel = () => {
    setEditValue(data.name);
    editHandle(0);
  };

  const handleUpdate = () => {
    if (editValue.trim() !== "") {
      updateRoleHandle({ id: data.id, name: editValue });
    }
  };

  const handleSelectRole = () => {
    selectRoleHandle(data.id);
    setSelectedRoleDetails(data);
  };

  return (
    <TableRow
      className={`hover:bg-gray-200 dark:hover:bg-gray-700 ${
        selectedRole.id === data.id ? "bg-gray-200 dark:bg-gray-700" : ""
      }`}
    >
      <TableCell className="font-medium p-2">
        {editStateId === data.id ? (
          <div className="flex items-center gap-3">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="dark:bg-gray-800"
            />
            <div className="flex gap-2">
              <Button onClick={handleUpdate} size="sm">
                {t("RP_k8")}
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm">
                {t("RP_k4")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4 flex-1">
              <span
                className="dark:text-white cursor-pointer text-left"
                onClick={handleSelectRole}
              >
                {data.name}
              </span>
            </div>

            {/* Changed condition from index > 0 to data.id !== 1 */}
            {data.id !== 1 && (
              <div className="flex gap-1 justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:text-red-400 dark:text-red-400 dark:hover:text-red-300 h-8 w-8"
                  onClick={() => deleteRoleHandle(data.id)}
                >
                  <Trash2 size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 h-8 w-8"
                  onClick={() => editHandle(data.id)}
                >
                  <Pencil size={16} />
                </Button>
              </div>
            )}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
};

const RolesAndPermissionsComponent: React.FC = () => {
  const {
    roles,
    loadingDataState,
    activeForAddNewRoleInput,
    newAddLoading,
    handleAddRole,
    toggleActivateAddNewRoleHandle,
    deleteRoleHandle,
    updateRoleHandle,
    setEditStateIndexActivate,
    editStateId,
    selectRoleHandle,
    selectedRole,
    permissions,
    handlePermissionToggle,
    toggleAllPermissions,
  } = useRolesAndPermissions();

  const [newRoleName, setNewRoleName] = useState("");
  const [newRolePermissions, setNewRolePermissions] = useState<
    Record<string, boolean>
  >({});
  const [selectedRoleDetails, setSelectedRoleDetails] = useState<any>(null);
  const [showRoleDetails, setShowRoleDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 4;

  // Calculate pagination
  const totalPages = Math.ceil(roles.length / rowsPerPage);
  const paginatedRoles = roles.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Pagination handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Reset to first page when roles change
  useEffect(() => {
    setCurrentPage(1);
  }, [roles]);

  // Initialize permissions for new role
  useEffect(() => {
    if (permissions.length > 0) {
      const initialPermissions: Record<string, boolean> = {};
      permissions.forEach((perm: any) => {
        initialPermissions[perm.name] = false;
      });
      setNewRolePermissions(initialPermissions);
    }
  }, [permissions]);

  useEffect(() => {
    if (selectedRoleDetails) {
      setShowRoleDetails(true);
    }
  }, [selectedRoleDetails]);

  const handlePermissionChange = (permissionName: string, allowed: boolean) => {
    setNewRolePermissions((prev) => ({
      ...prev,
      [permissionName]: allowed,
    }));
  };

  const handleCreateRole = () => {
    if (newRoleName.trim() !== "") {
      handleAddRole({
        name: newRoleName,
        permissions: newRolePermissions,
      });
      setNewRoleName("");
      toggleActivateAddNewRoleHandle(false);
    }
  };

  const handleAllowAll = (allowed: boolean) => {
    toggleAllPermissions(allowed);
  };

  const { setActiveTitle } = useContext(TabContext);

  useEffect(() => {
    setActiveTitle("Sidebar_k17");
  }, []);

  const { t } = useTranslation(translationConstant.ROLESANDPERMISSIONS);

  return (
    <div className="p-6 w-full mx-auto max-h-[87dvh] dark:bg-gray-900">
      <div className="w-full flex flex-col">
        {/* User Roles Section */}
        <div className="w-full mb-6">
          <div className="flex items-center justify-between px-2 mb-3">
            <div>
              <h2 className="text-lg font-bold dark:text-white">
                {t("RP_k1")}
              </h2>
            </div>
            <div>
              <button
                onClick={() => toggleActivateAddNewRoleHandle(true)}
                className="bg-[#0066ff] hover:no py-2 px-3 rounded-lg text-white"
              >
                {t("RP_k6")}
              </button>
            </div>
          </div>

          <div className="border rounded-md overflow-hidden">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-full">Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingDataState ? (
                  <TableRow>
                    <TableCell colSpan={1} className="text-center py-4">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRoles.map((elem, index) => (
                    <SingleRoleHandle
                      selectedRole={selectedRole}
                      selectRoleHandle={selectRoleHandle}
                      editHandle={setEditStateIndexActivate}
                      editStateId={editStateId}
                      updateRoleHandle={updateRoleHandle}
                      deleteRoleHandle={deleteRoleHandle}
                      key={elem.id}
                      data={elem}
                      index={index}
                      setSelectedRoleDetails={setSelectedRoleDetails}
                    />
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
          </div>

          {!loadingDataState && roles.length > rowsPerPage && (
            <div className="flex justify-between items-center py-2 border-t dark:border-gray-700 bg-white dark:bg-[#111827]">
              <span className="text-sm text-gray-800 dark:text-white">
                Showing {currentPage} out of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="border border-gray-300 text-gray-800 dark:border-gray-600 dark:text-gray-200 bg-white dark:bg-[#111827]"
                >
                  Previous
                </Button>

                <Button
                  variant="outline"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="border border-gray-300 text-gray-800 dark:border-gray-600 dark:text-gray-200 bg-white dark:bg-[#111827]"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Role Details Sheet */}
      <Sheet open={showRoleDetails} onOpenChange={setShowRoleDetails}>
        <SheetContent className=" dark:bg-[#111827] dark:border-gray-700">
          <SheetHeader>
            <SheetTitle className="dark:text-white">
              {selectedRoleDetails?.name || "Role Details"}
            </SheetTitle>
          </SheetHeader>

          <div className="grid gap-4 py-4">
            {selectedRoleDetails && (
              <>
                <div className="grid gap-2">
                  <Label className="dark:text-white">Permissions</Label>
                  <div className="space-y-3 p-4 dark:bg-[#111827]">
                    {permissions.map((perm: any) => (
                      <div
                        key={perm.name}
                        className="flex items-center justify-between"
                      >
                        <Label
                          htmlFor={`perm-${perm.name}`}
                          className="dark:text-white"
                        >
                          {perm.name}
                        </Label>
                        <Switch
                          id={`perm-${perm.name}`}
                          checked={
                            perm.allowed || selectedRoleDetails?.id === 1
                          }
                          disabled={selectedRoleDetails?.id === 1}
                          onChange={(checked: boolean) =>
                            handlePermissionToggle(perm.name, checked)
                          }
                          className="dark:bg-gray-600"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 dark:text-white">
                  <span>Allow All Permissions</span>
                  <Switch
                    className="disabled:opacity-65"
                    disabled={selectedRoleDetails?.id === 1}
                    onChange={handleAllowAll}
                    checked={
                      permissions?.every((perm: any) => perm.allowed) ||
                      selectedRoleDetails?.id === 1
                    }
                  />
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Add New Role Sheet */}
      <Sheet
        open={activeForAddNewRoleInput}
        onOpenChange={toggleActivateAddNewRoleHandle}
      >
        <SheetContent className=" dark:bg-[#111827]">
          <SheetHeader>
            <SheetTitle className="dark:text-white">{t("RP_k6")}</SheetTitle>
          </SheetHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="role-title" className="dark:text-white">
                {t("RP_k7")}
              </Label>
              <Input
                id="role-title"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder={t("RP_k7")}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="grid gap-2">
              <Label className="dark:text-white">{t("RP_k2")}</Label>
              <div className="space-y-3 p-4 dark:bg-[#111827]">
                {permissions.map((perm: any) => (
                  <div
                    key={perm.name}
                    className="flex items-center justify-between"
                  >
                    <Label
                      htmlFor={`perm-${perm.name}`}
                      className="dark:text-white"
                    >
                      {perm.name}
                    </Label>
                    <Switch
                      id={`perm-${perm.name}`}
                      checked={newRolePermissions[perm.name] || false}
                      onChange={(checked: boolean) =>
                        handlePermissionChange(perm.name, checked)
                      }
                      className="dark:bg-gray-600"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SheetFooter>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setNewRoleName("");
                  setNewRolePermissions({});
                  toggleActivateAddNewRoleHandle(false);
                }}
                className="dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
              >
                {t("RP_k4")}
              </Button>
              <Button
                type="submit"
                onClick={handleCreateRole}
                disabled={newAddLoading || !newRoleName.trim()}
                className="dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                {newAddLoading ? <CircularProgress size={20} /> : t("RP_k5")}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default RolesAndPermissionsComponent;
