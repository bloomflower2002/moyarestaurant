// admin-menu.js
class AdminMenu {
    constructor(admin) {
        this.admin = admin;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Menu Management
        document.getElementById('add-menu-item').addEventListener('click', () => {
            this.openMenuModal();
        });

        document.getElementById('menu-item-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveMenuItem();
        });
    }

    async loadMenuItems() {
        try {
            const data = await this.admin.makeApiCall('/api/admin/menu');
            this.admin.menuItems = data.menu || data;
            this.renderMenuItems();
            
        } catch (error) {
            console.error('Error loading menu items:', error);
            this.admin.utils.showNotification('Error loading menu items', 'error');
        }
    }

    renderMenuItems() {
        const grid = document.getElementById('menu-items-grid');
        
        if (this.admin.menuItems.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <p>No menu items found. Add your first item!</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = this.admin.menuItems.map(item => `
            <div class="menu-item-card">
                <img src="${this.getImageUrl(item.image_url)}" 
                     alt="${item.name}" 
                     class="menu-item-image"
                     onerror="this.src='/admin/images/placeholder.jpg'">
                <div class="menu-item-info">
                    <h3>${item.name}</h3>
                    <p>${item.description}</p>
                    <div class="menu-item-details">
                        <strong>$${parseFloat(item.price).toFixed(2)}</strong>
                        <span class="category">${item.category_name}</span>
                        <span class="availability ${item.is_available ? 'available' : 'unavailable'}">
                            ${item.is_available ? 'Available' : 'Unavailable'}
                        </span>
                    </div>
                    <div class="menu-item-actions">
                        <button class="btn-secondary" onclick="admin.menuModule.editMenuItem(${item.id})">Edit</button>
                        <button class="btn-danger" onclick="admin.menuModule.deleteMenuItem(${item.id})">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getImageUrl(imagePath) {
        if (!imagePath) {
            return this.createDataURIPlaceholder();
        }
        
        if (imagePath.startsWith('data:')) {
            return imagePath;
        }
        
        if (imagePath.startsWith('image/')) {
            return `/${imagePath}`;
        }
        
        return imagePath;
    }

    createDataURIPlaceholder() {
        const svg = `<svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f8f9fa"/>
            <rect x="10%" y="10%" width="80%" height="60%" fill="#e9ecef" rx="5"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" 
                  fill="#6c757d" text-anchor="middle" dominant-baseline="middle">
                No Image
            </text>
        </svg>`;
        
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    async editMenuItem(itemId) {
        try {
             const response = await this.admin.makeApiCall(`/api/admin/menu/${itemId}`);
             const itemData = response.menu || response;
            this.openMenuModal(itemData);
        } catch (error) {
            console.error('Error loading menu item:', error);
            this.admin.utils.showNotification('Error loading menu item', 'error');
        }
    }

    openMenuModal(item = null) {
        const modal = document.getElementById('menu-item-modal');
        const title = document.getElementById('modal-title');
        const form = document.getElementById('menu-item-form');
        
        if (item) {
            title.textContent = 'Edit Menu Item';
            this.populateMenuForm(item);
        } else {
            title.textContent = 'Add Menu Item';
            form.reset();
        }
        
        modal.style.display = 'block';
    }

    populateMenuForm(item) {
        document.getElementById('menu-item-id').value = item.id;
        document.getElementById('item-name').value = item.name;
        document.getElementById('item-desc').value = item.description;
        document.getElementById('item-price').value = item.price;
        document.getElementById('item-category').value = item.category_name;
        document.getElementById('item-image').value = item.image_url || '';
        document.getElementById('item-available').value = item.is_available ? 'true' : 'false';
    }

    async saveMenuItem() {
        const formData = {
            id: document.getElementById('menu-item-id').value || null,
            name: document.getElementById('item-name').value,
            description: document.getElementById('item-desc').value,
            price: parseFloat(document.getElementById('item-price').value),
            category_name: document.getElementById('item-category').value,
            image_url: document.getElementById('item-image').value || null,
            is_available: document.getElementById('item-available').value === 'true'
        };

        try {
            let response;
            if (formData.id) {
                response = await this.admin.makeApiCall(`/api/admin/menu/${formData.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
            } else {
                response = await this.admin.makeApiCall('/api/admin/menu', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
            }

            this.admin.utils.showNotification('Menu item saved successfully', 'success');
            document.getElementById('menu-item-modal').style.display = 'none';
            this.loadMenuItems();
        } catch (error) {
            console.error('Error saving menu item:', error);
            this.admin.utils.showNotification('Error saving menu item', 'error');
        }
    }

    async deleteMenuItem(itemId) {
        if (!confirm('Are you sure you want to delete this menu item?')) return;

        try {
            await this.admin.makeApiCall(`/api/admin/menu/${itemId}`, {
                method: 'DELETE'
            });

            this.admin.utils.showNotification('Menu item deleted successfully', 'success');
            this.loadMenuItems();
        } catch (error) {
            console.error('Error deleting menu item:', error);
            this.admin.utils.showNotification('Error deleting menu item', 'error');
        }
    }
}