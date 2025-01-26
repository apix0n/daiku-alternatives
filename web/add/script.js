function createPreview(mediaData, overrides = {}) {
    var titlesHtml = ``
    if (!overrides["title"]) {
        if (mediaData.title.english) {
            titlesHtml += `<span data-lang="english">${mediaData.title.english}</span>`;
        }
        titlesHtml += `<span data-lang="romaji">${mediaData.title.romaji}</span>`;
    } else {
        titlesHtml += `<span>${overrides["title"]}</span>`;
        if (mediaData.title.english) {
            titlesHtml += `<span><span data-lang="english">${mediaData.title.english}</span> - <span data-lang="romaji">${mediaData.title.romaji}</span></span>`;
        } else {
            titlesHtml += `<span data-lang="romaji">${mediaData.title.romaji}</span>`;
        }
    }

    var mediaElement = document.getElementsByClassName("preview")[0]
    mediaElement.setAttribute("data-type", mediaData.type);
    mediaElement.setAttribute("data-status", mediaData.status);
    mediaElement.innerHTML = `
    <div class="image" style="background-image: url(${overrides.image && overrides.image["data"] || mediaData.coverImage.large})"></div>
    <div class="titles">
      ${titlesHtml}
    </div>
    <div class="informations">
      <span>${mediaData.type.toLowerCase()} · ${mediaData.startDate.year ? mediaData.startDate.year : ''} ${mediaData.format !== "MANGA" ? mediaData.format.replace("_", " ") : ''}</span>
      ${overrides["airingEpisodesOffset"] || mediaData.nextAiringEpisode ? `<span class="next-episode">next episode: ${mediaData.nextAiringEpisode.episode + (parseInt(overrides["airingEpisodesOffset"]) || 0)}</span>` : ''}
      ${overrides["accentColor"] || mediaData.coverImage.color ? `<span class="accent-color">accent colour: <div class="accent-color-square" style="--accent: ${overrides["accentColor"] || mediaData.coverImage.color}"></div><code>${overrides["accentColor"] || mediaData.coverImage.color}</code></span>` : ''}
      <span class="id">${mediaData.id}</span>
    </div>
    `;
}

async function getLastArchiveURL(url) {
    const response = await fetch(`https://archive.org/wayback/available?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    return data.archived_snapshots.closest?.url || null;
}

document.addEventListener('DOMContentLoaded', async function () {
    const alInfo = await searchAniList(`alid:${getQueryVariable("id")}`)
    createPreview(alInfo.data.Page.media[0]);

    const colorTextInput = document.getElementById('accent');
    Coloris({
        theme: 'polaroid',
        alpha: false,
        themeMode: "auto",
        onChange: (color) => {
            colorTextInput.value = color;
            updatePreview();
        }
    });

    document.getElementById('removeColorButton').addEventListener('click', () => {
        document.querySelector("input[data-coloris]").value = '';
        colorTextInput.value = '';
        updatePreview();
    });

    document.getElementById('removeTitleButton').addEventListener('click', () => {
        document.getElementById("title").value = '';
        updatePreview();
    });

    document.getElementById("nextEpisodeOffset").addEventListener("keypress", function (e) {
        if (
            e.key.length === 1 && e.key !== '-' && isNaN(e.key) && !e.ctrlKey || e.key === '-' && e.target.value.toString().indexOf('-') > -1
        ) {
            e.preventDefault();
        }
    });

    document.getElementById('removeOffsetButton').addEventListener('click', () => {
        document.getElementById("nextEpisodeOffset").value = '';
        updatePreview();
    });

    let imageData, imageExtension, imageUrls = [];

    document.getElementById('coverUpload').addEventListener('change', () => {
        const file = document.getElementById("coverUpload").files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageType = file.type
                if (imageType === 'image/jpeg') {
                    imageExtension = '.jpg';
                } else if (imageType === 'image/png') {
                    imageExtension = '.png';
                } else if (imageType === 'image/webp') {
                    imageExtension = '.webp';
                } else {
                    imageData = undefined;
                    document.getElementById('removeCoverButton').click();
                    alert('Invalid image type. Please upload a JPEG, PNG or WebP image.');
                    return;
                }
                imageData = e.target.result;
                updatePreview();
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('coverUploadURL').addEventListener('change', () => {
        imageUrls.push(self.value);
        updatePreview();
    });

    document.getElementById('removeCoverButton').addEventListener('click', () => {
        document.getElementById("coverUpload").value = '';
        document.getElementById("coverURL").value = '';
        document.getElementById('coverUploadURL').value = '';
        document.getElementById('additionalURLs').innerHTML = '';
        imageData = undefined;
        imageExtension = undefined;
        imageUrls = [];
        updatePreview();
    });

    document.querySelectorAll("input[name='coversrc']").forEach(e => {
        e.addEventListener('change', () => {
            imageData = undefined;
            document.getElementById("coverUpload").value = '';
            updatePreview();
        });
    });

    document.getElementById('coverURL').addEventListener('change', async () => {
        if (!document.getElementById('coverURL').value) {
            imageData = undefined;
            updatePreview();
            return;
        }
        try {
            const response = await fetch(document.getElementById('coverURL').value);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageType = blob.type
                if (imageType === 'image/jpeg') {
                    imageExtension = '.jpg';
                } else if (imageType === 'image/png') {
                    imageExtension = '.png';
                } else if (imageType === 'image/webp') {
                    imageExtension = '.webp';
                } else {
                    imageData = undefined;
                    document.getElementById('removeCoverButton').click();
                    alert('Invalid image type. Please upload a JPEG, PNG or WebP image.');
                    return;
                }
                imageData = e.target.result;
                imageUrls.push(document.getElementById('coverURL').value);
                updatePreview();
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            alert(`Error while loading image: ${error.message}\n\nTry uploading the image from storage instead.`);
        }
    });

    document.getElementById('downloadImageButton').addEventListener('click', () => {
        if (imageData && imageExtension) {
            const link = document.createElement('a');
            link.href = imageData;
            link.download = `original${imageExtension}`;
            link.click();
        } else {
            alert('No image selected to download.');
        }
    });

    let notesString;
    document.querySelector('textarea[name="changeNotes"]').addEventListener('input', () => {
        notesString = document.querySelector('textarea[name="changeNotes"]').value;
        updatePreview();
    });

    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            updatePreview();
        });
    });

    document.getElementById('saveButton').addEventListener('click', async () => {
        updatePreview();
        const zip = new JSZip();

        // Create infos.json

        const image = imageUrls.length > 0 ? {
            original: imageUrls.length === 1 ? imageUrls[0] : imageUrls,
            archive: imageUrls.length === 1 ? 
                await getLastArchiveURL(imageUrls[0]) : 
                await Promise.all(imageUrls.map(url => getLastArchiveURL(url))),
            date: new Date().toISOString()
        } : undefined;
        
        const infos = {
            title: inputValues["title"] || undefined,
            airingEpisodesOffset: inputValues["airingEpisodesOffset"] || undefined,
            image: image,
        };

        Object.values(infos).filter(v => v !== undefined).length !== 0 ? zip.file("infos.json", JSON.stringify(infos, null, 2)) : undefined;

        // Add image if exists
        if (imageData && imageExtension) {
            const imageBlob = await fetch(imageData).then(r => r.blob());
            zip.file(`original${imageExtension}`, imageBlob);
        }

        // Add notes if exists
        if ((infos.length || imageData && imageExtension) && notesString) {
            zip.file("readme.txt", notesString);
        }

        // if zip empty don't download and alert
        if (!Object.keys(zip.files).length) {
            alert('Nothing to save.');
            return;
        }

        // Generate and download zip
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${alInfo.data.Page.media[0].id}.zip`;
        link.click();
        URL.revokeObjectURL(link.href);
    });

    const inputValues = {};
    function updatePreview() {
        inputValues["title"] = document.getElementById("title").value;
        inputValues["accentColor"] = document.getElementById("accent").value;
        inputValues["airingEpisodesOffset"] = document.getElementById("nextEpisodeOffset").value;
        inputValues["image"] = {};
        inputValues["image"]["data"] = imageData;
        inputValues["image"]["extension"] = imageExtension;
        inputValues["image"]["original"] = imageUrls;
        inputValues["notes"] = notesString;
        createPreview(alInfo.data.Page.media[0], inputValues);
    }

    // Add handler for additional URLs
    document.getElementById('addURLButton').addEventListener('click', () => {
        const urlContainer = document.getElementById('additionalURLs');
        const newUrlInput = document.createElement('div');
        newUrlInput.innerHTML = `
            <input type="text" class="additional-url" pattern="https?://.+" placeholder="Additional image source">
            <button type="button" class="remove-url">Remove</button>
        `;
        urlContainer.push(newUrlInput);

        newUrlInput.querySelector('.remove-url').addEventListener('click', () => {
            newUrlInput.remove();
            updateUrls();
        });

        newUrlInput.querySelector('.additional-url').addEventListener('change', updateUrls);
    });

    function updateUrls() {
        const mainUrl = document.getElementById('coverUploadURL').value;
        const additionalUrls = Array.from(document.querySelectorAll('.additional-url')).map(input => input.value);
        imageUrls = [mainUrl, ...additionalUrls].filter(url => url); // Filter out empty values
        updatePreview();
    }

    document.getElementById('coverUploadURL').addEventListener('change', updateUrls);
});