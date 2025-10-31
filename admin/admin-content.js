// admin-content.js
class AdminContent {
    constructor(admin) {
        this.admin = admin;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Content Management
        document.getElementById('homepage-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveHomepageContent();
        });

        document.getElementById('promotion-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createPromotion();
        });

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });

        // Image Upload
        document.getElementById('add-hero-image').addEventListener('click', () => {
            this.addHeroImageField();
        });

        // Handle image file inputs
        document.addEventListener('change', (e) => {
            if (e.target.type === 'file' && e.target.classList.contains('image-upload')) {
                this.previewImage(e.target);
            }
        });
    }

    switchTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        document.getElementById(`${tabId}-tab`).classList.add('active');
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    }

    async loadContent() {
        try {
            const contentData = await this.admin.makeApiCall('/api/admin/content');
            this.renderContentData(contentData);
        } catch (error) {
            console.error('Error loading content:', error);
            this.admin.utils.showNotification('Error loading content', 'error');
        }
    }

    renderContentData(contentData) {
        // Render hero images
        this.renderHeroImages(contentData.hero_images || []);
        
        // Render promotions
        this.renderPromotions(contentData.promotions || []);
        
        // Render reviews
        this.renderReviews(contentData.reviews || []);
    }

    addHeroImageField() {
        const container = document.getElementById('hero-images-container');
        const imageId = Date.now();
        
        const imageField = document.createElement('div');
        imageField.className = 'image-upload-field';
        imageField.innerHTML = `
            <div class="image-upload-container">
                <div class="image-preview" id="preview-${imageId}">
                    <span>No image selected</span>
                </div>
                <div class="image-upload-controls">
                    <input type="file" 
                           class="image-upload" 
                           data-id="${imageId}"
                           accept="image/*" 
                           style="display: none;">
                    <button type="button" class="btn-secondary select-image-btn" data-target="${imageId}">
                        Select Image
                    </button>
                    <button type="button" class="btn-danger remove-image-btn" onclick="this.closest('.image-upload-field').remove()">
                        Remove
                    </button>
                    <div class="image-caption">
                        <input type="text" placeholder="Image caption (optional)" class="image-caption-input">
                    </div>
                    <div class="image-link">
                        <input type="text" placeholder="Link URL (optional)" class="image-link-input">
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(imageField);
        
        // Add click event for select image button
        imageField.querySelector('.select-image-btn').addEventListener('click', () => {
            imageField.querySelector('.image-upload').click();
        });
    }

    previewImage(fileInput) {
        const file = fileInput.files[0];
        const previewId = fileInput.dataset.id;
        const preview = document.getElementById(`preview-${previewId}`);
        
        if (file) {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <div class="image-info">
                        <small>${file.name}</small>
                        <small>${(file.size / 1024).toFixed(2)} KB</small>
                    </div>
                `;
            };
            
            reader.readAsDataURL(file);
        }
    }

    async saveHomepageContent() {
        try {
            const formData = new FormData();
            const heroImages = [];
            
            // Collect hero image data
            document.querySelectorAll('.image-upload-field').forEach((field, index) => {
                const fileInput = field.querySelector('.image-upload');
                const caption = field.querySelector('.image-caption-input').value;
                const link = field.querySelector('.image-link-input').value;
                
                if (fileInput.files[0]) {
                    formData.append(`hero_images[${index}][image]`, fileInput.files[0]);
                    formData.append(`hero_images[${index}][caption]`, caption);
                    formData.append(`hero_images[${index}][link]`, link);
                }
            });
            
            // Add other form data
            formData.append('featured_categories', JSON.stringify(this.getFeaturedCategories()));
            
            const response = await this.admin.makeApiCall('/api/admin/content/homepage', {
                method: 'POST',
                body: formData,
                // Remove Content-Type header for FormData (browser will set it automatically with boundary)
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('moya_admin_token')}`
                }
            });
            
            this.admin.utils.showNotification('Homepage content saved successfully', 'success');
            
        } catch (error) {
            console.error('Error saving homepage content:', error);
            this.admin.utils.showNotification('Error saving homepage content', 'error');
        }
    }

    getFeaturedCategories() {
        // Implement based on your categories structure
        return [];
    }

    async createPromotion() {
        const formData = new FormData();
        
        // Text fields
        formData.append('title', document.getElementById('promotion-title').value);
        formData.append('description', document.getElementById('promotion-desc').value);
        formData.append('discount_percent', document.getElementById('promotion-discount').value);
        
        // Promotion image
        const promoImageInput = document.getElementById('promotion-image');
        if (promoImageInput && promoImageInput.files[0]) {
            formData.append('image', promoImageInput.files[0]);
        }
        
        // Dates
        const expiryDate = document.getElementById('promotion-expiry');
        if (expiryDate && expiryDate.value) {
            formData.append('valid_until', expiryDate.value);
        }

        try {
            await this.admin.makeApiCall('/api/admin/promotions', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('moya_admin_token')}`
                }
            });

            this.admin.utils.showNotification('Promotion created successfully', 'success');
            document.getElementById('promotion-form').reset();
            
            // Clear image preview
            const preview = document.getElementById('promotion-image-preview');
            if (preview) {
                preview.innerHTML = '<span>No image selected</span>';
            }
            
        } catch (error) {
            console.error('Error creating promotion:', error);
            this.admin.utils.showNotification('Error creating promotion', 'error');
        }
    }

    renderHeroImages(images) {
        const container = document.getElementById('hero-images-container');
        container.innerHTML = '';
        
        images.forEach((image, index) => {
            const imageField = document.createElement('div');
            imageField.className = 'image-upload-field';
            imageField.innerHTML = `
                <div class="image-upload-container">
                    <div class="image-preview" id="preview-existing-${index}">
                        <img src="${image.url}" alt="${image.caption || 'Hero image'}">
                        <div class="image-info">
                            <small>Existing image</small>
                        </div>
                    </div>
                    <div class="image-upload-controls">
                        <input type="file" 
                               class="image-upload" 
                               data-id="existing-${index}"
                               accept="image/*" 
                               style="display: none;">
                        <button type="button" class="btn-secondary select-image-btn" data-target="existing-${index}">
                            Change Image
                        </button>
                        <button type="button" class="btn-danger remove-image-btn" onclick="this.closest('.image-upload-field').remove()">
                            Remove
                        </button>
                        <div class="image-caption">
                            <input type="text" placeholder="Image caption" 
                                   class="image-caption-input" value="${image.caption || ''}">
                        </div>
                        <div class="image-link">
                            <input type="text" placeholder="Link URL" 
                                   class="image-link-input" value="${image.link || ''}">
                        </div>
                    </div>
                </div>
            `;
            
            container.appendChild(imageField);
            
            // Add event listener for change image button
            imageField.querySelector('.select-image-btn').addEventListener('click', () => {
                imageField.querySelector('.image-upload').click();
            });
        });
    }

    renderPromotions(promotions) {
        const container = document.getElementById('active-promotions');
        container.innerHTML = promotions.map(promo => `
            <div class="promotion-card">
                <div class="promotion-image">
                    ${promo.image_url ? `<img src="${promo.image_url}" alt="${promo.title}">` : ''}
                </div>
                <div class="promotion-details">
                    <h4>${promo.title}</h4>
                    <p>${promo.description}</p>
                    <div class="promotion-meta">
                        <span class="discount">${promo.discount_percent}% OFF</span>
                        <span class="expiry">Valid until: ${this.admin.utils.formatDate(promo.valid_until)}</span>
                    </div>
                    <div class="promotion-actions">
                        <button class="btn-secondary" onclick="admin.contentModule.editPromotion(${promo.id})">Edit</button>
                        <button class="btn-danger" onclick="admin.contentModule.deletePromotion(${promo.id})">Delete</button>
                    </div>
                </div>
            </div>
        `).join('') || '<p>No active promotions</p>';
    }

    renderReviews(reviews) {
        const container = document.getElementById('reviews-list');
        container.innerHTML = reviews.map(review => `
            <div class="review-card">
                <div class="review-header">
                    <strong>${review.customer_name}</strong>
                    <span class="rating">⭐ ${review.rating}/5</span>
                </div>
                <p>${review.comment}</p>
                <div class="review-actions">
                    <button class="btn-secondary" onclick="admin.contentModule.approveReview(${review.id})">Approve</button>
                    <button class="btn-danger" onclick="admin.contentModule.deleteReview(${review.id})">Delete</button>
                </div>
            </div>
        `).join('') || '<p>No reviews to moderate</p>';
    }

    // Additional methods for promotions and reviews management
    async editPromotion(promotionId) {
        // Implement promotion editing
        console.log('Edit promotion:', promotionId);
    }

    async deletePromotion(promotionId) {
        if (confirm('Are you sure you want to delete this promotion?')) {
            try {
                await this.admin.makeApiCall(`/api/admin/promotions/${promotionId}`, {
                    method: 'DELETE'
                });
                this.admin.utils.showNotification('Promotion deleted successfully', 'success');
                this.loadContent(); // Refresh the list
            } catch (error) {
                console.error('Error deleting promotion:', error);
                this.admin.utils.showNotification('Error deleting promotion', 'error');
            }
        }
    }

    async approveReview(reviewId) {
        try {
            await this.admin.makeApiCall(`/api/admin/reviews/${reviewId}/approve`, {
                method: 'PUT'
            });
            this.admin.utils.showNotification('Review approved', 'success');
            this.loadContent(); // Refresh the list
        } catch (error) {
            console.error('Error approving review:', error);
            this.admin.utils.showNotification('Error approving review', 'error');
        }
    }

    async deleteReview(reviewId) {
        if (confirm('Are you sure you want to delete this review?')) {
            try {
                await this.admin.makeApiCall(`/api/admin/reviews/${reviewId}`, {
                    method: 'DELETE'
                });
                this.admin.utils.showNotification('Review deleted successfully', 'success');
                this.loadContent(); // Refresh the list
            } catch (error) {
                console.error('Error deleting review:', error);
                this.admin.utils.showNotification('Error deleting review', 'error');
            }
        }
    }
}