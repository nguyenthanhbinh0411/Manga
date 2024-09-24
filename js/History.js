document.addEventListener('DOMContentLoaded', function () {


    // Hiển thị lịch sử đọc truyện
    renderReadingHistory();

    // Khi người dùng click vào truyện, lưu lịch sử đọc
    document.addEventListener('click', function (e) {
        if (e.target.closest('.comic-item a')) {
            const comicLink = e.target.closest('.comic-item a');
            const comicSlug = comicLink.getAttribute('href').split('=')[1];
            const comicName = comicLink.querySelector('h3') ? comicLink.querySelector('h3').textContent : '';

            // Lưu lịch sử đọc
            saveReadingHistory(comicSlug, comicName);
        }
    });

    // Xóa mục lịch sử đọc khi nhấn nút xóa
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('delete-button')) {
            const slug = e.target.dataset.slug;
            removeFromReadingHistory(slug);
        }
    });
});

// Hàm lưu lịch sử đọc truyện vào localStorage
function saveReadingHistory(slug, name) {
    let history = JSON.parse(localStorage.getItem('readingHistory')) || [];

    // Kiểm tra nếu truyện đã có trong lịch sử, xóa truyện cũ để thêm mới vào đầu danh sách
    history = history.filter(item => item.slug !== slug);

    // Thêm truyện mới vào đầu danh sách
    history.unshift({ slug, name });

    // Giới hạn lịch sử đọc truyện là 5 mục
    if (history.length > 5) {
        history.pop();
    }

    // Lưu lại lịch sử vào localStorage
    localStorage.setItem('readingHistory', JSON.stringify(history));

    // Cập nhật lại hiển thị lịch sử đọc
    renderReadingHistory();
}

// Hàm xóa mục lịch sử đọc truyện
function removeFromReadingHistory(slug) {
    let history = JSON.parse(localStorage.getItem('readingHistory')) || [];
    history = history.filter(item => item.slug !== slug);
    localStorage.setItem('readingHistory', JSON.stringify(history));
    renderReadingHistory();
}

// Hàm hiển thị lịch sử đọc truyện
function renderReadingHistory() {
    const historyContainer = document.getElementById('reading-history');
    const history = JSON.parse(localStorage.getItem('readingHistory')) || [];

    historyContainer.innerHTML = '';

    if (history.length > 0) {
        history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';

            historyItem.innerHTML = `
                <img src="https://img.otruyenapi.com/uploads/comics/${item.slug}-thumb.jpg" alt="${item.name}" class="comic-thumbnail">
                <a href="TruyenDetails.html?slug=${encodeURIComponent(item.slug)}">
                    ${item.name}
                </a>
                <button class="delete-button" data-slug="${item.slug}">X</button>
            `;

            historyContainer.appendChild(historyItem);
        });
    } else {
        historyContainer.innerHTML = '<p>Chưa có truyện nào trong lịch sử đọc.</p>';
    }
}
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedSaveReadingHistory = debounce(saveReadingHistory, 300);
function isLocalStorageAvailable() {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
    } catch (e) {
        return false;
    }
}

// Sử dụng trong các hàm liên quan đến localStorage
if (isLocalStorageAvailable()) {
    // Thực hiện các thao tác với localStorage
} else {
    console.error('localStorage không khả dụng');
    // Xử lý thay thế hoặc thông báo cho người dùng
}