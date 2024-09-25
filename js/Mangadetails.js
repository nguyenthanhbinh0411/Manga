document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    const chapterUrl = urlParams.get('chapter'); // Lấy URL của chương từ tham số
    const mangaApiUrl = `https://otruyenapi.com/v1/api/truyen-tranh/${slug}`;
    let chapters = [];
    let currentChapterIndex = 0;

    console.log('Slug:', slug);
    console.log('Chapter URL:', chapterUrl);

    // Fetch manga data
    fetch(mangaApiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === "success") {
                const manga = data.data.item;
                chapters = manga.chapters[0].server_data;

                // Cập nhật tiêu đề và breadcrumb
                updateTitleAndBreadcrumb(manga.name);

                const chapterDropdown = document.getElementById("chapter-dropdown");
                chapters.forEach((chapter, index) => {
                    const option = document.createElement("option");
                    option.value = index;
                    option.textContent = `Chương ${chapter.chapter_name}`;
                    chapterDropdown.appendChild(option);
                });

                chapterDropdown.addEventListener("change", () => {
                    currentChapterIndex = parseInt(chapterDropdown.value);
                    updateChapter(chapters[currentChapterIndex].chapter_api_data);
                    window.scrollTo(0, 0);
                });

                document.getElementById("prev-chapter").addEventListener("click", () => {
                    if (currentChapterIndex > 0) {
                        currentChapterIndex--;
                        chapterDropdown.value = currentChapterIndex;
                        updateChapter(chapters[currentChapterIndex].chapter_api_data);
                        window.scrollTo(0, 0);
                    }
                });

                document.getElementById("next-chapter").addEventListener("click", () => {
                    if (currentChapterIndex < chapters.length - 1) {
                        currentChapterIndex++;
                        chapterDropdown.value = currentChapterIndex;
                        updateChapter(chapters[currentChapterIndex].chapter_api_data);
                        window.scrollTo(0, 0);
                    }
                });

                // Set initial chapter based on URL parameter or default to first chapter
                if (chapterUrl) {
                    const initialChapter = chapters.find(chap => chap.chapter_api_data === decodeURIComponent(chapterUrl));
                    if (initialChapter) {
                        currentChapterIndex = chapters.indexOf(initialChapter);
                        chapterDropdown.value = currentChapterIndex;
                        updateChapter(initialChapter.chapter_api_data);
                    } else {
                        updateChapter(chapters[0].chapter_api_data);
                    }
                } else {
                    updateChapter(chapters[0].chapter_api_data);
                }
            } else {
                console.error('API response status not success:', data.status);
                const comicTitleElement = document.getElementById("comic-title");
                const chapterTitleElement = document.getElementById("chapter-title");
                if (comicTitleElement) comicTitleElement.textContent = "Không tìm thấy truyện tranh.";
                if (chapterTitleElement) chapterTitleElement.textContent = "";
            }
        })
        .catch(error => {
            console.error('Error fetching manga data:', error);
            const comicTitleElement = document.getElementById("comic-title");
            const chapterTitleElement = document.getElementById("chapter-title");
            if (comicTitleElement) comicTitleElement.textContent = "Không tìm thấy truyện tranh.";
            if (chapterTitleElement) chapterTitleElement.textContent = "";
        });

    function updateTitleAndBreadcrumb(mangaName) {
        const comicTitleElement = document.getElementById("comic-title");
        const mangaTitleBreadcrumbElement = document.getElementById("manga-title-breadcrumb");
        if (comicTitleElement) comicTitleElement.textContent = mangaName;
        if (mangaTitleBreadcrumbElement) mangaTitleBreadcrumbElement.textContent = mangaName;
    }
    function updateChapter(apiUrl) {
        console.log('Loading chapter from URL:', apiUrl);

        // Hiển thị loader khi bắt đầu tải
        document.getElementById("preloder").style.display = "flex"; // Hiện loader

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(chapterData => {
                displayChapter(chapterData);

                // Ẩn loader khi tải hoàn tất
                document.getElementById("preloder").style.display = "none";

                // Cập nhật breadcrumb và tiêu đề
                const currentChapter = chapters[currentChapterIndex];
                const chapterTitleBreadcrumbElement = document.getElementById('chapter-title-breadcrumb');
                const chapterTitleElement = document.getElementById('chapter-title');
                if (chapterTitleBreadcrumbElement) chapterTitleBreadcrumbElement.textContent = `Chương ${currentChapter.chapter_name}`;
                if (chapterTitleElement) chapterTitleElement.textContent = `Chương ${currentChapter.chapter_name}`;

                // Cập nhật URL và reload page
                const newUrl = `?slug=${slug}&chapter=${encodeURIComponent(currentChapter.chapter_api_data)}`;
                window.history.replaceState({}, '', newUrl);

                // Cập nhật nút điều hướng
                updateNavigationButtons();
            })
            .catch(error => {
                console.error('Error fetching chapter data:', error);
                // Ẩn loader khi có lỗi
                document.getElementById("preloder").style.display = "none";
            });
    }
    function displayChapter(data) {
        const chapterContent = document.getElementById("chapter-content");
        if (chapterContent) {
            chapterContent.innerHTML = ''; // Xóa nội dung cũ
    
            if (data.status === "success") {
                const chapter = data.data.item;
                const domainCdn = data.data.domain_cdn;
                const chapterPath = chapter.chapter_path;
                const chapterImages = chapter.chapter_image;
    
                chapterImages.forEach((image, index) => {
                    // Tạo phần tử loader cho mỗi hình ảnh
                    const loader = document.createElement("div");
                    loader.className = "loader"; // Giả sử bạn đã có CSS cho loader
                    loader.textContent = ""; // Nội dung loader
                    chapterContent.appendChild(loader); // Thêm loader vào chapterContent
    
                    // Tạo phần tử img và đặt thuộc tính src
                    const img = document.createElement("img");
                    img.src = `${domainCdn}/${chapterPath}/${image.image_file}`;
                    img.alt = `Page ${image.image_page}`;
                    img.loading = "lazy"; // Lazy loading
    
                    // Ẩn hình ảnh cho đến khi nó được tải
                    img.style.display = 'none'; 
    
                    // Thêm sự kiện onload để ẩn loader khi hình ảnh đã tải xong
                    img.onload = () => {
                        img.style.display = 'block'; // Hiển thị hình ảnh
                        loader.style.display = 'none'; // Ẩn loader
                    };
    
                    img.onerror = () => {
                        // Xử lý lỗi nếu hình ảnh không tải được
                        console.error(`Error loading image: ${img.src}`);
                        loader.textContent = 'Lỗi tải hình ảnh'; // Thông báo lỗi
                    };
    
                    // Thêm hình ảnh vào chapterContent
                    chapterContent.appendChild(img);
                });
            } else {
                chapterContent.innerHTML = 'Không thể tải chương này.';
                console.error('API chapter response status not success:', data.status);
            }
        }
    }
    
    function updateNavigationButtons() {
        const prevButton = document.getElementById("prev-chapter");
        const nextButton = document.getElementById("next-chapter");

        if (prevButton) {
            prevButton.style.display = (currentChapterIndex > 0) ? "inline-block" : "none";
            prevButton.disabled = (currentChapterIndex === 0); // Vô hiệu hóa nút nếu là chương đầu
        }

        if (nextButton) {
            nextButton.style.display = (currentChapterIndex < chapters.length - 1) ? "inline-block" : "none";
            nextButton.disabled = (currentChapterIndex === chapters.length - 1); // Vô hiệu hóa nút nếu là chương cuối
        }
    }

});
// Mega menu functionality for genre
async function populateMegaMenu(genres) {
    const genreButtons = document.getElementById('genre-buttons');
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
                window.location.href = `index.html?genre=${genre.slug}`;
            });
            column.appendChild(a);
        }

        genreButtons.appendChild(column);
    }
}

// Fetch and populate genres when page loads
async function fetchAndPopulateGenres() {
    try {
        const genresUrl = 'https://otruyenapi.com/v1/api/the-loai';
        const genresResponse = await fetch(genresUrl);
        const genresResult = await genresResponse.json();
        const genresData = genresResult.data;

        if (genresData && genresData.items && Array.isArray(genresData.items)) {
            populateMegaMenu(genresData.items);
        } else {
            console.error('Dữ liệu thể loại không hợp lệ:', genresResult);
        }
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu thể loại:', error);
    }
}

fetchAndPopulateGenres();
