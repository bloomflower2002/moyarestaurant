// admin-pagination.js
class AdminPagination {
    constructor(admin) {
        this.admin = admin;
        this.usersPagination = null;
        this.ordersPagination = null;
    }

    initializePagination() {
        // Users pagination container
        const usersContainer = document.createElement('div');
        usersContainer.id = 'users-pagination';
        usersContainer.className = 'pagination-container';
        document.querySelector('#users .users-table-container').after(usersContainer);

        // Orders pagination container
        const ordersContainer = document.createElement('div');
        ordersContainer.id = 'orders-pagination';
        ordersContainer.className = 'pagination-container';
        document.querySelector('#orders .orders-table-container').after(ordersContainer);

        // Users pagination
        this.usersPagination = new Pagination('users-pagination', {
            pageSize: this.admin.usersPageSize,
            onPageChange: (page) => {
                this.admin.currentUsersPage = page;
                this.admin.usersModule.loadUsers();
            }
        });

        // Orders pagination
        this.ordersPagination = new Pagination('orders-pagination', {
            pageSize: this.admin.ordersPageSize,
            onPageChange: (page) => {
                this.admin.currentOrdersPage = page;
                this.admin.ordersModule.loadOrders();
            }
        });
    }

    updateUsersPagination(data) {
        if (this.usersPagination) {
            this.usersPagination.update(data);
        }
    }

    updateOrdersPagination(data) {
        if (this.ordersPagination) {
            this.ordersPagination.update(data);
        }
    }
}

// Reusable Pagination Component
class Pagination {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.currentPage = 1;
        this.totalPages = 1;
        this.pageSize = options.pageSize || 25;
        this.onPageChange = options.onPageChange || (() => {});
        
        this.init();
    }

    init() {
        this.render();
    }

    update(data) {
        this.currentPage = data.currentPage;
        this.totalPages = data.totalPages;
        this.totalItems = data.totalItems;
        this.render();
    }

    render() {
        if (this.totalPages <= 1) {
            this.container.innerHTML = '';
            return;
        }

        this.container.innerHTML = this.generatePaginationHTML();
        this.attachEventListeners();
    }

    generatePaginationHTML() {
        const pages = this.generatePageNumbers();
        
        return `
            <div class="pagination">
                <button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                        data-page="1" ${this.currentPage === 1 ? 'disabled' : ''}>
                    « First
                </button>
                
                <button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                        data-page="${this.currentPage - 1}" ${this.currentPage === 1 ? 'disabled' : ''}>
                    ‹ Previous
                </button>

                ${pages.map(page => `
                    <button class="pagination-btn ${page === this.currentPage ? 'active' : ''} 
                            ${page === '...' ? 'disabled' : ''}" 
                            data-page="${page}" ${page === '...' ? 'disabled' : ''}>
                        ${page}
                    </button>
                `).join('')}

                <button class="pagination-btn ${this.currentPage === this.totalPages ? 'disabled' : ''}" 
                        data-page="${this.currentPage + 1}" ${this.currentPage === this.totalPages ? 'disabled' : ''}>
                    Next ›
                </button>
                
                <button class="pagination-btn ${this.currentPage === this.totalPages ? 'disabled' : ''}" 
                        data-page="${this.totalPages}" ${this.currentPage === this.totalPages ? 'disabled' : ''}>
                    Last »
                </button>

                <span class="pagination-info">
                    Page ${this.currentPage} of ${this.totalPages} 
                    (${this.totalItems} total items)
                </span>
            </div>
        `;
    }

    generatePageNumbers() {
        const pages = [];
        const maxVisiblePages = 5;
        
        if (this.totalPages <= maxVisiblePages) {
            for (let i = 1; i <= this.totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (this.currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(this.totalPages);
            } else if (this.currentPage >= this.totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = this.totalPages - 3; i <= this.totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(this.totalPages);
            }
        }
        
        return pages;
    }

    attachEventListeners() {
        this.container.querySelectorAll('.pagination-btn:not(.disabled)').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                if (page && page !== this.currentPage) {
                    this.currentPage = page;
                    this.onPageChange(page);
                }
            });
        });
    }
}