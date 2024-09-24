const urlParams = new URLSearchParams(window.location.search);
const slug = urlParams.get('slug');
const selectedGenre = urlParams.get('genre'); // Lấy thể loại từ URL
const slider = document.getElementById('slider');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
let offset = 0;
const slideWidth = 100 / 6; // Mỗi lần cuộn 1/6 của thanh slider

async function fetchComicDetails(slug) {
    const response = await fetch(`https://otruyenapi.com/v1/api/truyen-tranh/${slug}`);
    const data = await response.json();
    return data;
}

async function fetchUpcomingComics() {
    const response = await fetch('https://otruyenapi.com/v1/api/danh-sach/sap-ra-mat');
    const data = await response.json();
    return data;
}

function formatDate(dateString) {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    };

    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', options);
}

function getStatusInVietnamese(status) {
    switch (status) {
        case 'ongoing':
            return 'Đang phát hành';
        case 'completed':
            return 'Đã hoàn thành';
        case 'coming_soon':
            return 'Sắp ra mắt';
        default:
            return 'Không xác định';
    }
}

function renderComicDetails(comic) {
    const detailContainer = document.getElementById('comic-detail');
    const chapters = comic.chapters[0].server_data;

    detailContainer.querySelector('.main-content').innerHTML = `
        <div class="comic-header">
            <h2>${comic.name}</h2>
        </div>
        <div class="comic-content">
            <img src="https://img.otruyenapi.com/uploads/comics/${comic.thumb_url}" alt="${comic.name}">
            <div class="details">
                <p><strong>Trạng thái:</strong> ${getStatusInVietnamese(comic.status)}</p>
                <p><strong>Tác giả:</strong> ${comic.author.join(', ')}</p>
                <p><strong>Thể loại:</strong> ${comic.category.map(cat => cat.name).join(', ')}</p>
                <p id="update-time"><strong>Cập nhật lần cuối:</strong> <span id="updatedAt">${formatDate(comic.updatedAt)}</span></p>
                <p><strong>Mô tả:</strong> ${comic.content}</p>
                <div class="button-container">
                    <a href="MangaDetails.html?slug=${slug}&chapter=${encodeURIComponent(chapters[0].chapter_api_data)}">Đọc từ đầu</a>
                    <a href="MangaDetails.html?slug=${slug}&chapter=${encodeURIComponent(chapters[chapters.length - 1].chapter_api_data)}">Đọc chương mới nhất</a>
                </div>
            </div>
        </div>
        <div class="nd">
            <h4 style="margin-top: 15px;">Nội dung chính: <strong>${comic.name}</strong></h4>
            <p>${comic.content}</p>
        </div>
        <h2 style="margin-top: 15px;"><strong>Danh sách các chương:</strong></h2>
        <div class="chapter-list-container">  
            <div class="chapter-list">
                <ul>
                    ${chapters
                        .sort((a, b) => {
                            const chapterA = parseInt(a.chapter_name.match(/\d+/)[0], 10);
                            const chapterB = parseInt(b.chapter_name.match(/\d+/)[0], 10);
                            return chapterB - chapterA;
                        })
                        .map(chapter => `
                            <li>
                                <a href="MangaDetails.html?slug=${slug}&chapter=${encodeURIComponent(chapter.chapter_api_data)}">
                                    Chương ${chapter.chapter_name} 
                                </a>
                            </li>
                        `).join('')}
                </ul>
            </div>
        </div>
    `;
}

function renderUpcomingComics(comics) {
    const upcomingComicsEl = document.getElementById('upcoming-comics');

    upcomingComicsEl.innerHTML = comics.slice(0, 5).map((comic, index) => `
        <li>
            <img src="https://img.otruyenapi.com/uploads/comics/${comic.slug}-thumb.jpg" alt="${comic.name}">
            <a href="TruyenDetails.html?slug=${comic.slug}" data-slug="${comic.slug}" data-name="${comic.name}">${comic.name}</a>
        </li>
    `).join('');

    const comicLinks = upcomingComicsEl.querySelectorAll('a');
    comicLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const slug = e.target.getAttribute('data-slug');
            const name = e.target.getAttribute('data-name');
            saveReadingHistory(slug, name);
            window.location.href = e.target.href;
        });
    });
}

async function loadComicDetails() {
    const comicData = await fetchComicDetails(slug);
    renderComicDetails(comicData.data.item);
}

async function loadUpcomingComics() {
    const upcomingData = await fetchUpcomingComics();
    renderUpcomingComics(upcomingData.data.items);
}

async function fetchSliderComics() {
    try {
        const response = await fetch('https://otruyenapi.com/v1/api/danh-sach/hoan-thanh');
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
            slider.appendChild(comicItem);
        });
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu slider:', error);
    }
}

function slideNext() {
    const maxOffset = -(slider.children.length - 6) * slideWidth;
    if (offset > maxOffset) {
        offset -= slideWidth;
        slider.style.transform = `translateX(${offset}%)`;
    }
}

function slidePrev() {
    if (offset < 0) {
        offset += slideWidth;
        slider.style.transform = `translateX(${offset}%)`;
    }
}

nextBtn.addEventListener('click', slideNext);
prevBtn.addEventListener('click', slidePrev);

fetchSliderComics();
loadComicDetails();
loadUpcomingComics();

document.querySelectorAll('.filter-container a').forEach(link => {
    link.addEventListener('click', function (event) {
        event.preventDefault();
        const type = this.getAttribute('data-type');
        window.location.href = `index.html?type=${type}`;
    });
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