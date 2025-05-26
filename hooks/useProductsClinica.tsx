const { useEffect, useState } = require("react");
import { LocationContext } from '@/context';
import { fetch_content_service } from '@/utils/supabase/data_services/data_services'
import { useContext } from 'react';

interface ProductDataInterface {
    category_id: number;
    price: number;
    product_id: number;
    product_name: string;
    quantity_available: number;

}


export function useProductsClinica() {


    const [data, setdata] = useState([])
    const [selectedCategory, setSelectedCategory] = useState(0)
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [loading, setLoading] = useState(true)

    const { selectedLocation, setSelectedLocation } = useContext(LocationContext);


    const onChangeCategory = (cat_id: number) => {
        setSelectedCategory(cat_id)
        setSelectedProduct(0)
    }
    const onChangeProduct = (pro_id: number) => {
        const findProduct = data.find(({ product_id }: any) => product_id == pro_id)
        console.log(findProduct)
        setSelectedProduct(findProduct)
    }


    useEffect(() => {

        onChangeCategory(0)

    }, [selectedLocation])




    useEffect(() => {
        setLoading(true)

        if (selectedCategory) {
            !(async function fetch_data() {
                let matchCase = null
                if (selectedCategory) {
                    matchCase = [
                        {
                            key: 'products.category_id',
                            value: selectedCategory
                        },
                        {
                            key: 'location_id',
                            value: selectedLocation.id
                        },
                        {
                            key: 'archived',
                            value: false
                        },
                        {
                            key: 'products.archived',
                            value: false
                        }
                    ]
                }
                const data = await fetch_content_service({ table: 'inventory', matchCase: matchCase, selectParam: ',products(category_id, product_name,archived, unlimited)', filterOptions: [
                    { operator: 'not', column: 'products', value: null }
                    ] })

                // {
                //     "inventory_id": 4,
                //     "product_id": 279,
                //     "quantity": 5,
                //     "last_updated": "2024-11-04T20:40:45.13231+00:00",
                //     "location_id": 17,
                //     "price": 400,
                //     "archived": false,
                //     "products": {
                //       "archived": false,
                //       "category_id": 2,
                //       "product_name": "Excuse Forms"
                //     }
                //   }


                // {
                //     "product_id": 140,
                //     "category_id": 2,
                //     "product_name": "Ceftriaxone (500mg y 1gr)",
                //     "price": 50,
                //     "quantity_available": 94,
                //     "archived": false
                //   }

                const formattedData = data.filter((elem)=>elem.quantity > 0 || elem.products.unlimited).map(({ quantity, inventory_id, price, products: { product_name, category_id, unlimited } }: any) => {
                    return {
                        product_id: inventory_id,
                        category_id,
                        product_name: product_name,
                        price,
                        quantity_available: quantity,
                        unlimited,
                    }
                })

                setdata(formattedData);
                setLoading(false)
            })()
        }

    }, [selectedCategory]);



    return { products: data, getCategoriesByLocationId: onChangeCategory, loadingProducts: loading, selectedCategory, selectedProduct, selectProductHandle: onChangeProduct }



}