const { testCategory } = require('../constants.js')
class Formater {

    static transformCategoryData(categories) {
        // Helper function to recursively build the ancestor list
        function buildAncestors(node, ancestors = []) {
            if (node.parent_id && node.parent_id !== 1) { // 1 usually represents root in Magento                
                let parent = categories.find(cat => cat.id === node.parent_id);
                if(node.parent_id == 1)parent = null;
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

    static transformMagentoProductsToStorefront(magentoProducts) {
        let mappedProducts = {};
        // Helper function to add magento's url to relative url
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
    
        // Helper function to find attribute from custom attributes by code
        function findAttributeByCode(customAttributes, code) {
            const attr = customAttributes.find(attr => attr.attribute_code === code);
            return attr ? { key: attr.value, label: attr.value } : null;  // Simplified, usually label needs better mapping
        }

        function extractBaseSku(sku) {
            const match = sku.match(/^([A-Z0-9]+)-/);
            return match ? match[1] : null;
        }
    
        magentoProducts.forEach(product => {
            const customAttributes = mapCustomAttributes(product.custom_attributes);
            const baseSku = extractBaseSku(product.sku);
    
            // Skip product if base SKU could not be determined (unusual case)
            if (!baseSku) {
                return;
            }
    
            const variant = {
                id: String(product.id),
                sku: product.sku,
                prices: product.price,
                images: formatImages(customAttributes.image),
                attributes: [
                    {
                        name: "Color",
                        value: findAttributeByCode(product.custom_attributes, "color")
                    },
                    {
                        name: "Size",
                        value: findAttributeByCode(product.custom_attributes, "size")
                    }
                ],
                slug: customAttributes.url_key,
                name: product.name
            };
    
            if (!mappedProducts[baseSku]) {
                mappedProducts[baseSku] = {
                    id: baseSku,
                    name: product.name,
                    description: customAttributes.description || '',
                    slug: customAttributes.url_key,
                    variants: [],
                    masterVariant: variant  // Assuming the first encountered variant is the master (simplification)
                };
            }
    
            mappedProducts[baseSku].variants.push(variant);
        });
    
        // Convert the mapped products object to array
        return Object.values(mappedProducts);
    }
    
}

exports.Formater = Formater