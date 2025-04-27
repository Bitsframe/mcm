"use client";
import React, { useContext, useEffect } from "react";
import WebsiteContentLayout from "./Layout";
import { useSingleRowDataHandle } from "@/hooks/useSingleRowDataHandle";
import { Select_Dropdown } from "@/components/Select_Dropdown";
import { Form_Component } from "@/components/Form_Component";
import {
  home_section_options,
  langage_list_options,
} from "@/utils/list_options/dropdown_list_options";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import { TabContext } from "@/context";

const only_fields_to_render = {
  Hero_Section: ["title", "content"],
  About_Short: ["content"],
  Mission: ["Title", "Text"],
};

const Home = () => {
  const {
    default_data,
    data,
    is_edited,
    update_loading,
    selected_language,
    select_language_handle,
    on_change_handle,
    handle_update,
    setSelected_section,
    selected_section,
    data_list,
    selected_list_id,
    change_selected_list_id,
    reset_fields,
  } = useSingleRowDataHandle({
    default_selected_section: home_section_options[0].value,
    list_item_section: ["Mission"],
    table: "Hero_Section",
    required_fields: [],
  });

  const select_section_handle = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelected_section(() => e.target.value);
  };

  const { t } = useTranslation(translationConstant.WEBCONT);
  const { setActiveTitle } = useContext(TabContext);

  useEffect(() => {
    setActiveTitle("Sidebar_k15");
  }, []);

  return (
    <WebsiteContentLayout>
      <div className="mb-5 px-4 py-4 bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-white rounded-xl shadow-sm border border-gray-200 transition-colors duration-300">
        <div className="flex gap-4 mb-6">
          <Select_Dropdown
            value={selected_section}
            label={t("WebCont_k7")}
            options_arr={home_section_options}
            on_change_handle={select_section_handle}
            required={true}
            bg_color="bg-[#F1F4F7] dark:bg-[#0e1725]"
          />
          <Select_Dropdown
            value={selected_language}
            label={t("WebCont_k8")}
            options_arr={langage_list_options}
            on_change_handle={select_language_handle}
            required={true}
            bg_color="bg-[#F1F4F7] dark:bg-[#0e1725]"

          />
          {selected_section === "Mission" && (
            <Select_Dropdown
              value={selected_list_id}
              label="ID"
              options_arr={data_list.map((e) => ({ label: e.id, value: e.id }))}
              on_change_handle={change_selected_list_id}
              required={true}
              bg_color="bg-[#F1F4F7] dark:bg-[#0e1725]"

            />
          )}
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
              // @ts-ignore
              render_list_fields={only_fields_to_render[selected_section]}
              on_change_handle={on_change_handle}
            />
          )}
        </div>
      </div>
    </WebsiteContentLayout>
  );
};

export default Home;
