const axios = require("axios");

/**
 * Convert an array to a CSV string.
 *
 * @param {Array} arrayToTransform - The array to be converted.
 * @returns {string} The CSV string.
 */
function arrayToCSV(arrayToTransform) {
    const stringGenerated = arrayToTransform.reduce(
        (accumulator, current) => accumulator + `,${current}`,
        ""
    );
    return stringGenerated.substring(1);
}

/**
 * Fetch variants from Magento by their IDs.
 *
 * @param {Array} ids - The IDs of the products to fetch.
 * @param {Object} agent - HTTPS Agent to handle requests.
 * @param {Object} options - Axios headers and configuration.
 * @param {Object} Formater - Formater class for transformation logic.
 * @returns {Promise<Object>} The result object containing variants and total count.
 */
async function getVariantsFromMagento(ids, agent, options, Formater) {
    try {
        const result = await axios.get(
            `http://magento.test/rest/V1/products?searchCriteria[filterGroups][0][filters][0][field]=entity_id&searchCriteria[filterGroups][0][filters][0][value]=${arrayToCSV(ids)}&searchCriteria[filterGroups][0][filters][0][conditionType]=in`,
            {
                httpsAgent: agent,
                headers: options.headers,
            }
        );

        const transformedResults = await Formater.transformMagentoProductsToStorefront(
            result.data["items"]
        );

        console.log({
            results: transformedResults,
            total_count: result.data["items"].length,
        });

        return {
            results: transformedResults,
            total_count: result.data["items"].length,
        };
    } catch (error) {
        console.error("Error in getVariantsFromMagento:", error);
        throw error;
    }
}

/**
 * Fetch variants using a product's SKU and return them.
 *
 * @param {string} sku - The parent product's SKU.
 * @param {Object} agent - HTTPS Agent to handle requests.
 * @param {Object} options - Axios headers and configuration.
 * @param {Object} Formater - Formater class for transformation logic.
 * @returns {Promise<Object>} The variants data.
 */
async function getVariantsFromBaseProduct(sku, agent, options, Formater) {
    const baseProductSKU = sku.split("-")[0];
    try {
        const result = await axios.get(
            `http://localhost:80/rest/default/V1/products/${baseProductSKU}`,
            {
                httpsAgent: agent,
                headers: options.headers,
            }
        );

        console.log({
            results: Formater.transformMagentoProductToStorefront(result.data),
        });

        return await getVariantsFromMagento(
            result.data.extension_attributes.configurable_product_links,
            agent,
            options,
            Formater
        );
    } catch (error) {
        console.error("Error in getVariantsFromBaseProduct:", error);
        throw error;
    }
}

/**
 * Format a product into a variant structure.
 *
 * @param {Array} product - The product data to format.
 * @returns {Array} The formatted variant.
 */
function formatProductToVariant(product) {
    return product.map((element) => {
        return {
            id: element.id,
            sku: element.masterVariant.sku,
            prices: element.masterVariant.prices,
            images: element.masterVariant.images,
            attributes: element.masterVariant.attributes,
            slug: element.masterVariant.slug,
            name: element.masterVariant.name,
        };
    });
}

/**
 * Format a price object for the storefront.
 *
 * @param {number} price - The product price.
 * @returns {Array} The formatted price object.
 */
function formatPrice(price) {
    return [
        {
            value: {
                currencyCode: "USD", // Assuming USD as the currency
                centAmount: Math.round(price * 100), // Convert price to cents
            },
        },
    ];
}

/**
 * Format image URLs for the storefront.
 *
 * @param {string} imageFile - The image file name.
 * @returns {Array} The formatted image object.
 */
function formatImages(imageFile) {
    return [
        {
            url: `https://magento.test/media/catalog/product${imageFile}`,
        },
    ];
}

/**
 * Get the label for a specific attribute value.
 *
 * @param {Object} attributeMap - The map of attributes.
 * @param {string} attributeCode - The code of the attribute to get.
 * @param {number|string} valueIndex - The index of the attribute's value.
 * @returns {string} The label of the attribute.
 */
function getAttributeLabel(attributeMap, attributeCode, valueIndex) {
    if (!attributeMap[attributeCode]) return String(valueIndex);

    const value = attributeMap[attributeCode].values.find(
        (v) => v.value_index === valueIndex
    );

    return value ? value.label : String(valueIndex);
}

/**
 * Finds an attribute by its code in a list of custom attributes.
 * 
 * This function searches through an array of custom attributes for an attribute whose
 * `attribute_code` matches the given `code`. If found, it returns an object containing
 * the `key` and `label`, both derived from the attribute's value. If not found, it returns `null`.
 * 
 * @param {Array} customAttributes - An array of custom attribute objects. Each object should have an `attribute_code` field.
 * @param {string} code - The code of the attribute to search for.
 * 
 * @returns {Object|null} - Returns an object with the structure:
 *   {
 *     key: string,  // The value of the found attribute.
 *     label: string // The same value as the key (simplified).
 *   }
 *   Returns `null` if no attribute with the given code is found.
 */
function findAttributeByCode(customAttributes, code) {
    const attr = customAttributes.find(attr => attr.attribute_code === code);
    return attr ? attr.value : null;  // Simplified, usually label needs better mapping
}

async function findSizeLabelByValue(value,agent,options) {
    console.log('Size label ', value)
    try {
        const label = await axios.get('https://magento.test/rest/V1/products/attributes/size',
            {
                httpsAgent: agent,
                headers: options.headers,
            }
        );                            
        return label.data.options.find((Element) => Element.value === value).label;
    } catch (error) {
        console.log(error)
        return 'N/A'
    }
}

async function findColorLabelByValue(value,agent,options) {
    console.log('Color label ', value)
    try {
        const label = await axios.get('https://magento.test/rest/V1/products/attributes/color',
            {
                httpsAgent: agent,
                headers: options.headers,
            }
        );                
        
        return label.data.options.find((Element) => Element.value === value).label;
    } catch (error) {
        console.log(error)
        return 'N/A'
    }
}

// Export all utility functions as named exports
module.exports = {
    arrayToCSV,
    getVariantsFromMagento,
    getVariantsFromBaseProduct,
    formatProductToVariant,
    formatPrice,
    formatImages,
    getAttributeLabel,
    findAttributeByCode,
    findSizeLabelByValue,
    findColorLabelByValue
};