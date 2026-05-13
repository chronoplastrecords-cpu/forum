
        const storageKey = 'chronoplastBands';

        function getQueryParam(name) {
            const params = new URLSearchParams(window.location.search);
            return params.get(name);
        }

        function getBands() {
            return JSON.parse(localStorage.getItem(storageKey) || '[]').map((band) => ({
                ...band,
                albums: band.albums || [],
            }));
        }

        function saveBands(bands) {
            localStorage.setItem(storageKey, JSON.stringify(bands));
        }

        function getBandBySlug(slug) {
            return getBands().find((band) => band.slug === slug);
        }

        function getAlbumBySlug(slug) {
            for (const band of getBands()) {
                const album = (band.albums || []).find((albumItem) => albumItem.slug === slug);
                if (album) return { album, band };
            }
            return null;
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function slugify(text) {
            return text
                .toString()
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
        }

        function createUniqueAlbumSlug(band, title, existingSlug = '') {
            const base = slugify(`${band.slug}-${title}`) || 'album';
            const used = new Set(
                getBands()
                    .flatMap((b) => b.albums || [])
                    .map((album) => album.slug)
                    .filter(Boolean)
            );
            if (existingSlug) {
                used.delete(existingSlug);
            }
            let slug = base;
            let counter = 1;
            while (used.has(slug)) {
                slug = `${base}-${counter++}`;
            }
            return slug;
        }

        function createBandPageHtml(band) {
            const name = escapeHtml(band.name);
            const genre = escapeHtml(band.genre);
            const country = escapeHtml(band.country);
            const years = escapeHtml(band.years);
            const status = escapeHtml(band.status.charAt(0).toUpperCase() + band.status.slice(1));
            const members = escapeHtml(band.members || 'N/A');
            const description = escapeHtml(band.description).replace(/\n/g, '<br>');
            const slug = escapeHtml(band.slug);
            const albumListHtml = (band.albums || [])
                .map((album) => `\n                    <div class="album-card">\n                        <h3>${escapeHtml(album.title)} <span class="band-status active">${escapeHtml(album.type)}</span></h3>\n                        <p class="band-meta">${escapeHtml(album.year)} • ${escapeHtml(album.label)} • ${escapeHtml(album.format)}</p>\n                        <p class="band-description">${escapeHtml(album.description)}</p>\n                    </div>\n                `)
                .join('');

            return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name} - Chronoplast Records</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="crypt.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Manufacturing+Consent&display=swap" rel="stylesheet">
</head>
<body>
    <h1>Chronoplast Records Official Site</h1>
    <div class="image-strip">
        <img src="pics/207.jpg" alt="Record 1">
        <img src="pics/928.jpg" alt="Record 2">
        <img src="pics/3094.jpg" alt="Record 3">
        <img src="pics/2746.jpg" alt="Record 4">
        <img src="pics/16395.jpg" alt="Record 5">
    </div>
    <div class="tabs">
        <div class="tab-row">
            <a href="index.html" class="tab">Home</a>
            <a href="forum.html" class="tab">Forum</a>
            <a href="crypt.html" class="tab">The Crypt</a>
            <button class="tab active">Band Page</button>
        </div>
    </div>
    <div class="archives-container">
        <div class="band-detail-view">
            <h2>${name}</h2>
            <div class="band-detail-meta">
                <div class="meta-item"><div class="meta-label">Genre</div><div>${genre}</div></div>
                <div class="meta-item"><div class="meta-label">Country</div><div>${country}</div></div>
                <div class="meta-item"><div class="meta-label">Years Active</div><div>${years}</div></div>
                <div class="meta-item"><div class="meta-label">Status</div><div><span class="band-status ${band.status}">${status}</span></div></div>
            </div>
            <div class="meta-item" style="grid-column: 1 / -1;"><div class="meta-label">Current Members</div><div>${members}</div></div>
            <div class="band-detail-description">${description}</div>
            <div class="album-section">
                <h3>Discography</h3>
                <div class="album-list">${albumListHtml || '<div class="empty-state">No albums yet. Add one below.</div>'}</div>
            </div>
            <div class="band-actions">
                <button class="edit-button" id="download-band-page">Download Band HTML</button>
                <a class="back-button" href="crypt.html">Back to archive</a>
            </div>
        </div>
    </div>
</body>
</html>`;
        }

        function downloadBandPage(band) {
            const html = createBandPageHtml(band);
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${band.slug || 'band'}.html`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }

        function editAlbum(index) {
            const band = getBandBySlug(getQueryParam('band'));
            if (!band) return;
            const album = band.albums[index];
            if (!album) return;

            document.getElementById('album-title').value = album.title;
            document.getElementById('album-year').value = album.year;
            document.getElementById('album-type').value = album.type;
            document.getElementById('album-label').value = album.label;
            document.getElementById('album-format').value = album.format;
            document.getElementById('album-description').value = album.description;
            const albumForm = document.getElementById('album-form');
            albumForm.dataset.edit = 'true';
            albumForm.dataset.editIndex = index;
            document.getElementById('album-form-button').textContent = 'Update Album';
            document.getElementById('cancel-album-edit').classList.remove('hidden');
            document.getElementById('album-form-title').textContent = 'Edit Album';
        }

        function renderBandPage() {
            const bandSlug = getQueryParam('band');
            const container = document.getElementById('band-page-content');

            if (!bandSlug) {
                container.innerHTML = '<div class="empty-state">No band specified in the URL.</div>';
                return;
            }

            const band = getBandBySlug(bandSlug);
            if (!band) {
                container.innerHTML = '<div class="empty-state">Band not found. Make sure the band still exists.</div>';
                return;
            }

            document.title = `${band.name} - Chronoplast Records`;
            const albumsHtml = (band.albums || [])
                .map(
                    (album, index) => `
                    <div class="album-card">
                        <h3>${escapeHtml(album.title)} <span class="band-status active">${escapeHtml(album.type)}</span></h3>
                        <p class="band-meta">${escapeHtml(album.year)} • ${escapeHtml(album.label)} • ${escapeHtml(album.format)}</p>
                        <p class="band-description">${escapeHtml(album.description)}</p>
                        <div class="band-actions">
                            <button class="edit-album-button edit-button" type="button" data-index="${index}">Edit</button>
                            <a class="submit-button" href="album.html?album=${encodeURIComponent(album.slug)}">Album Page</a>
                        </div>
                    </div>
                `
                )
                .join('');

            container.innerHTML = `
                <div class="band-detail-view">
                    <h2>${escapeHtml(band.name)}</h2>
                    <div class="band-detail-meta">
                        <div class="meta-item"><div class="meta-label">Genre</div><div>${escapeHtml(band.genre)}</div></div>
                        <div class="meta-item"><div class="meta-label">Country</div><div>${escapeHtml(band.country)}</div></div>
                        <div class="meta-item"><div class="meta-label">Years Active</div><div>${escapeHtml(band.years)}</div></div>
                        <div class="meta-item"><div class="meta-label">Status</div><div><span class="band-status ${band.status}">${escapeHtml(band.status.charAt(0).toUpperCase() + band.status.slice(1))}</span></div></div>
                    </div>
                    ${band.members ? `<div class="meta-item" style="grid-column: 1 / -1;"><div class="meta-label">Current Members</div><div>${escapeHtml(band.members)}</div></div>` : ''}
                    <div class="band-detail-description">${escapeHtml(band.description).replace(/\n/g, '<br>')}</div>
                    <div class="album-section">
                        <h3>Discography</h3>
                        <div class="album-list">${albumsHtml || '<div class="empty-state">No albums yet. Add one below.</div>'}</div>
                    </div>
                    <div class="add-album-section">
                        <h3 id="album-form-title">Add Album</h3>
                        <form id="album-form" data-edit="false" data-edit-index="">
                            <div class="form-grid">
                                <div class="form-row">
                                    <label for="album-title">Album Title *</label>
                                    <input id="album-title" type="text" required placeholder="e.g., Ride the Lightning" maxlength="100">
                                </div>
                                <div class="form-row">
                                    <label for="album-year">Year *</label>
                                    <input id="album-year" type="text" required placeholder="e.g., 1984" maxlength="20">
                                </div>
                                <div class="form-row">
                                    <label for="album-type">Type *</label>
                                    <input id="album-type" type="text" required placeholder="e.g., Album" maxlength="50">
                                </div>
                                <div class="form-row">
                                    <label for="album-label">Label</label>
                                    <input id="album-label" type="text" placeholder="e.g., Elektra" maxlength="100">
                                </div>
                                <div class="form-row">
                                    <label for="album-format">Format</label>
                                    <input id="album-format" type="text" placeholder="e.g., LP, CD, Digital" maxlength="100">
                                </div>
                                <div class="form-row full">
                                    <label for="album-description">Notes</label>
                                    <textarea id="album-description" placeholder="Album description, lineup, extras..."></textarea>
                                </div>
                            </div>
                            <button type="submit" class="submit-button" id="album-form-button">Add Album</button>
                            <button type="button" class="back-button hidden" id="cancel-album-edit">Cancel Edit</button>
                        </form>
                        <div id="album-message" class="message hidden"></div>
                    </div>
                    <div class="band-actions">
                        <button class="submit-button" id="download-band-page">Download Band HTML</button>
                        <a class="back-button" href="crypt.html">Back to archive</a>
                    </div>
                </div>
            `;

            document.getElementById('download-band-page').addEventListener('click', () => downloadBandPage(band));
            document.getElementById('album-form').addEventListener('submit', handleAlbumFormSubmit);
            document.getElementById('cancel-album-edit').addEventListener('click', resetAlbumForm);
            document.querySelectorAll('.edit-album-button').forEach((button) => {
                button.addEventListener('click', () => {
                    const index = parseInt(button.dataset.index, 10);
                    if (!Number.isNaN(index)) {
                        editAlbum(index);
                    }
                });
            });

            const editAlbumSlug = getQueryParam('editAlbum');
            if (editAlbumSlug) {
                const albumIndex = (band.albums || []).findIndex((item) => item.slug === editAlbumSlug);
                if (albumIndex !== -1) {
                    editAlbum(albumIndex);
                }
            }
        }

        function resetAlbumForm() {
            const albumForm = document.getElementById('album-form');
            albumForm.dataset.edit = 'false';
            albumForm.dataset.editIndex = '';
            albumForm.reset();
            document.getElementById('album-form-button').textContent = 'Add Album';
            document.getElementById('cancel-album-edit').classList.add('hidden');
            document.getElementById('album-form-title').textContent = 'Add Album';
            document.getElementById('album-message').className = 'message hidden';
        }

        function handleAlbumFormSubmit(event) {
            event.preventDefault();
            const bandSlug = getQueryParam('band');
            const bands = getBands();
            const bandIndex = bands.findIndex((b) => b.slug === bandSlug);
            if (bandIndex === -1) return;
            const band = bands[bandIndex];

            const title = document.getElementById('album-title').value.trim();
            const year = document.getElementById('album-year').value.trim();
            const type = document.getElementById('album-type').value.trim();
            const label = document.getElementById('album-label').value.trim();
            const format = document.getElementById('album-format').value.trim();
            const description = document.getElementById('album-description').value.trim();
            const message = document.getElementById('album-message');
            const albumForm = document.getElementById('album-form');
            const isEdit = albumForm.dataset.edit === 'true';
            const editIndex = parseInt(albumForm.dataset.editIndex || '0', 10);

            if (!title || !year || !type) {
                message.textContent = 'Title, year, and type are required.';
                message.className = 'message error';
                return;
            }

            const slug = isEdit
                ? createUniqueAlbumSlug(band, title, band.albums[editIndex]?.slug)
                : createUniqueAlbumSlug(band, title);

            const albumData = { title, year, type, label, format, description, slug };

            if (isEdit) {
                band.albums[editIndex] = albumData;
                message.textContent = 'Album updated successfully!';
            } else {
                band.albums = band.albums || [];
                band.albums.push(albumData);
                message.textContent = 'Album added successfully!';
            }

            bands[bandIndex] = band;
            saveBands(bands);
            resetAlbumForm();
            renderBandPage();
        }

        renderBandPage();
    