// ============================================
// PRODUCT DATABASE CLASS - UPDATED VERSION
// ============================================
class ProductDB {
    constructor() {
        this.storageKey = 'aymShopProducts';
        this.cartStorageKey = 'aymShopCart';
        this.wishlistStorageKey = 'aymShopWishlist';
        this.originalCartStorageKey = 'aymShopOriginalCart';
        this.products = [];
        this.categories = [];
        this.cart = []; // Cart is now empty by default
        this.wishlist = [];
        this.currentProductId = null;
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.currentSearchResults = [];
        this.currentCategory = 'all';
        this.isLoading = false;
        this.billSerial = null;
        this.customerInfo = {
            name: '',
            phone: '',
            address: ''
        };
    }
    
    async loadProductsFromAirtable() {
        try {
            console.log('در حال بارگیری محصولات از سرور...');
            
            // Use the API route instead of direct Airtable API
            const response = await fetch('/api/products');
            
            console.log('وضعیت پاسخ:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('متن خطا:', errorText);
                throw new Error(`خطا در پاسخ سرور: ${response.status} - ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ داده‌های دریافتی:', data);
            console.log(`📊 تعداد محصولات: ${data.products?.length || 0}`);
            
            if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
                console.warn('⚠️ هیچ محصولی پیدا نشد');
                this.products = [];
                this.currentSearchResults = [];
                this.saveProducts();
                return this.products;
            }
            
            this.products = data.products;
            
            console.log(`✅ ${this.products.length} محصول با موفقیت بارگیری شد`);
            
            this.currentSearchResults = [...this.products];
            this.saveProducts();
            
            return this.products;
            
        } catch (error) {
            console.error('❌ خطا در بارگیری محصولات:', error);
            throw error;
        }
    }
    
    getCategoryPlaceholder(category) {
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
    
    extractCategories() {
        const allCategories = this.products.map(p => p.category || 'عمومی');
        const uniqueCategories = ['همه', ...new Set(allCategories)];
        this.categories = uniqueCategories;
    }
    
    showLoading(show) {
        const loadingEl = document.getElementById('loading');
        const mainContainer = document.getElementById('mainContainer');
        
        if (loadingEl && mainContainer) {
            if (show) {
                loadingEl.style.display = 'flex';
                mainContainer.style.display = 'none';
            } else {
                loadingEl.style.display = 'none';
                mainContainer.style.display = 'block';
            }
        }
    }
    
    showLoadingError(show, message = '') {
        const loadingError = document.getElementById('loadingError');
        if (loadingError) {
            if (show) {
                loadingError.style.display = 'block';
                if (message) {
                    const errorText = loadingError.querySelector('p');
                    if (errorText) {
                        errorText.innerHTML = message;
                    }
                }
            } else {
                loadingError.style.display = 'none';
            }
        }
    }
    
    saveProducts() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.products));
        } catch (e) {
            console.error('خطا در ذخیره محصولات در حافظه محلی:', e);
        }
    }
    
    loadCart() {
        try {
            // Cart is always empty on page load
            return [];
        } catch (e) {
            console.error('خطا در بارگیری سبد خرید:', e);
            return [];
        }
    }
    
    loadWishlist() {
        try {
            const wishlist = localStorage.getItem(this.wishlistStorageKey);
            return wishlist ? JSON.parse(wishlist) : [];
        } catch (e) {
            console.error('خطا در بارگیری لیست علاقه‌مندی‌ها:', e);
            return [];
        }
    }
    
    saveCart() {
        try {
            localStorage.setItem(this.cartStorageKey, JSON.stringify(this.cart));
        } catch (e) {
            console.error('خطا در ذخیره سبد خرید:', e);
        }
    }
    
    saveWishlist() {
        try {
            localStorage.setItem(this.wishlistStorageKey, JSON.stringify(this.wishlist));
        } catch (e) {
            console.error('خطا در ذخیره لیست علاقه‌مندی‌ها:', e);
        }
    }
    
    saveOriginalCart() {
        try {
            localStorage.setItem(this.originalCartStorageKey, JSON.stringify(this.cart));
        } catch (e) {
            console.error('خطا در ذخیره سبد خرید اصلی:', e);
        }
    }
    
    getProductById(id) {
        return this.products.find(product => product.id === id);
    }
    
    searchProducts(query, category = this.currentCategory) {
        let filteredProducts = this.products;
        
        if (category !== 'all' && category !== 'همه') {
            filteredProducts = filteredProducts.filter(product => 
                product.category === category
            );
        }
        
        if (query && query.trim()) {
            const searchTerm = query.toLowerCase();
            filteredProducts = filteredProducts.filter(product => 
                (product.name && product.name.toLowerCase().includes(searchTerm)) || 
                (product.code && product.code.toLowerCase().includes(searchTerm)) ||
                (product.description && product.description.toLowerCase().includes(searchTerm)) ||
                (product.fullDescription && product.fullDescription.toLowerCase().includes(searchTerm))
            );
        }
        
        this.currentSearchResults = filteredProducts;
        this.currentCategory = category;
        
        return this.getPaginatedProducts();
    }
    
    getPaginatedProducts() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.currentSearchResults.slice(startIndex, endIndex);
    }
    
    getTotalPages() {
        return Math.ceil(this.currentSearchResults.length / this.itemsPerPage);
    }
    
    getWishlistProducts() {
        return this.products.filter(product => this.wishlist.includes(product.id));
    }
    
    formatNumberWithCommas(number) {
        return number ? number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
    }
    
    parsePrice(priceString) {
        if (!priceString) return 0;
        const cleanString = priceString.toString().replace(/[^\d,]/g, '').replace(/,/g, '');
        return parseInt(cleanString) || 0;
    }
    
    formatPrice(price) {
        if (typeof price === 'string') {
            const numericPart = this.parsePrice(price);
            const formattedNumber = this.formatNumberWithCommas(numericPart);
            return `${formattedNumber} افغانی`;
        }
        return `${this.formatNumberWithCommas(price)} افغانی`;
    }
    
    // Cart methods - REMOVED STOCK LIMIT
    addToCart(productId, quantity = 1) {
        const product = this.getProductById(productId);
        if (!product) return false;
        
        const existingItemIndex = this.cart.findIndex(item => item.id === productId);
        
        if (existingItemIndex !== -1) {
            // User can add unlimited quantity - removed stock check
            this.cart[existingItemIndex].quantity += quantity;
            this.saveCart();
            this.saveOriginalCart();
            return true;
        } else {
            // User can add unlimited quantity - removed stock check
            const cartItem = {
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: quantity,
                images: product.images,
                category: product.category
            };
            
            this.cart.push(cartItem);
            this.saveCart();
            this.saveOriginalCart();
            return true;
        }
    }
    
    // Wishlist methods
    toggleWishlist(productId) {
        const product = this.getProductById(productId);
        if (!product) return false;
        
        const index = this.wishlist.indexOf(productId);
        if (index !== -1) {
            this.wishlist.splice(index, 1);
        } else {
            this.wishlist.push(productId);
        }
        
        this.saveWishlist();
        return true;
    }
    
    removeFromWishlist(productId) {
        const index = this.wishlist.indexOf(productId);
        if (index !== -1) {
            this.wishlist.splice(index, 1);
            this.saveWishlist();
            return true;
        }
        return false;
    }
    
    isInWishlist(productId) {
        return this.wishlist.includes(productId);
    }
    
    getWishlistCount() {
        return this.wishlist.length;
    }
    
    updateCartQuantity(productId, quantity) {
        const product = this.getProductById(productId);
        if (!product) return false;
        
        const cartItemIndex = this.cart.findIndex(item => item.id === productId);
        if (cartItemIndex !== -1) {
            if (quantity <= 0) {
                this.cart.splice(cartItemIndex, 1);
            } else {
                // User can set any quantity - removed stock check
                this.cart[cartItemIndex].quantity = quantity;
            }
            
            this.saveCart();
            this.saveOriginalCart();
            return true;
        }
        return false;
    }
    
    removeFromCart(productId) {
        const index = this.cart.findIndex(item => item.id === productId);
        if (index !== -1) {
            this.cart.splice(index, 1);
            this.saveCart();
            this.saveOriginalCart();
            return true;
        }
        return false;
    }
    
    clearCart() {
        this.cart = [];
        this.saveCart();
        this.saveOriginalCart();
    }
    
    getCartItemCount() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }
    
    getCartTotal() {
        return this.cart.reduce((total, item) => {
            const price = this.parsePrice(item.price);
            return total + (price * item.quantity);
        }, 0);
    }
    
    checkout() {
        // For checkout, we still check stock
        let success = true;
        let outOfStockItems = [];
        
        for (const cartItem of this.cart) {
            const product = this.getProductById(cartItem.id);
            if (product && product.stock >= cartItem.quantity) {
                product.stock -= cartItem.quantity;
            } else {
                success = false;
                outOfStockItems.push(cartItem.name);
            }
        }
        
        if (success) {
            this.saveProducts();
            this.saveOriginalCart();
            return { success: true };
        }
        
        return { success: false, outOfStockItems };
    }
}