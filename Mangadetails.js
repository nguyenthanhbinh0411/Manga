document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    const chapterUrl = urlParams.get('chapter'); // Lấy URL của chương từ tham số
    const mangaApiUrl = `https://otruyenapi.com/v1/api/truyen-tranh/${slug}`;
    const newComicsApiUrl = "https://otruyenapi.com/v1/api/danh-sach/hoan-thanh";
    let chapters = [];
    let currentChapterIndex = 0;

    console.log('Slug:', slug);
    console.log('Chapter URL:', chapterUrl);

    // Fetch new comics data
    fetch(newComicsApiUrl)
        .then(response => {
            console.log('New Comics API Response Status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('New Comics Data:', data);
            if (data.status === "success") {
                const newComics = data.data.items.slice(0, 5); // Lấy 5 truyện mới đầu tiên
                console.log('New Comics:', newComics);
                const newComicsList = document.getElementById("new-comics-list");

                newComics.forEach(comic => {
                    const li = document.createElement("li");
                    const img = document.createElement("img");
                    img.src = `https://img.otruyenapi.com/uploads/comics/${comic.slug}-thumb.jpg`;
                    img.alt = comic.name;
                    img.title = comic.name;
                    li.appendChild(img);

                    const info = document.createElement("div");
                    info.classList.add("comic-info");
                    info.textContent = `${comic.name} - ${comic.status}`;
                    li.appendChild(info);

                    // Thêm sự kiện click vào mỗi item
                    li.addEventListener("click", () => {
                        console.log('Comic clicked:', comic.slug);
                        window.location.href = `MangaDetails.html?slug=${comic.slug}`; // Thay đổi link theo ý của bạn
                    });

                    newComicsList.appendChild(li);
                });

                // Xử lý nút Xem Thêm
                const loadMoreBtn = document.getElementById("load-more-btn");
                loadMoreBtn.addEventListener("click", () => {
                    const currentCount = newComicsList.children.length;
                    console.log('Current Comic Count:', currentCount);
                    const nextBatch = data.data.items.slice(currentCount, currentCount + 5);
                    console.log('Next Batch of Comics:', nextBatch);
                    
                    nextBatch.forEach(comic => {
                        const li = document.createElement("li");
                        const img = document.createElement("img");
                        img.src = `https://img.otruyenapi.com/uploads/comics/${comic.slug}-thumb.jpg`;
                        img.alt = comic.name;
                        img.title = comic.name;
                        li.appendChild(img);

                        const info = document.createElement("div");
                        info.classList.add("comic-info");
                        info.textContent = `${comic.name} - ${comic.status}`;
                        li.appendChild(info);

                        // Thêm sự kiện click vào mỗi item
                        li.addEventListener("click", () => {
                            console.log('Comic clicked:', comic.slug);
                            window.location.href = `comic-detail.html?slug=${comic.slug}`; // Thay đổi link theo ý của bạn
                        });

                        newComicsList.appendChild(li);
                    });

                    // Xóa nút Xem Thêm nếu không còn dữ liệu để hiển thị
                    if (newComicsList.children.length >= data.data.items.length) {
                        loadMoreBtn.style.display = "none";
                        console.log('No more comics to load. Hiding "Load More" button.');
                    }
                });

            } else {
                console.error('API response status not success:', data.status);
            }
        })
        .catch(error => console.error('Error fetching new comics data:', error));

    fetch(mangaApiUrl)
        .then(response => {
            console.log('Manga API Response Status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Manga Data:', data);
            if (data.status === "success") {
                const comic = data.data.item;
                chapters = comic.chapters[0].server_data;

                document.getElementById("comic-title").textContent = comic.name;
              
                const chapterDropdown = document.getElementById("chapter-dropdown");
                chapters.forEach((chapter, index) => {
                    const option = document.createElement("option");
                    option.value = index;
                    option.textContent = `Chương ${chapter.chapter_name}`;
                    chapterDropdown.appendChild(option);
                });

                chapterDropdown.addEventListener("change", () => {
                    currentChapterIndex = parseInt(chapterDropdown.value);
                    loadChapter(chapters[currentChapterIndex].chapter_api_data);
                    window.scrollTo(0, 0);
                });

                document.getElementById("prev-chapter").addEventListener("click", () => {
                    if (currentChapterIndex > 0) {
                        currentChapterIndex--;
                        chapterDropdown.value = currentChapterIndex;
                        loadChapter(chapters[currentChapterIndex].chapter_api_data);
                        window.scrollTo(0, 0);
                    }
                });

                document.getElementById("next-chapter").addEventListener("click", () => {
                    if (currentChapterIndex < chapters.length - 1) {
                        currentChapterIndex++;
                        chapterDropdown.value = currentChapterIndex;
                        loadChapter(chapters[currentChapterIndex].chapter_api_data);
                        window.scrollTo(0, 0);
                    }
                });

                // Set initial chapter based on URL parameter or default to first chapter
                if (chapterUrl) {
                    const initialChapter = chapters.find(chap => chap.chapter_api_data === decodeURIComponent(chapterUrl));
                    if (initialChapter) {
                        currentChapterIndex = chapters.indexOf(initialChapter);
                        chapterDropdown.value = currentChapterIndex;
                        loadChapter(initialChapter.chapter_api_data);
                    } else {
                        loadChapter(chapters[0].chapter_api_data);
                    }
                } else {
                    loadChapter(chapters[0].chapter_api_data);
                }
            } else {
                console.error('API response status not success:', data.status);
            }
        })
        .catch(error => {
            console.error('Error fetching manga data:', error);
            document.getElementById("comic-title").textContent = "Không tìm thấy truyện tranh.";
            document.getElementById("comic-description").textContent = "Lỗi: Không thể tải dữ liệu truyện tranh.";
        });

    function loadChapter(apiUrl) {
        console.log('Loading chapter from URL:', apiUrl); 
        fetch(apiUrl)
            .then(response => {
                console.log('Chapter API Response Status:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(chapterData => {
                console.log('Chapter API Response:', chapterData); 
                displayChapter(chapterData);
            })
            .catch(error => console.error('Error fetching chapter data:', error));
    }

    function displayChapter(data) {
        const chapterContent = document.getElementById("chapter-content");
        chapterContent.innerHTML = ''; 

        if (data.status === "success") {
            const chapter = data.data.item;
            const domainCdn = data.data.domain_cdn;
            const chapterPath = chapter.chapter_path;
            const chapterImages = chapter.chapter_image;

            chapterImages.forEach(image => {
                const img = document.createElement("img");
                img.src = `${domainCdn}/${chapterPath}/${image.image_file}`;
                img.alt = `Page ${image.image_page}`;
                chapterContent.appendChild(img);
            });
        } else {
            chapterContent.innerHTML = 'Không thể tải chương này.';
            console.error('API chapter response status not success:', data.status);
        }
    }
});
