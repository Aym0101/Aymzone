// api/products.js
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
        const AIRTABLE_BASE_ID = 'app6l7wwHD0gaZ78F';
        const TABLE_NAME = 'aym7';
        
        const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_NAME}`;
        
        const response = await fetch(airtableUrl, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Airtable API Error:', response.status, errorText);
            throw new Error(`Airtable API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        const products = [];
        
        for (const record of data.records) {
            const fields = record.fields || {};
            
            if (!fields['نام'] && !fields['Name'] && !fields['Product Name']) {
                console.warn(`Record ${record.id} has no name, skipping`);
                continue;
            }
            
            const product = {
                id: record.id,
                name: fields['نام'] || fields['Name'] || fields['Product Name'] || 'محصول بدون نام',
                code: fields['کود'] || fields['Code'] || fields['Product Code'] || `CODE-${record.id.substring(0, 4)}`,
                description: fields['توضیح'] || fields['Description'] || fields['توضیحات'] || 'بدون توضیح',
                fullDescription: fields['توضیح کامل'] || fields['Full Description'] || fields['توضیحات کامل'] || 
                               fields['توضیح'] || fields['Description'] || fields['توضیحات'] || 'بدون توضیح',
                price: fields['قیمت'] || fields['Price'] || fields['قیمت (افغانی)'] || '0 افغانی',
                stock: parseInt(fields['موجودی'] || fields['Stock'] || fields['تعداد'] || 0),
                category: fields['دسته‌بندی'] || fields['Category'] || fields['دسته'] || 'عمومی',
                images: []
            };
            
            // Process attachment fields
            const processAttachmentField = (attachmentField) => {
                if (!attachmentField) return [];
                
                const images = [];
                
                if (Array.isArray(attachmentField)) {
                    attachmentField.forEach(attachment => {
                        if (attachment && attachment.url) {
                            images.push(attachment.url);
                        }
                    });
                }
                else if (attachmentField.url) {
                    images.push(attachmentField.url);
                }
                
                return images;
            };
            
            let foundImages = [];
            
            Object.keys(fields).forEach(fieldName => {
                const fieldValue = fields[fieldName];
                
                if (fieldName.toLowerCase().includes('image') ||
                    fieldName.toLowerCase().includes('photo') ||
                    fieldName.toLowerCase().includes('pic') ||
                    fieldName.toLowerCase().includes('تصویر') ||
                    fieldName.toLowerCase().includes('عکس') ||
                    (Array.isArray(fieldValue) && fieldValue[0] && fieldValue[0].url)) {
                    
                    const extracted = processAttachmentField(fieldValue);
                    foundImages = [...foundImages, ...extracted];
                }
            });
            
            product.images = [...new Set(foundImages)];
            
            if (product.images.length === 0) {
                const emoji = getCategoryPlaceholder(product.category);
                const placeholderUrl = `https://via.placeholder.com/400x300/3949ab/FFFFFF?text=${encodeURIComponent(emoji + ' ' + product.name.substring(0, 15))}`;
                product.images.push(placeholderUrl);
            }
            
            products.push(product);
        }
        
        // Cache control headers
        res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
        
        return res.status(200).json({
            success: true,
            count: products.length,
            products: products
        });
        
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to fetch products from Airtable'
        });
    }
}

function getCategoryPlaceholder(category) {
    const categoryEmojis = {
        'آرایشی و بهداشتی': '💄',
        'مراقبت مو': '🧴',
        'مراقبت پوست': '🧴',
        'بهداشتی': '🧼',
        'لوازم آرایشی': '💅',
        'عطر': '🌸',
        'کرم': '🧴',
        'شامپو': '🧴',
        'صابون': '🧼',
        'لوازم خانگی': '🏠',
        'لباس': '👕',
        'کفش': '👟',
        'اکسسوری': '👜',
        'لوازم الکترونیکی': '📱',
        'کتاب': '📚',
        'اسباب بازی': '🧸',
        'خوراکی': '🍎',
        'عمومی': '📦'
    };
    
    return categoryEmojis[category] || '📦';
}
