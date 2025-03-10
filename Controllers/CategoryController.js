const { findAttributeByCode,findSizeLabelByValue,findColorLabelByValue } = require('../utils/utils.js')

const { agent,options } = require('../constants.js');

class CategoryController {

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
                                key: customAttributes.color,
                                label: await findColorLabelByValue(customAttributes.color,agent,options)
                            }
                        },
                        {
                            name: "Size",
                            value: {
                                key: customAttributes.size,
                                label: await findSizeLabelByValue(customAttributes.size,agent,options)
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
                                key: customAttributes.color,
                                label: await findColorLabelByValue(customAttributes.color,agent,options)
                            }
                        },
                        {
                            name: "Size",
                            value: {
                                key: customAttributes.size,
                                label: await findSizeLabelByValue(customAttributes.size,agent,options)
                            }
                        }
                    ],
                    slug: customAttributes.url_key,
                    name: product.name
                }
            };
        }));
    }
}

exports.CategoryController = CategoryController