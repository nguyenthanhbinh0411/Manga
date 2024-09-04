const comicList = document.getElementById('comic-list');
        const pagination = document.getElementById('pagination');
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        const typeSelect = document.getElementById('type-select');
        const genreDropdown = document.getElementById('genreDropdown');
        const genreButtons = document.getElementById('genre-buttons');
        const errorMessage = document.getElementById('error-message');
        const preloader = document.getElementById('preloder');

        let currentPage = 1;
        let searchKeyword = '';
        let selectedType = '';
        let selectedGenre = '';
        const slider = document.getElementById('slider');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        let offset = 0;
        let slideWidth = 100 / 6; // Mặc định 6 items trên màn hình lớn
        let interval;

        async function fetchSliderComics() {
            try {
                const response = await fetch('https://otruyenapi.com/v1/api/danh-sach/sap-ra-mat');
                const result = await response.json();
                const comics = result.data.items;

                slider.innerHTML = '';
                comics.forEach(comic => {
                    const comicItem = document.createElement('div');
                    comicItem.classList.add('slider-item');
                    comicItem.innerHTML = `
                        <a href="TruyenDetails.html?slug=${comic.slug}">
                            <img src="https://img.otruyenapi.com/uploads/comics/${comic.slug}-thumb.jpg" alt="${comic.name}">
                            <h3>${comic.name}</h3>
                        </a>
                    `;
                    comicItem.querySelector('a').addEventListener('click', (e) => {
                        e.preventDefault();
                        saveReadingHistory(comic.slug, comic.name);
                        window.location.href = `TruyenDetails.html?slug=${comic.slug}`;
                    });

                    slider.appendChild(comicItem);
                });

                updateSlideWidth();
                startAutoSlide();
            } catch (error) {
                console.error('Lỗi khi tải dữ liệu slider:', error);
            }
        }

        function slideNext() {
            const maxOffset = -(slider.children.length - getItemsToShow()) * slideWidth;
            if (offset > maxOffset) {
                offset -= slideWidth;
                slider.style.transform = `translateX(${offset}%)`;
            } else {
                offset = 0;
                slider.style.transform = `translateX(${offset}%)`;
            }
        }

        function slidePrev() {
            if (offset < 0) {
                offset += slideWidth;
                slider.style.transform = `translateX(${offset}%)`;
            }
        }

        function startAutoSlide() {
            interval = setInterval(() => {
                slideNext();
            }, 3000); // Thay đổi mỗi 3 giây
        }

        function stopAutoSlide() {
            clearInterval(interval);
        }

        function updateSlideWidth() {
            if (window.innerWidth <= 480) {
                slideWidth = 100 / 2; // 2 items trên màn hình nhỏ
            } else if (window.innerWidth <= 768) {
                slideWidth = 100 / 3;  // 3 items trên tablet
            } else {
                slideWidth = 100 / 6;  // 6 items trên màn hình lớn
            }
        }

        function getItemsToShow() {
            if (window.innerWidth <= 480) {
                return 2;
            } else if (window.innerWidth <= 768) {
                return 3;
            } else {
                return 6;
            }
        }

        nextBtn.addEventListener('click', () => {
            stopAutoSlide();
            slideNext();
            startAutoSlide();
        });

        prevBtn.addEventListener('click', () => {
            stopAutoSlide();
            slidePrev();
            startAutoSlide();
        });

        fetchSliderComics(); // Gọi khi trang được tải

        // Cập nhật slideWidth khi thay đổi kích thước cửa sổ
        window.addEventListener('resize', () => {
            updateSlideWidth();
            slider.style.transform = `translateX(${offset}%)`; // Đảm bảo transform được cập nhật
        });
        function showLoader() {
            preloader.style.display = 'flex';
        }

        function hideLoader() {
            preloader.style.display = 'none';
        }

        async function fetchComics(page, keyword = '', type = '', genre = '') {
            showLoader();
            try {
                let url = '';
                if (keyword) {
                    url = `https://otruyenapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}`;
                } else if (genre) {
                    url = `https://otruyenapi.com/v1/api/the-loai/${encodeURIComponent(genre)}?page=${page}`;
                } else if (type) {
                    url = `https://otruyenapi.com/v1/api/danh-sach/${type}?page=${page}`;
                } else {
                    url = `https://otruyenapi.com/v1/api/danh-sach/dang-phat-hanh?page=${page}`;
                }
                console.log('Fetching comics with URL:', url);
                const response = await fetch(url);
                const result = await response.json();
                const data = result.data;

                if (data && data.items && Array.isArray(data.items)) {
                    await renderComics(data.items);
                    const paginationData = data.params && data.params.pagination ? data.params.pagination : {};
                    setupPagination(paginationData);

                    if (genreButtons.children.length === 0) {
                        const genresUrl = 'https://otruyenapi.com/v1/api/the-loai';
                        const genresResponse = await fetch(genresUrl);
                        const genresResult = await genresResponse.json();
                        const genresData = genresResult.data;

                        console.log('Genres data:', genresData);
                        if (genresData && genresData.items && Array.isArray(genresData.items)) {
                            populateMegaMenu(genresData.items);
                        } else {
                            console.error('Dữ liệu trả về không có mảng "items" hoặc không phải là mảng:', genresData.items);
                        }
                    }
                } else {
                    console.error("Dữ liệu trả về không có mảng 'items' hoặc không phải là mảng:", data.items);
                    errorMessage.textContent = 'Không có dữ liệu truyện.';
                }
            } catch (error) {
                console.error("Đã xảy ra lỗi khi fetch dữ liệu:", error);
                errorMessage.textContent = 'Không thể tải dữ liệu truyện.';
            } finally {
                hideLoader();
                window.scrollTo(0, 0); // Cuộn về đầu trang sau khi tải dữ liệu xong
            }
        }

        async function fetchLatestChapters(slug) {
            try {
                const response = await fetch(`https://otruyenapi.com/v1/api/truyen-tranh/${slug}`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                if (data?.data?.item?.chapters?.[0]?.server_data) {
                    const allChapters = data.data.item.chapters[0].server_data;
                    return allChapters.slice(-1);  // Lấy chương mới nhất
                }
                return [];
            } catch (error) {
                console.error("Lỗi khi lấy chương mới:", error);
                return [];
            }
        }
        async function fetchIsekaiComics() {
            try {
                const response = await fetch('https://otruyenapi.com/v1/api/the-loai/chuyen-sinh');

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                return result.data.items.slice(0, 6); // Lấy 5 truyện đầu tiên
            } catch (error) {
                console.error('Lỗi khi tải dữ liệu truyện chuyển sinh:', error.message || error);
                return [];
            }
        }
        async function renderIsekaiComics(comics) {
            const isekaiList = document.getElementById('isekai-list');

            // Kiểm tra xem comics có phải là mảng và có dữ liệu hay không
            if (!Array.isArray(comics) || comics.length === 0) {
                isekaiList.innerHTML = '<p>Không có truyện chuyển sinh nào để hiển thị.</p>';
                return;
            }

            // Tạo và thêm các mục truyện chuyển sinh vào danh sách
            for (const comic of comics) {
                const comicItem = document.createElement('div');
                comicItem.className = 'isekai-list';

                let latestChapterHtml = '';
                let updatedDateHtml = '';
                try {
                    const latestChapters = await fetchLatestChapters(comic.slug);
                    if (Array.isArray(latestChapters) && latestChapters.length > 0) {
                        const latestChapter = latestChapters[0];
                        latestChapterHtml = `
                            <a href="MangaDetails.html?slug=${comic.slug}&chapter=${encodeURIComponent(latestChapter.chapter_api_data)}">
                                Chương ${latestChapter.chapter_name}
                            </a>
                        `;
                    }
                    updatedDateHtml = `<p style="font-size: 12px;"><i>Cập nhật: ${formatDate(comic.updatedAt)}</i></p>`;
                } catch (error) {
                    console.error(`Lỗi khi lấy chương mới cho ${comic.slug}:`, error);
                }

                // Sử dụng template literals để đảm bảo tính nhất quán của mã HTML
                comicItem.innerHTML = `
                    <div class="isekai-list">
                            <div class="row">
                                <div class="col-md-4">
                                    <img src="https://img.otruyenapi.com/uploads/comics/${encodeURIComponent(comic.slug)}-thumb.jpg" alt="${comic.name}" class="comic-thumbnail">
                                </div>
                                <div class="col-md-8">
                                        <a href="TruyenDetails.html?slug=${encodeURIComponent(comic.slug)}" class="comic-link">
                                    <h5 class="comic-title" title="${comic.name}">${comic.name}</h5>
                                        </a>
                                   <div class="latest-chapters">
                                     <h4>Mới nhất:${latestChapterHtml}</h4>
                                    </div>
                                    <div class="latest-chapters">
                                    <i>${updatedDateHtml}</i>
                                    </div>
                                </div>
                            </div>
                     
                    </div>
                `;

                const comicLink = comicItem.querySelector('.comic-link');
                comicLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    saveReadingHistory(comic.slug, comic.name);
                    window.location.href = comicLink.href;
                });


                // Thêm mục truyện vào danh sách
                isekaiList.appendChild(comicItem);
            }
        }



        function formatDate(dateString) {
            const options = {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            };
            const date = new Date(dateString);
            return date.toLocaleDateString('vi-VN', options);
        }

        async function renderComics(comics) {
            const comicList = document.getElementById('comic-list');
            if (!comicList) {
                console.error('comic-list element không tồn tại.');
                return;
            }

            comicList.innerHTML = '';

            const comicPromises = comics.map(async (comic) => {
                const comicItem = document.createElement('div');
                let chapterHtml = '';
                try {
                    const latestChapters = await fetchLatestChapters(comic.slug);
                    if (Array.isArray(latestChapters) && latestChapters.length > 0) {
                        const latestChapter = latestChapters[0];
                        chapterHtml = `
                            <a class="comic-title" href="MangaDetails.html?slug=${comic.slug}&chapter=${encodeURIComponent(latestChapter.chapter_api_data)}">
                                Chương ${latestChapter.chapter_name}
                            </a>
                            <p style="font-size: 12px;"><i>Cập nhật: ${formatDate(comic.updatedAt)}</i></p>
                        `;
                    }
                } catch (error) {
                    console.error(`Lỗi khi fetch latest chapters cho ${comic.slug}:`, error);
                }

                comicItem.innerHTML = `
                    <div class="comic-item" data-comic-slug="${comic.slug}">
                        <a href="TruyenDetails.html?slug=${comic.slug}">
                            <img src="https://img.otruyenapi.com/uploads/comics/${comic.slug}-thumb.jpg" alt="${comic.name}">
                            <h3 class="comic-title mt-2" title="${comic.name}">${comic.name}</h3>
                        </a>
                        <div class="latest-chapters">
                         <h4>Mới nhất:${chapterHtml}</h4>
                        </div>
                    </div>
                `;

                comicList.appendChild(comicItem);

                const comicElement = comicItem.querySelector('.comic-title');
                comicElement.addEventListener('mouseenter', (e) => showComicTooltip(e, comic));
                comicElement.addEventListener('mouseleave', hideComicTooltip);
            });

            await Promise.all(comicPromises);
        }

        async function showComicTooltip(event, comic) {
            hideComicTooltip();

            const tooltip = document.createElement('div');
            tooltip.className = 'comic-tooltip';

            const comicDetails = await fetchComicDetails(comic.slug);

            if (!comicDetails) {
                tooltip.innerHTML = '<p>Lỗi tải thông tin truyện.</p>';
            } else {
                const thumbUrl = comic.thumb_url ? `https://img.otruyenapi.com/uploads/comics/${comic.thumb_url}` : 'default-thumbnail.jpg';
                const authors = comicDetails.author && comicDetails.author.length ? comicDetails.author.join(', ') : 'Không rõ';
                const categories = comicDetails.category && comicDetails.category.length ? comicDetails.category.map(cat => cat.name).join(', ') : 'Không có thông tin';
                const description = comicDetails.content ? comicDetails.content.substring(0, 100) : 'Không có mô tả';

                tooltip.innerHTML = `
                    <div style="display: flex; align-items: flex-start;">
                        <img src="${thumbUrl}" alt="${comic.name}" style="width: 100px; height: auto; margin-right: 10px;">
                        <div>
                            <p><strong>${comic.name}</strong></p>
                            <p><strong>Trạng thái:</strong> ${getStatusInVietnamese(comicDetails.status)}</p>
                            <p><strong>Tác giả:</strong> ${authors}</p>
                            <p><strong>Thể loại:</strong> ${categories}</p>
                            <p><strong>Cập nhật lần cuối:</strong> ${formatDate(comicDetails.updatedAt)}</p>
                            <p><strong></strong> ${description}...</p>
                        </div>
                    </div>
                `;
            }

            document.body.appendChild(tooltip);
            const rect = event.target.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();

            const left = rect.left + window.scrollX + rect.width + 20;
            const top = rect.top + window.scrollY;

            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
            tooltip.style.display = 'block';
        }

        function hideComicTooltip() {
            const tooltip = document.querySelector('.comic-tooltip');
            if (tooltip) {
                tooltip.remove();
            }
        }

        function getStatusInVietnamese(status) {
            switch (status) {
                case 'ongoing':
                    return 'Đang tiến hành';
                case 'completed':
                    return 'Hoàn thành';
                default:
                    return 'Không rõ';
            }
        }

        async function fetchComicDetails(slug) {
            try {
                const response = await fetch(`https://otruyenapi.com/v1/api/truyen-tranh/${slug}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                return data.data.item;
            } catch (error) {
                console.error('Error fetching comic details:', error);
                return null;
            }
        }

        function setupPagination(paginationData) {
            pagination.innerHTML = '';
            const currentPage = paginationData.currentPage || 1;
            const totalItems = paginationData.totalItems || 1;
            const itemsPerPage = paginationData.itemsPerPage || 1;
            const totalPages = Math.ceil(totalItems / itemsPerPage);

            if (totalPages > 1) {
                const paginationControls = document.createElement('ul');
                paginationControls.className = 'pagination justify-content-center';

                // Prev button
                if (currentPage > 1) {
                    const prevItem = document.createElement('li');
                    prevItem.className = 'page-item';
                    prevItem.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true">&laquo;</span></a>`;
                    prevItem.addEventListener('click', () => {
                        fetchComics(currentPage - 1, searchKeyword, selectedType, selectedGenre);
                    });
                    paginationControls.appendChild(prevItem);
                }

                // Page buttons
                const startPage = Math.max(1, currentPage - 3);
                const endPage = Math.min(totalPages, currentPage + 3);
                for (let page = startPage; page <= endPage; page++) {
                    const pageItem = document.createElement('li');
                    pageItem.className = `page-item ${page === currentPage ? 'active' : ''}`;
                    pageItem.innerHTML = `<a class="page-link" href="#">${page}</a>`;
                    pageItem.addEventListener('click', (event) => {
                        event.preventDefault();
                        fetchComics(page, searchKeyword, selectedType, selectedGenre);
                    });
                    paginationControls.appendChild(pageItem);
                }

                // Ellipsis if there are more pages
                if (endPage < totalPages) {
                    const ellipsisItem = document.createElement('li');
                    ellipsisItem.className = 'page-item disabled';
                    ellipsisItem.innerHTML = `<span class="page-link">...</span>`;
                    paginationControls.appendChild(ellipsisItem);
                }

                // Last page button
                if (totalPages > endPage) {
                    const lastPageItem = document.createElement('li');
                    lastPageItem.className = 'page-item';
                    lastPageItem.innerHTML = `<a class="page-link" href="#">${totalPages}</a>`;
                    lastPageItem.addEventListener('click', (event) => {
                        event.preventDefault();
                        fetchComics(totalPages, searchKeyword, selectedType, selectedGenre);
                    });
                    paginationControls.appendChild(lastPageItem);
                }

                // Next button
                if (currentPage < totalPages) {
                    const nextItem = document.createElement('li');
                    nextItem.className = 'page-item';
                    nextItem.innerHTML = `<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true">&raquo;</span></a>`;
                    nextItem.addEventListener('click', () => {
                        fetchComics(currentPage + 1, searchKeyword, selectedType, selectedGenre);
                    });
                    paginationControls.appendChild(nextItem);
                }

                pagination.appendChild(paginationControls);
            }
        }

        function populateMegaMenu(genres) {
            genreButtons.innerHTML = '';
            const numColumns = 4;
            const itemsPerColumn = Math.ceil(genres.length / numColumns);

            for (let i = 0; i < numColumns; i++) {
                const column = document.createElement('div');
                column.className = 'genre-column';

                for (let j = i * itemsPerColumn; j < (i + 1) * itemsPerColumn && j < genres.length; j++) {
                    const genre = genres[j];
                    const a = document.createElement('a');
                    a.className = 'btn genre-button';
                    a.textContent = genre.name;
                    a.addEventListener('click', () => {
                        selectedGenre = genre.slug;
                        searchKeyword = '';
                        currentPage = 1;
                        fetchComics(currentPage, searchKeyword, selectedType, selectedGenre);
                        document.querySelector('.mega-menu').classList.remove('show');
                    });
                    column.appendChild(a);
                }

                genreButtons.appendChild(column);
            }
        }


        document.addEventListener('DOMContentLoaded', async () => {
            fetchComics(currentPage);


            // Fetch và render truyện chuyển sinh
            const isekaiComics = await fetchIsekaiComics();
            renderIsekaiComics(isekaiComics);

            // ... (phần code còn lại giữ nguyên)

            searchBtn.addEventListener('click', () => {
                searchKeyword = searchInput.value.trim();
                selectedType = '';
                selectedGenre = '';
                currentPage = 1;
                fetchComics(currentPage, searchKeyword);
            });

            typeSelect.addEventListener('change', () => {
                selectedType = typeSelect.value;
                searchKeyword = '';
                selectedGenre = '';
                currentPage = 1;
                fetchComics(currentPage, searchKeyword, selectedType, selectedGenre);
            });

            genreDropdown.addEventListener('mouseenter', () => {
                document.querySelector('.mega-menu').classList.add('show');
            });

            document.querySelector('.dropdown').addEventListener('mouseleave', () => {
                document.querySelector('.mega-menu').classList.remove('show');
            });

            document.querySelectorAll('.filter-container a').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    selectedType = link.dataset.type;
                    selectedGenre = '';
                    searchKeyword = '';
                    currentPage = 1;
                    fetchComics(currentPage, '', selectedType);
                });
            });

            const genreSelect = document.getElementById('genre-select');
            if (genreSelect) {
                genreSelect.addEventListener('change', () => {
                    selectedGenre = genreSelect.value;
                    selectedType = '';
                    searchKeyword = '';
                    currentPage = 1;
                    fetchComics(currentPage, '', '', selectedGenre);
                });
            }
        });
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
        const comics = [
            {
                slug: 'tao-muon-tro-thanh-chua-te-bong-toi',
                img: 'img/shadow.jpg',
                content: 'Tao Muốn Trở Thành Chúa Tể Bóng Tối!! là một manga được chuyển thể từ Light Novel cùng tên. Câu chuyện xoay quanh một cậu trai tên là Shido, người luôn mơ ước trở thành chúa tể bóng tối. Shido không phải là nhân vật chính hay trùm cuối, mà là người điều khiển câu chuyện từ trong bóng tối, bí mật phô bày năng lực của mình.'
            },
            { slug: 'arya-ban-ben-thinh-thoang-lai-treu-gheo-toi-bang-tieng-nga', img: 'img/arya.jpg' },
            { slug: 'otonari-no-tenshi-sama-ni-itsunomanika-dame-ningen-ni-sareteita-ken', img: 'img/mahiru.jpg', name: 'Thiên sứ nhà bên' },
            { slug: 'kishuku-gakkou-no-juliet', img: 'img/juliet.png' },
            { slug: 'that-nghiep-chuyen-sinh-lam-lai-het-suc', img: 'img/roxy.jpg' }
        ];
        
        function getStatusInVietnamese(status) {
            switch (status) {
                case 'ongoing':
                    return 'Đang tiến hành';
                case 'completed':
                    return 'Đã hoàn thành';
                default:
                    return 'Chưa xác định';
            }
        }
        
        function formatDate(timestamp) {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(timestamp).toLocaleDateString('vi-VN', options);
        }
        
        async function fetchComicData(slug) {
            const response = await fetch(`https://otruyenapi.com/v1/api/truyen-tranh/${slug}/`);
            return await response.json();
        }
        
        async function populateSlider() {
            const slider = document.getElementById('comicSlider');
            const dotsContainer = document.getElementById('dotsContainer');
        
            for (let comic of comics) {
                const comicData = await fetchComicData(comic.slug);
                if (comicData.status === 'success') {
                    const comicItem = comicData.data.item;
                    const chapters = comicItem.chapters[0].server_data;
        
                    const authors = comicItem.author ? comicItem.author.join(', ') : 'Không rõ tác giả';
                    const categories = comicItem.category ? comicItem.category.map(cat => cat.name).join(', ') : 'Không rõ thể loại';
        
                    const firstChapter = chapters && chapters.length > 0 ? chapters[0].chapter_api_data : null;
                    const lastChapter = chapters && chapters.length > 0 ? chapters[chapters.length - 1].chapter_api_data : null;
        
                    const sliderItem = document.createElement('div');
                    sliderItem.className = 'slider2-item';
                    sliderItem.innerHTML = `
                        <img src="${comic.img}" alt="${comicItem.name}">
                        <div class="comic-info">
                            <h2><strong>${comic.name || comicData.data.item.name}</strong></h2>
                            <p><strong>Thể loại:</strong> ${categories}</p>
                            <p><strong>Cập nhật lần cuối:</strong> <span>${formatDate(comicData.data.seoOnPage.updated_time)}</span></p>
                            <h7><strong></strong> ${comic.slug === 'tao-muon-tro-thanh-chua-te-bong-toi' ? comic.content : comicItem.content || comicData.data.item.content}</h7>
                            <div class="button-container">
                                ${lastChapter ? `<a href="MangaDetails.html?slug=${comic.slug}&chapter=${encodeURIComponent(lastChapter)}">Đọc ngay</a>` : ''}
                            </div>
                        </div>
                    `;
                    slider.appendChild(sliderItem);
        
                    const dot = document.createElement('div');
                    dot.className = 'dot';
                    dot.dataset.index = slider.children.length - 1;
                    dotsContainer.appendChild(dot);
                } else {
                    console.error(`Không thể lấy dữ liệu truyện: ${comic.slug}. Thông báo: ${comicData.message}`);
                }
            }
        
            const dots = document.querySelectorAll('.dot');
            dots[0].classList.add('active'); // Set first dot as active
        
            const updateDots = () => {
                const index = Math.round(slider.scrollLeft / slider.clientWidth);
                dots.forEach(dot => dot.classList.remove('active'));
                if (dots[index]) {
                    dots[index].classList.add('active');
                }
            };
        
            slider.addEventListener('scroll', updateDots);
        
            dots.forEach(dot => {
                dot.addEventListener('click', () => {
                    slider.scrollTo({
                        left: dot.dataset.index * slider.clientWidth,
                        behavior: 'smooth'
                    });
                });
            });
        
            // Auto-scroll functionality
            let currentIndex = 0;
            const totalSlides = slider.children.length;
            const slideInterval = 5000; // Interval in milliseconds
        
            setInterval(() => {
                currentIndex = (currentIndex + 1) % totalSlides;
                slider.scrollTo({
                    left: currentIndex * slider.clientWidth,
                    behavior: 'smooth'
                });
            }, slideInterval);
        }
        
        populateSlider();
        