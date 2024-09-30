document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    const chapterUrl = urlParams.get('chapter');
    const mangaApiUrl = `https://otruyenapi.com/v1/api/truyen-tranh/${slug}`;
    let chapters = [];
    let currentChapterIndex = 0;

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
                showError("Không tìm thấy truyện tranh.");
            }
        })
        .catch(showError);

    function showError(error) {
        console.error(error);
        const comicTitleElement = document.getElementById("comic-title");
        const chapterTitleElement = document.getElementById("chapter-title");
        if (comicTitleElement) comicTitleElement.textContent = "Không tìm thấy truyện tranh.";
        if (chapterTitleElement) chapterTitleElement.textContent = "";
    }

    function updateTitleAndBreadcrumb(mangaName) {
        const comicTitleElement = document.getElementById("comic-title");
        const mangaTitleBreadcrumbElement = document.getElementById("manga-title-breadcrumb");
        if (comicTitleElement) comicTitleElement.textContent = mangaName;
        if (mangaTitleBreadcrumbElement) mangaTitleBreadcrumbElement.textContent = mangaName;
    }

    function updateChapter(apiUrl) {
        console.log('Loading chapter from URL:', apiUrl);

        // Hiển thị loader khi bắt đầu tải
        document.getElementById("preloder").style.display = "flex"; 

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(chapterData => {
                displayChapter(chapterData);

                document.getElementById("preloder").style.display = "none";

                const currentChapter = chapters[currentChapterIndex];
                updateBreadcrumbAndTitle(currentChapter.chapter_name);

                const newUrl = `?slug=${slug}&chapter=${encodeURIComponent(currentChapter.chapter_api_data)}`;
                window.history.replaceState({}, '', newUrl);

                updateNavigationButtons();
            })
            .catch(error => {
                console.error('Error fetching chapter data:', error);
                document.getElementById("preloder").style.display = "none";
            });
    }

    function updateBreadcrumbAndTitle(chapterName) {
        const chapterTitleBreadcrumbElement = document.getElementById('chapter-title-breadcrumb');
        const chapterTitleElement = document.getElementById('chapter-title');
        if (chapterTitleBreadcrumbElement) chapterTitleBreadcrumbElement.textContent = `Chương ${chapterName}`;
        if (chapterTitleElement) chapterTitleElement.textContent = `Chương ${chapterName}`;
    }

    function displayChapter(data) {
        const chapterContent = document.getElementById("chapter-content");
        if (chapterContent) {
            chapterContent.innerHTML = ''; // Clear previous chapter content
    
            if (data.status === "success") {
                const chapter = data.data.item;
                const domainCdn = data.data.domain_cdn;
                const chapterPath = chapter.chapter_path;
                const chapterImages = chapter.chapter_image;
    
                // Tạo mảng các Promise để tải trước tất cả ảnh
                const imagePromises = chapterImages.map(image => {
                    const imageUrl = `${domainCdn}/${chapterPath}/${image.image_file}`;
                    return preloadImageWithPromise(imageUrl).then(() => {
                        const img = document.createElement("img");
                        img.src = imageUrl;
                        img.alt = `Page ${image.image_page}`;
                        img.style.display = 'block';
                        return img; // Trả về thẻ img sau khi tải xong
                    });
                });
    
                // Chờ tất cả ảnh tải xong rồi mới thêm vào DOM
                Promise.all(imagePromises)
                    .then(images => {
                        images.forEach(img => chapterContent.appendChild(img));
                    })
                    .catch(error => {
                        console.error('Error loading images:', error);
                        chapterContent.innerHTML = 'Không thể tải chương này.';
                    });
            } else {
                chapterContent.innerHTML = 'Không thể tải chương này.';
            }
        }
    }
    
    function preloadImageWithPromise(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = resolve;
            img.onerror = reject;
        });
    }
    
    function updateNavigationButtons() {
        const prevButton = document.getElementById("prev-chapter");
        const nextButton = document.getElementById("next-chapter");

        if (prevButton) {
            prevButton.style.display = (currentChapterIndex > 0) ? "inline-block" : "none";
            prevButton.disabled = (currentChapterIndex === 0);
        }

        if (nextButton) {
            nextButton.style.display = (currentChapterIndex < chapters.length - 1) ? "inline-block" : "none";
            nextButton.disabled = (currentChapterIndex === chapters.length - 1);
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
