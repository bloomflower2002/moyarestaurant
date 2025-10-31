
document.getElementById('doneButton').addEventListener('click', function(){
    // Get last order from localStorage
    const lastOrder = JSON.parse(localStorage.getItem('lastOrder') || '{}');

    if(Object.keys(lastOrder).length > 0){
        // Get existing notifications or create new array
        const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');

        // Add the new receipt
        notifications.push({
            date: lastOrder.date,
            total: lastOrder.total,
            items: lastOrder.items
        });

        // Save back to localStorage
        localStorage.setItem('notifications', JSON.stringify(notifications));

        // Clear last order
        localStorage.removeItem('lastOrder');
    }

    // Redirect to index.html
    window.location.href = 'index.html';
 
});