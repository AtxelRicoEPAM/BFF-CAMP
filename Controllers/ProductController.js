const axios = require('axios').default;
const { findAttributeByCode,findSizeLabelByValue,findColorLabelByValue } = require('../utils/utils.js')
const {CategoryController} = require('./CategoryController.js')

const { agent, options } = require('../constants.js');
class ProductController {

    static transformCategoryData(categories) {
        // Helper function to recursively build the ancestor list
        function buildAncestors(node, ancestors = []) {
            if (node.parent_id && node.parent_id !== 1) { // 1 usually represents root in Magento                
                let parent = categories.find(cat => cat.id === node.parent_id);
                if (node.parent_id == 1) parent = null;
                if (parent) {
                    ancestors.unshift({ type: 'category', id: String(parent.id) });
                    buildAncestors(parent, ancestors);
                }
            }
            return ancestors;
        }

        // Map each category structure from the Magento format to the Storefront format
        function mapCategories(node, parent = null) {
            const result = {
                id: String(node.id),
                name: node.name,
                description: node.name, // Assuming the description is similar to the name
                slug: String(node.id), // Assuming the slug is the string version of ID
                parent: parent ? { id: String(parent.id) } : undefined,
                ancestors: buildAncestors(node)
            };

            // Flatten and include all children
            const children = node.children_data.map(child => mapCategories(child, node));
            return [result, ...children.flat()];
        }

        // Start mapping from the root categories assuming root's parent_id is '1' which is typically the unclassified root category in Magento
        return categories
            .filter(cat => cat.parent_id === 1)
            .map(cat => mapCategories(cat))
            .flat();
    }

    static async transformMagentoProductsToStorefront(magentoProducts) {
        // Helper function to convert Magento's price to storefront format
        function formatPrice(price) {
            return [{
                value: {
                    currencyCode: "USD",
                    centAmount: price * 100 // Assuming the input price is in dollars
                }
            }];
        }

        // Helper function to format images
        function formatImages(imageFile) {
            return [{
                url: `https://magento.test/media/catalog/product/${imageFile}`
            }];
        }

        // Helper function to map custom attributes to a simpler key-value pair structure
        function mapCustomAttributes(customAttributes) {
            const attributesMap = {};
            customAttributes.forEach(attr => {
                attributesMap[attr.attribute_code] = attr.value;
            });
            return attributesMap;
        }

        

        return await Promise.all( magentoProducts.map(async product => {
            const customAttributes = mapCustomAttributes(product.custom_attributes);

            return {
                id: String(product.id),
                name: product.name,
                description: customAttributes.description,
                slug: customAttributes.url_key,
                variants: [{
                    id: String(product.id),
                    sku: product.sku,
                    prices: product.price,
                    images: formatImages(customAttributes.image),
                    attributes: [
                        {
                            name: "Color",
                            value: {
                                key: findAttributeByCode(product.custom_attributes, "color"),
                                label: await findColorLabelByValue(findAttributeByCode(product.custom_attributes, "color"),agent,options)
                            }
                        },
                        {
                            name: "Size",
                            value: {
                                key: findAttributeByCode(product.custom_attributes, "size"),
                                label: await findSizeLabelByValue(findAttributeByCode(product.custom_attributes, "size"),agent,options)
                            }
                        }
                    ],
                    slug: customAttributes.url_key,
                    name: product.name
                }],
                masterVariant: {
                    id: String(product.id),
                    sku: product.sku,
                    prices: formatPrice(product.price),
                    images: formatImages(customAttributes.image),
                    attributes: [
                        {
                            name: "Color",
                            value: {
                                key: findAttributeByCode(product.custom_attributes, "color"),
                                label: await findColorLabelByValue(findAttributeByCode(product.custom_attributes, "color"),agent,options)
                            }
                        },
                        {
                            name: "Size",
                            value: {
                                key: findAttributeByCode(product.custom_attributes, "size"),
                                label: await findSizeLabelByValue(findAttributeByCode(product.custom_attributes, "size"),agent,options)
                            }
                        }
                    ],
                    slug: customAttributes.url_key,
                    name: product.name
                }
            };
        }));
    }

    static async transformMagentoProductToStorefront(magentoProduct) {
        function arrayToCSV(arrayToTransform) {
            const stringGenerated = arrayToTransform.reduce((accumulator, current) =>
                accumulator + `,${current}`
                , '')
            return stringGenerated.substring(1)
        }

        async function getVariantsFromMagento(ids) {
            try {
                const result = await axios.get(
                    `http://magento.test/rest/V1/products?searchCriteria[filterGroups][0][filters][0][field]=entity_id&searchCriteria[filterGroups][0][filters][0][value]=${arrayToCSV(ids)}&searchCriteria[filterGroups][0][filters][0][conditionType]=in`,
                    {
                        httpsAgent: agent,
                        headers: options.headers,
                    }
                );
                return {
                    results: await CategoryController.transformMagentoProductsToStorefront(result.data['items']),
                    total_count: result.data['items'].length,
                };
            } catch (error) {
                console.log('error', error);
                // Explicit error handling
                throw error; // or return an error object as needed
            }
        }

        async function getVariantsFromBaseProduct(sku) {
            const baseProductSKU = sku.split('-')[0]
            try {
                const result = await axios.get(`http://localhost:80/rest/default/V1/products/${baseProductSKU}`,
                    {
                        httpsAgent: agent,
                        headers: options.headers,
                    }
                );
                return await getVariantsFromMagento(result.data.extension_attributes.configurable_product_links)
            } catch (error) {
                console.log('error', error);
                // Explicit error handling
                throw error; // or return an error object as needed
            }
        }

        function formatProductToVariant(product){
            return product.map((element) => {
                return  {
                    "id": element.id,
                    "sku": element.masterVariant.sku,
                    "prices": element.masterVariant.prices,
                    "images": element.masterVariant.images,
                    "attributes": element.masterVariant.attributes,
                    "slug": element.masterVariant.slug,
                    "name": element.masterVariant.name
                }
            })
        }
        // Helper function to format price
        function formatPrice(price) {
            return [{
                value: {
                    currencyCode: "USD", // Assuming USD as the currency
                    centAmount: Math.round(price * 100), // Convert price to cents
                },
            }
            ];
        }

        function formatImages(imageFile) {
            return [{
                url: `https://magento.test/media/catalog/product${imageFile}`
            }
            ]
        }

        // Function to extract label for a specific attribute value
        function getAttributeLabel(attributeMap, attributeCode, valueIndex) {
            if (!attributeMap[attributeCode]) return String(valueIndex);
            const value = attributeMap[attributeCode].values.find((v) => v.value_index === valueIndex);
            return value ? value.label : String(valueIndex);
        }

        const extensionAttributes = magentoProduct.extension_attributes || {};

        // Map Magento attributes into a more usable format
        const attributeMap = (extensionAttributes.configurable_product_options || []).reduce((acc, option) => {
            acc[option.label] = {
                id: option.attribute_id,
                values: option.values,
            };
            return acc;
        }, {});

        // Base product details
        const storefrontProduct = {
            id: String(magentoProduct.id), // Use Magento's product ID
            name: magentoProduct.name,
            description: magentoProduct.custom_attributes.find((attr) => attr.attribute_code === "description")?.value || "",
            slug: magentoProduct.custom_attributes.find((attr) => attr.attribute_code === "url_key")?.value || "",
            prices: formatPrice(magentoProduct.price),
            images: formatImages(magentoProduct.media_gallery_entries[0].file)[0],
            variants: [],
            masterVariant: null,
        };


        // Build the variants (loop through configurable product links)
        const linkIds = extensionAttributes.configurable_product_links || [];
        const variantsQuery = await getVariantsFromMagento(linkIds)
        storefrontProduct.variants = variantsQuery['results']

        // Assign the first variant as the master variant
        if (storefrontProduct.variants.length > 0) {
            storefrontProduct.masterVariant = storefrontProduct.variants[0];
        }

        if (storefrontProduct.variants.length === 0) {
            storefrontProduct.variants =  await (await getVariantsFromBaseProduct(magentoProduct.sku)).results
            storefrontProduct.variants = formatProductToVariant(storefrontProduct.variants)
            storefrontProduct.masterVariant = {
                "id": storefrontProduct.id,
                "sku": magentoProduct.sku,
                "prices": storefrontProduct.prices,
                "images": [storefrontProduct.images],
                "attributes": [
                    {
                        "name": "Color",
                        "value": {
                            "key": findAttributeByCode(magentoProduct.custom_attributes, "color"),                            
                            "label": await findColorLabelByValue(findAttributeByCode(magentoProduct.custom_attributes, "color"),agent,options) 
                        }
                    },
                    {
                        "name": "Size",
                        "value": {
                            "key": findAttributeByCode(magentoProduct.custom_attributes, "size"),
                            "label": await findSizeLabelByValue(findAttributeByCode(magentoProduct.custom_attributes, "size"),agent,options)
                        }
                    }
                ],
                "slug": "stellar-solar-jacket-s-blue",
                "name": "Stellar Solar Jacket-S-Blue"
            }
        }

        return storefrontProduct;
    }
}

exports.ProductController = ProductController