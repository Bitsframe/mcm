"use client";
import React, { FC, useContext, useEffect, useState } from "react";
import { Quantity_Field } from "@/components/Quantity_Field";
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";
import { IoCloseOutline } from "react-icons/io5";
import { Select } from "flowbite-react";
import { PiCaretCircleRightFill } from "react-icons/pi";
import { useCategoriesClinica } from "@/hooks/useCategoriesClinica";
import { useProductsClinica } from "@/hooks/useProductsClinica";
import { useRouter } from "next/navigation";
import { CircularProgress } from "@mui/material";
import { currencyFormatHandle } from "@/helper/common_functions";
import { create_content_service } from "@/utils/supabase/data_services/data_services";
import { toast } from "sonner";
import { Searchable_Dropdown } from "@/components/Searchable_Dropdown";
import PromoCodeComponent from "@/components/PromoCodeComponent";
import { PromoCodeDataInterface } from "@/types/typesInterfaces";
import { formatPhoneNumber } from "@/utils/getCountryName";
import { useTranslation } from "react-i18next";
import { translationConstant } from "@/utils/translationConstants";
import { LocationContext } from "@/context";
import { TabContext } from "@/context";
import { sendInvoice } from "@/utils/smsServices/sendInvoice";

interface CartItemComponentInterface {
  data: CartArrayInterface;
  index: number;
  controllProductQtyHandle: (
    product_id: number,
    qty: number,
    price: number,
    index: number
  ) => void;
}
interface CartArrayInterface {
  product_id: number;
  quantity: number;
  product_name: string;
  category_name: string;
  category_id: number;
  price: number;
  quantity_available: number;
}

const render_details = [
  {
    key: "name",
    label: "Name:",
    render_value: (val: any) => `${val?.firstname} ${val?.lastname}`,
  },
  {
    key: "phone",
    label: "Phone Number:",
    render_value: (val: any) => formatPhoneNumber(val?.phone),
  },
  {
    key: "email",
    label: "Email:",
  },
  {
    key: "treatmenttype",
    label: "Treatment Category:",
  },
];

const Payment_Method_Select = ({ handleSelectChange, selectedMethod }: any) => {
  return (
    <div className="w-30">
      <Select
        onChange={handleSelectChange}
        className="w-full border rounded-md text-xs focus:outline-none dark:bg-[#122136] dark:border-gray-700 dark:text-white bg-white text-black"
        id="section"
        required={true}
      >
        <option
          value="Cash"
          className="dark:bg-[#122136] dark:text-white text-black"
        >
          Cash
        </option>
        <option
          value="Debit Card"
          className="dark:bg-[#122136] dark:text-white text-black"
        >
          Debit Card
        </option>
      </Select>
    </div>
  );
};

const grandTotalHandle = (
  ProductArray: CartArrayInterface[],
  discount?: number
) => {
  const totalQty = ProductArray.reduce((a, b) => a + b.quantity, 0);
  let GrossTotalAmount = ProductArray.reduce((a, b) => a + b.quantity * b.price, 0);
  let totalAmount = GrossTotalAmount
  let discountAmount = 0;

  if (discount && discount > 0) {
    discountAmount = (totalAmount * discount) / 100;
    totalAmount -= discountAmount;
  }

  return {
    qty: totalQty,
    amount: currencyFormatHandle(totalAmount),
    discountPercentage: discount ? discount : 0,
    GrossTotalAmount,
    discountAmount: discountAmount ? discountAmount : 0,
  };
};

const calcTotalAmount = (perItemAmount: number, qty: number) => {
  return currencyFormatHandle(perItemAmount * qty);
};

const CartItemComponent: FC<CartItemComponentInterface> = ({
  data,
  controllProductQtyHandle,
  index,
}) => {
  const {
    product_name,
    category_name,
    quantity,
    quantity_available,
    product_id,
    price,
  } = data;

  const qtyHandle = (type: string) => {
    let newQty = quantity;
    if (type === "inc") {
      newQty += 1;
    } else {
      newQty -= 1;
    }
    controllProductQtyHandle(product_id, newQty, price, index);
  };

  const removeItemHandle = () => {
    controllProductQtyHandle(product_id, 0, price, index);
  };

  return (
    <div className="bg-[#F1F4F9] dark:bg-gray-800 py-2 px-3 rounded-md">
      <div className="flex items-center">
        <div className="flex-1 flex items-center space-x-3">
          <div className="flex flex-col items-center text-[#121111] dark:text-gray-300">
            <button
              onClick={() => qtyHandle("inc")}
              className="disabled:opacity-60"
              disabled={quantity_available === quantity}
            >
              <IoIosArrowUp
                size={18}
                className="text-primary_color dark:text-blue-400"
              />
            </button>
            <span className="block text-base font-bold text-[#121111] dark:text-white">
              {quantity}
            </span>
            <button
              disabled={quantity === 0}
              className="disabled:opacity-60"
              onClick={() => qtyHandle("dec")}
            >
              <IoIosArrowDown
                size={18}
                className="text-primary_color dark:text-blue-400"
              />
            </button>
          </div>
          <dl>
            <dt className="text-base dark:text-white">{product_name}</dt>
            <dd className="text-sm text-gray-700 dark:text-gray-400">
              {category_name}
            </dd>
          </dl>
        </div>
        <div className="flex items-center space-x-3">
          <p className="font-bold text-[#121111] dark:text-white">
            {calcTotalAmount(price, quantity)}
          </p>
          <div>
            <button onClick={removeItemHandle}>
              <IoCloseOutline
                size={18}
                className="text-primary_color dark:text-blue-400"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Orders = () => {
  const { categories } = useCategoriesClinica(true);
  const { selectedLocation } = useContext(LocationContext);

  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const {
    selectedCategory,
    products,
    getCategoriesByLocationId,
    loadingProducts,
    selectedProduct,
    selectProductHandle,
  } = useProductsClinica();
  const [fetchingDataLoading, setfetchingDataLoading] = useState(true);
  const [cartArray, setCartArray] = useState<CartArrayInterface[]>([]);
  const [productQty, setProductQty] = useState<number>(0);
  const [placeOrderLoading, setPlaceOrderLoading] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [promoCodeData, setPromoCode] = useState<PromoCodeDataInterface | null>(
    null
  );
  const [selectedMethod, setSelectedMethod] = useState("Cash");
  const [lastLocationId, setLastLocationId] = useState(0);

  const router = useRouter();

  const category_change_handle = (e: any) => {
    const value = e.target.value;
    getCategoriesByLocationId(value);
    setProductQty(0);
  };

  const select_product_change_handle = (e: any) => {
    const value = e.target.value;
    selectProductHandle(value);
    setProductQty(0);
  };

  useEffect(() => {
    setfetchingDataLoading(true);
    const storedData = localStorage.getItem("@pos-patient") || null;

    if (storedData) {
      const data = JSON.parse(storedData);
      setSelectedPatient(data);
    }

    setTimeout(() => {
      setfetchingDataLoading(false);
    }, 2000);
  }, [router]);

  useEffect(() => {
    if (selectedLocation) {
      const currentSelectedLocationId = selectedLocation.id;
      if (lastLocationId && currentSelectedLocationId !== lastLocationId) {
        setCartArray([]);
        localStorage.removeItem("@pos-patient");
        setSelectedPatient(null);
        setLastLocationId(currentSelectedLocationId);
      }
    }
  }, [selectedLocation]);

  useEffect(() => {
    if (selectedLocation) {
      setLastLocationId(selectedLocation.id);
    }
  }, []);

  const quantityHandle = (qty: number) => {
    setProductQty(qty);
  };

  const addToCartHandle = () => {
    const findCategory: any = categories.find(
      ({ category_id }: any) => +selectedProduct.category_id === +category_id
    );

    let addProduct: CartArrayInterface | null = null;
    if (findCategory) {
      addProduct = {
        product_id: selectedProduct.product_id,
        product_name: selectedProduct.product_name,
        quantity: productQty,
        category_name: findCategory.category_name,
        category_id: findCategory.category_id,
        quantity_available: selectedProduct.quantity_available,
        price: selectedProduct.price,
      };
      if (addProduct) {
        cartArray.push(addProduct);
        setCartArray([...cartArray]);
        selectProductHandle(0);
        setProductQty(0);
        getCategoriesByLocationId(0);
      }
    }
  };

  const controllProductQtyHandle = (
    product_id: number,
    qty: number,
    price: number,
    index: number
  ) => {
    if (qty === 0) {
      cartArray.splice(index, 1);
    } else {
      cartArray[index].quantity = qty;
    }
    setCartArray([...cartArray]);
  };

  const placeOrderHandle = async () => {
    try {
      setPlaceOrderLoading(true);

      if (!selectedPatient) return;

      let orderCreatePostData: any = { patient_id: selectedPatient.id };

      if (promoCodeData) {
        orderCreatePostData.promo_code_id = promoCodeData.id;
      }

      const { data, error }: any = await create_content_service({
        table: "orders",
        post_data: orderCreatePostData,
      });

      if (error) throw new Error(error.message);

      if (data?.length) {
        const order_id = data[0].order_id;

        const post_data = cartArray.map((elem) => ({
          order_id,
          inventory_id: elem.product_id,
          quantity_sold: elem.quantity,
          total_price: elem.price * elem.quantity,
          paymentcash: selectedMethod === "Cash" ? true : false,
        }));

        const { data: order_created_data, error: order_created_error }: any =
          await create_content_service({
            table: "sales_history",
            post_data,
            multiple_rows: true,
          });

        if (order_created_error) throw new Error(order_created_error.message);

        if (order_created_data.length) {
          toast.success(`Order has been placed, order # ${order_id}`, {
            style: {
              background: "var(--background)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            },
          });



          const { qty,
            amount,
            discountPercentage,
            GrossTotalAmount,
            discountAmount } = grandTotalHandle(cartArray, appliedDiscount);
          const totalAmount = GrossTotalAmount;
          // const discountAmount = grandTotal.discountAmount;

          const orderDetails = {
            order_id,
            paymentcash: selectedMethod === "Cash",
          };

          await sendOrderEmail(
            orderDetails,
            selectedPatient,
            cartArray,
            GrossTotalAmount,
            Number(discountAmount),
            discountPercentage,
          );

          setCartArray([]);
          localStorage.removeItem("@pos-patient");
          setSelectedPatient(null);
        }
      }
    } catch (err: any) {
      toast.error(err.message, {
        style: {
          background: "var(--background)",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
        },
      });
    } finally {
      setPlaceOrderLoading(false);
    }
  };

  const applyDiscountHandle = (
    codeData: PromoCodeDataInterface | null,
    discount: number
  ) => {
    setAppliedDiscount(discount);
    setPromoCode(codeData);
  };

  const selectPaymentHandle = (event: any) => {
    setSelectedMethod(event.target.value);
  };

  const { setActiveTitle } = useContext(TabContext);

  useEffect(() => {
    setActiveTitle("Sidebar_k19");
  }, []);

  const { t } = useTranslation(translationConstant.POSSALES);
  return (
    <main className="w-full h-full font-medium text-sm dark:bg-gray-900 dark:text-white">
      <div className="w-full h-[77dvh] p-1 grid grid-cols-3 gap-1">
        <div className="bg-[#F1F4F9] dark:bg-[#080E16] h-[60dvh] overflow-auto col-span-2 rounded">
          <div className="space-y-3 dark:bg-[#080E16]">
            {fetchingDataLoading ? (
              <div className="w-full flex flex-col justify-center h-full space-y-1">
                <CircularProgress size={16} className="dark:text-white" />
                <h1 className="text-xs text-gray-400 dark:text-gray-300">
                  Fetching patient details
                </h1>
              </div>
            ) : (
              <div className="bg-[#F1F4F9] dark:bg-[#080E16] p-2 rounded shadow-sm">
                <h2 className="text-sm font-semibold mb-2 dark:text-white">
                  Patient Details
                </h2>
                {selectedPatient ? (
                  <div className="grid grid-cols-2 gap-2">
                    {render_details.map(({ label, key, render_value }, ind) => {
                      const extracted_val = render_value
                        ? render_value(selectedPatient)
                        : selectedPatient[key];
                      return (
                        <div
                          key={ind}
                          className="space-y-0.5 bg-white dark:bg-[#0E1725] p-2 rounded"
                        >
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {label}
                          </p>
                          <p className="text-sm font-medium dark:text-white">
                            {extracted_val}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    <h1 className="text-red-600 dark:text-red-400 text-xs">
                      {t("POS-Sales_k4")}
                    </h1>
                  </div>
                )}
              </div>
            )}

            <div className="bg-[#F1F4F9] dark:bg-[#080E16] p-2 rounded shadow-sm">
              <h2 className="text-sm font-semibold mb-2 dark:text-white">
                Product Details
              </h2>

              <div className="space-y-2">
                <div>
                  <Searchable_Dropdown
                    disabled={!selectedPatient}
                    initialValue={0}
                    value={selectedCategory}
                    //@ts-ignore
                    dark_bg_color="gray.700"
                    start_empty={true}
                    options_arr={categories.map(
                      ({ category_id, category_name }: any) => ({
                        value: category_id,
                        label: category_name,
                      })
                    )}
                    required={true}
                    on_change_handle={category_change_handle}
                    label="POS-Sales_k6"
                  />
                </div>

                <div>
                  {loadingProducts ? (
                    <div className="text-xs text-black dark:text-white">
                      {selectedCategory ? "Loading..." : "Select Category.."}
                    </div>
                  ) : (
                    <Searchable_Dropdown
                      disabled={!selectedPatient}
                      initialValue={0}
                    //@ts-ignore
                      dark_bg_color="gray.700"
                      start_empty={true}
                      options_arr={products.map(
                        ({ product_id, product_name }: any) => ({
                          value: product_id,
                          label: product_name,
                        })
                      )}
                      required={true}
                      value={selectedProduct ? selectedProduct.product_id : 0}
                      on_change_handle={select_product_change_handle}
                      label="Select Product"
                    />
                  )}
                </div>

                <div>
                  <div className="space-y-0.5">
                    <Quantity_Field
                      disabled={!selectedPatient}
                      maxAvailability={
                        selectedProduct ? selectedProduct.quantity_available : 0
                      }
                      quantity={productQty}
                      quantityHandle={quantityHandle}
                    />

                    {selectedProduct? (
                      <div className="flex justify-between items-center text-gray-600 dark:text-gray-300 pl-0.5">
                        <div className="text-xs">
                          {currencyFormatHandle(selectedProduct?.price || 0)}
                          /unit
                        </div>
                        <div className="text-xs text-amber-600 dark:text-amber-400">
                          {selectedProduct.quantity_available - productQty} left
                        </div>
                      </div>
                    ): null}
                  </div>
                </div>

                <div className="flex">
                  <button
                    disabled={!productQty}
                    onClick={addToCartHandle}
                    className="bg-[#0066FF] text-white font-medium py-1 px-4 rounded hover:opacity-90 active:opacity-70 disabled:opacity-50 text-xs"
                    type="submit"
                  >
                    {t("POS-Sales_k8")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#F1F4F9] dark:bg-[#080E16] h-[60dvh] overflow-auto rounded flex flex-col shadow-sm p-1">
          <div className="p-2 bg-white dark:bg-[#0E1725] rounded border-b border-gray-100">
            <div className="flex-1">
              <h1 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t("POS-Sales_k9")}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("POS-Sales_k10")} # --
              </p>
            </div>
          </div>

          <div className="overflow-auto flex-1 p-1 my-0.5 bg-white dark:bg-[#0e1725] rounded">
            <div className="space-y-0.5">
              {cartArray.map((data: CartArrayInterface, ind) => (
                <CartItemComponent
                  index={ind}
                  data={data}
                  key={ind}
                  controllProductQtyHandle={controllProductQtyHandle}
                />
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-700 mt-auto rounded-b">
            <div className="p-2 space-y-2 rounded dark:bg-[#0E1725]">
              <PromoCodeComponent
                patientId={selectedPatient?.id}
                applyDiscountHandle={applyDiscountHandle}
              />

              <div className="flex items-center justify-between">
                <h1 className="text-xs text-gray-700 dark:text-gray-300">
                  {t("POS-Sales_k12")}
                </h1>
                <Payment_Method_Select
                  selectedMethod={selectedMethod}
                  handleSelectChange={selectPaymentHandle}
                />
              </div>

              <div className="flex items-center justify-between">
                <h1 className="text-xs text-gray-700 dark:text-gray-300">
                  {t("POS-Sales_k13")}
                </h1>
                <p
                  className={`text-xs ${
                    appliedDiscount
                      ? "text-red-500 dark:text-red-400"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {appliedDiscount
                    ? `-${
                        grandTotalHandle(cartArray, appliedDiscount)
                          .discountAmount
                      }`
                    : "NILL"}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <h1 className="text-xs text-gray-700 dark:text-gray-300">
                  {t("POS-Sales_k14")}
                </h1>
                <p className="text-xs text-gray-900 dark:text-white">
                  ${grandTotalHandle(cartArray).amount}
                </p>
              </div>

              <div className="flex justify-end pt-0.5">
                <button
                  onClick={placeOrderHandle}
                  disabled={!cartArray.length}
                  className="bg-blue-600 rounded py-0.5 px-2 text-white disabled:opacity-50 flex items-center text-xs"
                >
                  {placeOrderLoading ? (
                    <CircularProgress size={14} color="secondary" />
                  ) : (
                    <>
                      <span className="font-medium">
                        {grandTotalHandle(cartArray, appliedDiscount).amount}
                      </span>
                      <PiCaretCircleRightFill size={16} className="ml-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Orders;

const sendOrderEmail = async (
  orderDetails: any,
  patientInfo: any,
  orderItems: any[],
  totalAmount: number = 0,
  discountAmount: number = 0,
  appliedDiscount: number = 0
) => {
  

  try {
    const today = new Date();
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const formattedDate = `${today.getDate()}-${months[today.getMonth()]
      }-${today.getFullYear()}`;

    // Create a feedback URL with order ID and patient ID for tracking
    const feedbackUrl = `https://new.clinicsanmiguel.com/feedback/${orderDetails.order_id}`;

    const netAmount = +totalAmount - +discountAmount

    const emailHtml = `


            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                <p>Dear ${patientInfo.firstname} ${patientInfo.lastname},</p>
                
                <p>Thank you for choosing Clinica San Miguel for your healthcare needs. Please find your invoice details below:</p>
                
                <h3 style="margin-top: 20px;">Invoice Details:</h3>
                <ul style="list-style-type: none; padding-left: 0;">
                    <li><strong>Invoice Number:</strong> I-${orderDetails.order_id
      }</li>
                    <li><strong>Invoice Date:</strong> ${formattedDate}</li>
                    <li><strong>Payment Method:</strong> ${orderDetails.paymentcash ? "Cash" : "Debit Card"
      }</li>
                    <li><strong>Gross Amount:</strong> ${totalAmount}</li>
                    <li><strong>Discount(${appliedDiscount}%):</strong> -${discountAmount}</li>
                    <li><strong>Net Amount:</strong> ${netAmount}</li>
                </ul>
                
                <h3>Billing Information:</h3>
                <ul style="list-style-type: none; padding-left: 0;">
                    <li><strong>Patient Name:</strong> ${patientInfo.firstname
      } ${patientInfo.lastname}</li>
                    <li><strong>Location:</strong> Clinica San Miguel ${patientInfo.location || "Pasadena"
      }</li>
                </ul>
                
                <h3>Invoice Summary:</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                    <thead>
                        <tr style="background-color: #eee;">
                            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Category</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Product</th>
                            <th style="padding: 10px; text-align: center; border-bottom: 1px solid #ddd;">Units</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orderItems
        .map(
          (item) => `
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.category_name
            }</td>
                                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product_name
            }</td>
                                <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity
            }</td>
                                <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${currencyFormatHandle(
              item.price * item.quantity
            )}</td>
                            </tr>
                        `
        )
        .join("")}
                    </tbody>
                    ${discountAmount > 0
        ? `
                        <tfoot>
                            <tr>
                                <td colspan="3" style="padding: 10px; text-align: right;"><strong>Discount:</strong></td>
                                <td style="padding: 10px; text-align: right;">-${currencyFormatHandle(
          discountAmount
        )}</td>
                            </tr>
                            <tr>
                                <td colspan="3" style="padding: 10px; text-align: right;"><strong>Grand Total:</strong></td>
                                <td style="padding: 10px; text-align: right; font-weight: bold;">${netAmount}</td>
                            </tr>
                        </tfoot>
                    `
        : `
                        <tfoot>
                            <tr>
                                <td colspan="3" style="padding: 10px; text-align: right;"><strong>Grand Total:</strong></td>
                                <td style="padding: 10px; text-align: right; font-weight: bold;">${netAmount}</td>
                            </tr>
                        </tfoot>
                    `
      }
                </table>
                
                <p>If you have any questions or need further assistance, feel free to reach out at contact@clinicasanmiguel.com.</p>
                
                <p>Thank you for your trust in us.</p>
                
                <p>Best regards,<br>Clinica San Miguel Team</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
                    <p style="color: #666;">We value your feedback!</p>
                    <a href="${feedbackUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Share Your Feedback & Get a Promo Code</a>
                    <p style="color: #666; font-size: 12px; margin-top: 10px;">Complete our quick survey and receive a promotional code for your next visit.</p>
                </div>
            </div>
        `




    const fromEmail = "test@alerts.myclinicmd.com";

    const payload = {
      from: fromEmail,
      recipients: [patientInfo.email],
      subject: `Invoice I-${orderDetails.order_id}`,
      html: emailHtml,
    };

    const response = await fetch(
      "https://send-resent-mail-646827ff1a0b.herokuapp.com/send-batch-email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Failed to send order confirmation email"
      );
    }

    return result;
  } catch (error: any) {
    console.error("Error sending order email:", error);
  }
};
