"use client";
import React, { useContext, useEffect } from "react";
import WebsiteContentLayout from "../Layout";
import { useSingleRowDataHandle } from "@/hooks/useSingleRowDataHandle";
import { Select_Dropdown } from "@/components/Select_Dropdown";
import { Form_Component } from "@/components/Form_Component";
import { langage_list_options } from "@/utils/list_options/dropdown_list_options";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import { TabContext } from "@/context";

const service_fields = ["title", "description", "image", "icon"];

const Services = () => {
  const {
    data,
    data_list,
    is_edited,
    update_loading,
    selected_language,
    select_language_handle,
    on_change_handle,
    handle_update,
    reset_fields,
    selected_list_id,
    change_selected_list_id,
  } = useSingleRowDataHandle({
    table: "services",
    list_data: true,
    required_fields: [],
  });

  const { t } = useTranslation(translationConstant.WEBCONT);
  const { setActiveTitle } = useContext(TabContext);

  useEffect(() => {
    setActiveTitle("Services");
  }, [setActiveTitle]);

  return (
    <WebsiteContentLayout>
      <div className="px-2 sm:px-4 py-4 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white rounded-xl shadow-sm border border-gray-200 transition-colors duration-300">
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-4 mb-6">
          <Select_Dropdown
            value={selected_list_id}
            label="Select Service"
            options_arr={data_list.map(({ id, title }) => ({
              value: id,
              label: title,
            }))}
            on_change_handle={change_selected_list_id}
            required={true}
            bg_color="bg-[#F1F4F7] dark:bg-[#122139]"
          />
          <Select_Dropdown
            value={selected_language}
            label={t("WebCont_k8")}
            options_arr={langage_list_options}
            on_change_handle={select_language_handle}
            required={true}
            bg_color="bg-[#F1F4F7] dark:bg-[#0e1725]"
          />
        </div>

        <div className="border-t border-gray-200 dark:border-gray-600 mb-6"></div>

        <div className="w-full space-y-5">
          {data && (
            <Form_Component
              reset_fields={reset_fields}
              handle_update={handle_update}
              is_edited={is_edited}
              update_loading={update_loading}
              data={data}
              render_list_fields={service_fields}
              on_change_handle={on_change_handle}
            />
          )}
        </div>
      </div>
    </WebsiteContentLayout>
  );
};

export default Services;
